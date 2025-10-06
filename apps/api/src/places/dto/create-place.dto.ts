import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class CreatePlaceDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsString()
  address!: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsString()
  @MaxLength(50)
  category!: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  customCategory?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  labels?: string[];

  @IsBoolean()
  @IsOptional()
  visited?: boolean;

  @IsString()
  @IsOptional()
  externalUrl?: string;

  @IsString()
  @IsOptional()
  externalId?: string;
}
