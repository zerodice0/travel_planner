import { IsString } from 'class-validator';

export class AddToListDto {
  @IsString()
  listId!: string;
}
