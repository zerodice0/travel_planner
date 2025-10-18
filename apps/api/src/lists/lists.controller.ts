import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ListsService } from './lists.service';
import { JwtAuthGuard, JwtPayload } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { ListQueryDto } from './dto/list-query.dto';
import { ListsResponseDto } from './dto/list-response.dto';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { ListDetailResponseDto } from './dto/list-detail-response.dto';
import { AddPlacesDto } from './dto/add-places.dto';
import { ReorderPlacesDto } from './dto/reorder-places.dto';
import { OptimizeRouteDto } from './dto/optimize-route.dto';

interface RequestWithUser {
  user: JwtPayload;
}

@Controller('lists')
@UseGuards(JwtAuthGuard)
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Get()
  async findAll(
    @Request() req: RequestWithUser,
    @Query() query: ListQueryDto,
  ): Promise<ListsResponseDto> {
    return this.listsService.findAll(req.user.userId, query);
  }

  @Get(':id')
  async findOne(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<ListDetailResponseDto> {
    return this.listsService.findOne(req.user.userId, id);
  }

  @Post()
  @HttpCode(201)
  @UseGuards(EmailVerifiedGuard)
  async create(
    @Request() req: RequestWithUser,
    @Body() createListDto: CreateListDto,
  ): Promise<ListDetailResponseDto> {
    return this.listsService.create(req.user.userId, createListDto);
  }

  @Put(':id')
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateListDto: UpdateListDto,
  ): Promise<ListDetailResponseDto> {
    return this.listsService.update(req.user.userId, id, updateListDto);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Request() req: RequestWithUser, @Param('id') id: string): Promise<void> {
    return this.listsService.delete(req.user.userId, id);
  }

  @Get(':id/places')
  async getPlaces(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Query('sort') sort?: string,
  ) {
    return this.listsService.getPlaces(req.user.userId, id, sort);
  }

  @Post(':id/places')
  async addPlaces(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() addPlacesDto: AddPlacesDto,
  ) {
    return this.listsService.addPlaces(req.user.userId, id, addPlacesDto);
  }

  @Delete(':listId/places/:placeId')
  @HttpCode(204)
  async removePlace(
    @Request() req: RequestWithUser,
    @Param('listId') listId: string,
    @Param('placeId') placeId: string,
  ): Promise<void> {
    return this.listsService.removePlace(req.user.userId, listId, placeId);
  }

  @Patch(':id/places/reorder')
  async reorderPlaces(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() reorderDto: ReorderPlacesDto,
  ) {
    return this.listsService.reorderPlaces(req.user.userId, id, reorderDto);
  }

  @Post(':id/optimize-route')
  async optimizeRoute(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() optimizeDto: OptimizeRouteDto,
  ) {
    return this.listsService.optimizeRoute(req.user.userId, id, optimizeDto);
  }
}
