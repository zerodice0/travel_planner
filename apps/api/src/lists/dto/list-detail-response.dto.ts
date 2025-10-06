export interface ListDetailResponseDto {
  id: string;
  name: string;
  description?: string;
  iconType: string;
  iconValue: string;
  colorTheme?: string;
  placesCount: number;
  visitedCount: number;
  createdAt: Date;
  updatedAt: Date;
}
