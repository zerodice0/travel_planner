import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard, JwtPayload } from '../auth/guards/jwt-auth.guard';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

interface RequestWithUser {
  user: JwtPayload;
}

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll(@Request() req: RequestWithUser) {
    return this.categoriesService.findAll(req.user.userId);
  }

  @Post()
  @HttpCode(201)
  async create(@Request() req: RequestWithUser, @Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(req.user.userId, createCategoryDto);
  }

  @Put(':id')
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(req.user.userId, id, updateCategoryDto);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Request() req: RequestWithUser, @Param('id') id: string): Promise<void> {
    await this.categoriesService.delete(req.user.userId, id);
  }
}
