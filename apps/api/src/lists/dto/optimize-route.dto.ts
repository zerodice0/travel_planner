import { IsBoolean, IsNumber, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;
}

export class OptimizeRouteDto {
  @ValidateNested()
  @Type(() => LocationDto)
  startLocation!: LocationDto;

  @IsBoolean()
  includeVisited!: boolean;
}
