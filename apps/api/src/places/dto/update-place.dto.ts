import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDate,
  IsArray,
  MaxLength,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePlaceDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  category?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  customName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  customCategory?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  labels?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  note?: string;

  @IsBoolean()
  @IsOptional()
  visited?: boolean;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  visitedAt?: Date;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  visitNote?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsNumber()
  @IsOptional()
  estimatedCost?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photos?: string[];
}
