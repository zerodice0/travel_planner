import { IsString, IsOptional, IsIn, MinLength } from 'class-validator';

export class ReviewReviewDto {
  @IsIn(['approved', 'rejected', 'hidden'])
  status!: 'approved' | 'rejected' | 'hidden';

  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'reviewNotes must be at least 5 characters long' })
  reviewNotes?: string;
}
