import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    // Get custom categories
    const customCategories = await this.prisma.category.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Get places count for each custom category
    const customCategoriesWithCount = await Promise.all(
      customCategories.map(async (category) => {
        const placesCount = await this.prisma.userPlace.count({
          where: {
            userId,
            customCategory: category.name,
          },
        });

        return {
          id: category.id,
          name: category.name,
          color: category.color,
          icon: category.icon,
          isCustom: category.isCustom,
          placesCount,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        };
      }),
    );

    // Define default categories
    const defaultCategories = [
      { id: 'default-restaurant', name: '맛집', value: 'restaurant', color: '#FF6B6B' },
      { id: 'default-cafe', name: '카페', value: 'cafe', color: '#A0522D' },
      { id: 'default-attraction', name: '관광', value: 'attraction', color: '#4ECDC4' },
      { id: 'default-shopping', name: '쇼핑', value: 'shopping', color: '#FFE66D' },
      { id: 'default-culture', name: '문화', value: 'culture', color: '#95E1D3' },
      { id: 'default-nature', name: '자연', value: 'nature', color: '#38A169' },
      { id: 'default-accommodation', name: '숙박', value: 'accommodation', color: '#5D5FEF' },
      { id: 'default-etc', name: '기타', value: 'etc', color: '#95A5A6' },
    ];

    // Get places count for each default category
    const defaultCategoriesWithCount = await Promise.all(
      defaultCategories.map(async (category) => {
        const placesCount = await this.prisma.userPlace.count({
          where: {
            userId,
            place: {
              category: category.value,
            },
          },
        });

        return {
          id: category.id,
          name: category.name,
          color: category.color,
          isCustom: false,
          placesCount,
        };
      }),
    );

    return {
      categories: [...defaultCategoriesWithCount, ...customCategoriesWithCount],
    };
  }

  async create(userId: string, createCategoryDto: CreateCategoryDto) {
    const category = await this.prisma.category.create({
      data: {
        userId,
        name: createCategoryDto.name,
        color: createCategoryDto.color,
        isCustom: true,
      },
    });

    return {
      id: category.id,
      name: category.name,
      color: category.color,
      icon: category.icon,
      isCustom: category.isCustom,
      placesCount: 0,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  async update(userId: string, id: string, updateCategoryDto: UpdateCategoryDto) {
    // Check if category exists and belongs to user
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (!category.isCustom) {
      throw new BadRequestException('Cannot update default category');
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });

    const placesCount = await this.prisma.userPlace.count({
      where: {
        userId,
        customCategory: updated.name,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      color: updated.color,
      icon: updated.icon,
      isCustom: updated.isCustom,
      placesCount,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async delete(userId: string, id: string): Promise<void> {
    // Check if category exists and belongs to user
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (!category.isCustom) {
      throw new BadRequestException('Cannot delete default category');
    }

    // Move all user places with this custom category to 'etc'
    await this.prisma.userPlace.updateMany({
      where: {
        userId,
        customCategory: category.name,
      },
      data: {
        customCategory: null,
      },
    });

    // Delete the category
    await this.prisma.category.delete({
      where: { id },
    });
  }
}
