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
  HttpCode,
} from '@nestjs/common';
import { PlacesService } from './places.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlaceQueryDto } from './dto/place-query.dto';
import { PlacesResponseDto } from './dto/place-response.dto';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { PlaceDetailResponseDto } from './dto/place-detail-response.dto';
import { AddToListDto } from './dto/add-to-list.dto';

@Controller('places')
@UseGuards(JwtAuthGuard)
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get()
  async findAll(
    @Request() req: any,
    @Query() query: PlaceQueryDto,
  ): Promise<PlacesResponseDto> {
    return this.placesService.findAll(req.user.userId, query);
  }

  @Get(':id')
  async findOne(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<PlaceDetailResponseDto> {
    return this.placesService.findOne(req.user.userId, id);
  }

  @Post()
  async create(
    @Request() req: any,
    @Body() createPlaceDto: CreatePlaceDto,
  ): Promise<PlaceDetailResponseDto> {
    return this.placesService.create(req.user.userId, createPlaceDto);
  }

  @Patch(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updatePlaceDto: UpdatePlaceDto,
  ): Promise<PlaceDetailResponseDto> {
    return this.placesService.update(req.user.userId, id, updatePlaceDto);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Request() req: any, @Param('id') id: string): Promise<void> {
    return this.placesService.delete(req.user.userId, id);
  }

  @Get(':id/lists')
  async findLists(@Request() req: any, @Param('id') id: string) {
    return this.placesService.findLists(req.user.userId, id);
  }

  @Post(':placeId/lists')
  @HttpCode(201)
  async addToList(
    @Request() req: any,
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
    @Request() req: any,
    @Param('placeId') placeId: string,
    @Param('listId') listId: string,
  ): Promise<void> {
    return this.placesService.removeFromList(req.user.userId, placeId, listId);
  }
}
