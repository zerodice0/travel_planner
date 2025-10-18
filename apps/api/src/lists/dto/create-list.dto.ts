import {
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class IconDto {
  @IsEnum(['category', 'emoji', 'image'])
  type!: 'category' | 'emoji' | 'image';

  @IsString()
  value!: string;
}

export class CreateListDto {
  @IsString()
  @MaxLength(50)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;

  @ValidateNested()
  @Type(() => IconDto)
  icon!: IconDto;

  @IsString()
  @IsOptional()
  @MaxLength(7)
  colorTheme?: string;
}
