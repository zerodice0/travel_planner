export class ListResponseDto {
  id!: string;
  name!: string;
  description!: string | null;
  iconType!: string;
  iconValue!: string;
  colorTheme!: string | null;
  placesCount!: number;
  visitedCount!: number;
  createdAt!: Date;
  updatedAt!: Date;
}

export class ListsResponseDto {
  lists!: ListResponseDto[];
}
