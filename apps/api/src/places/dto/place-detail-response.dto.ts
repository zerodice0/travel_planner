import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlaceDetailResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  address!: string;

  @ApiPropertyOptional()
  phone?: string | null;

  @ApiProperty()
  latitude!: number;

  @ApiProperty()
  longitude!: number;

  @ApiProperty()
  category!: string;

  @ApiPropertyOptional()
  customName?: string | null;

  @ApiPropertyOptional()
  customCategory?: string | null;

  @ApiProperty({ type: [String] })
  labels!: string[];

  @ApiPropertyOptional()
  note?: string | null;

  @ApiProperty()
  visited!: boolean;

  @ApiPropertyOptional()
  visitedAt?: Date | null;

  @ApiPropertyOptional()
  visitNote?: string | null;

  @ApiPropertyOptional()
  rating?: number | null;

  @ApiPropertyOptional()
  estimatedCost?: number | null;

  @ApiProperty({ type: [String] })
  photos!: string[];

  @ApiPropertyOptional()
  externalUrl?: string | null;

  @ApiPropertyOptional()
  externalId?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
