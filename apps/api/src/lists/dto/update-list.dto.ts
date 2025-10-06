import {
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class IconDto {
  @IsEnum(['emoji', 'image'])
  type!: 'emoji' | 'image';

  @IsString()
  value!: string;
}

export class UpdateListDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;

  @ValidateNested()
  @Type(() => IconDto)
  @IsOptional()
  icon?: IconDto;

  @IsString()
  @IsOptional()
  @MaxLength(7)
  colorTheme?: string;
}
