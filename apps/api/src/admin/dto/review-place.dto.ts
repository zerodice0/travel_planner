import { IsString, IsOptional, IsIn, MinLength } from 'class-validator';

export class ReviewPlaceDto {
  @IsIn(['approved', 'rejected'])
  status!: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'reviewNotes must be at least 5 characters long' })
  reviewNotes?: string;
}
