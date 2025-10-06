import { IsArray, ValidateNested, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

class PlaceOrderDto {
  @IsString()
  placeId!: string;

  @IsNumber()
  @Min(0)
  order!: number;
}

export class ReorderPlacesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlaceOrderDto)
  order!: PlaceOrderDto[];
}
