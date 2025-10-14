import { IsOptional, IsInt, Min, Max, IsEnum, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export enum PlaceSortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  NAME = 'name',
}

export class PlaceQueryDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsEnum(PlaceSortField)
  sort?: PlaceSortField = PlaceSortField.CREATED_AT;
}

export class ViewportQueryDto {
  @Type(() => Number)
  @IsNumber()
  neLat!: number;

  @Type(() => Number)
  @IsNumber()
  neLng!: number;

  @Type(() => Number)
  @IsNumber()
  swLat!: number;

  @Type(() => Number)
  @IsNumber()
  swLng!: number;

  @IsOptional()
  @IsString()
  category?: string;
}
