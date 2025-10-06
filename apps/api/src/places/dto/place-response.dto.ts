export class PlaceResponseDto {
  id!: string;
  name!: string;
  category!: string;
  address!: string;
  visited!: boolean;
  createdAt!: Date;
}

export class PlacesResponseDto {
  places!: PlaceResponseDto[];
}
