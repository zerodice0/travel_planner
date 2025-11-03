export class PlaceResponseDto {
  id!: string;
  name!: string;
  category!: string;
  address!: string;
  phone?: string;
  latitude!: number;
  longitude!: number;
  visited!: boolean;
  externalUrl?: string;
  externalId?: string;
  createdAt!: Date;

  // Custom fields for marker visualization
  customName?: string;
  customCategory?: string;
  labels!: string[];
}

export class PlacesResponseDto {
  places!: PlaceResponseDto[];
}
