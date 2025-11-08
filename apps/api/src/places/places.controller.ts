import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  UsePipes,
  HttpCode,
  Logger,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PlacesService } from './places.service';
import { JwtAuthGuard, JwtPayload } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import { ProfanityFilterPipe } from '../common/pipes/profanity-filter.pipe';
import { PlaceQueryDto } from './dto/place-query.dto';
import { PlacesResponseDto } from './dto/place-response.dto';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { PlaceDetailResponseDto } from './dto/place-detail-response.dto';
import { AddToListDto } from './dto/add-to-list.dto';

interface RequestWithUser extends Request {
  user: JwtPayload;
}

@Controller('places')
@UseGuards(JwtAuthGuard)
export class PlacesController {
  private readonly logger = new Logger(PlacesController.name);

  constructor(private readonly placesService: PlacesService) {}

  @Get()
  async findAll(
    @Request() req: RequestWithUser,
    @Query() query: PlaceQueryDto,
  ): Promise<PlacesResponseDto> {
    return this.placesService.findAll(req.user.userId, query);
  }

  @Get(':id')
  async findOne(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<PlaceDetailResponseDto> {
    return this.placesService.findOne(req.user.userId, id);
  }

  @Post()
  @UseGuards(EmailVerifiedGuard, RateLimitGuard)
  @UsePipes(ProfanityFilterPipe)
  async create(
    @Request() req: RequestWithUser,
    @Body() createPlaceDto: CreatePlaceDto,
  ): Promise<PlaceDetailResponseDto> {
    this.logger.log(
      `Creating place for user ${req.user.userId}: ${JSON.stringify({
        name: createPlaceDto.name,
        category: createPlaceDto.category,
        latitude: createPlaceDto.latitude,
        longitude: createPlaceDto.longitude,
        externalId: createPlaceDto.externalId?.substring(0, 50) + '...',
      })}`,
    );

    try {
      const result = await this.placesService.create(req.user.userId, createPlaceDto);
      this.logger.log(`Place created successfully: ${result.id}`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to create place for user ${req.user.userId}: ${errorMessage}`,
        errorStack,
      );

      // Re-throw specific exceptions
      if (error instanceof ConflictException) {
        throw error;  // 409 Conflict for duplicates
      }

      // Wrap other errors
      throw new InternalServerErrorException('Failed to create place');
    }
  }

  @Patch(':id')
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updatePlaceDto: UpdatePlaceDto,
  ): Promise<PlaceDetailResponseDto> {
    return this.placesService.update(req.user.userId, id, updatePlaceDto);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Request() req: RequestWithUser, @Param('id') id: string): Promise<void> {
    return this.placesService.delete(req.user.userId, id);
  }

  @Get(':id/lists')
  async findLists(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.placesService.findLists(req.user.userId, id);
  }

  @Post(':placeId/lists')
  @HttpCode(201)
  async addToList(
    @Request() req: RequestWithUser,
    @Param('placeId') placeId: string,
    @Body() addToListDto: AddToListDto,
  ): Promise<void> {
    return this.placesService.addToList(
      req.user.userId,
      placeId,
      addToListDto.listId,
    );
  }

  @Delete(':placeId/lists/:listId')
  @HttpCode(204)
  async removeFromList(
    @Request() req: RequestWithUser,
    @Param('placeId') placeId: string,
    @Param('listId') listId: string,
  ): Promise<void> {
    return this.placesService.removeFromList(req.user.userId, placeId, listId);
  }

  @Post('validate-duplicate')
  async validateDuplicate(
    @Body() dto: { name: string; latitude: number; longitude: number },
  ) {
    const duplicates = await this.placesService['detectDuplicates'](
      dto.name,
      dto.latitude,
      dto.longitude,
    );
    return {
      hasDuplicates: duplicates.length > 0,
      duplicates,
    };
  }

  @Get('rate-limit-status')
  async getRateLimitStatus(@Request() req: RequestWithUser) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const count = await this.placesService['prisma'].userPlace.count({
      where: {
        userId: req.user.userId,
        createdAt: { gte: today },
      },
    });

    const user = await this.placesService['prisma'].user.findUnique({
      where: { id: req.user.userId },
    });
    const limit = user?.emailVerified ? 10 : 5;

    return {
      limit,
      used: count,
      remaining: Math.max(0, limit - count),
      resetsAt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    };
  }
}
