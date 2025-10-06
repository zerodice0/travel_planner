import { IsArray, IsString } from 'class-validator';

export class AddPlacesDto {
  @IsArray()
  @IsString({ each: true })
  placeIds!: string[];
}
