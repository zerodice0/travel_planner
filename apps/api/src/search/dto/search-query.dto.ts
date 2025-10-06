import { IsOptional, IsString, IsEnum, IsBoolean, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchQueryDto {
  @IsNotEmpty()
  @IsString()
  q!: string;

  @IsOptional()
  @IsEnum(['all', 'place', 'list'])
  type?: 'all' | 'place' | 'list';

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  visited?: boolean;
}
