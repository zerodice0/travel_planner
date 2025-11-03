import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LabelCount {
  @ApiProperty()
  label!: string;

  @ApiProperty()
  count!: number;
}

export class PublicPlaceResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty()
  address!: string;

  @ApiPropertyOptional()
  phone?: string | null;

  @ApiProperty()
  latitude!: number;

  @ApiProperty()
  longitude!: number;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty({ type: [String] })
  photos!: string[];

  @ApiProperty()
  reviewCount!: number;

  @ApiProperty({ type: [LabelCount] })
  topLabels!: LabelCount[];

  @ApiPropertyOptional()
  externalId?: string | null;

  @ApiProperty()
  createdAt!: Date;
}

export class PublicPlaceDetailResponseDto extends PublicPlaceResponseDto {
  @ApiPropertyOptional()
  externalUrl?: string | null;

  @ApiProperty()
  updatedAt!: Date;
}

export class PublicPlacesResponseDto {
  @ApiProperty({ type: [PublicPlaceResponseDto] })
  places!: PublicPlaceResponseDto[];

  @ApiProperty()
  total!: number;
}
