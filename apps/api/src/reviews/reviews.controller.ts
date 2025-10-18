import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard, JwtPayload } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewResponseDto, ReviewsResponseDto } from './dto/review-response.dto';

interface RequestWithUser extends Request {
  user: JwtPayload;
}

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('user-places/:userPlaceId')
  @UseGuards(EmailVerifiedGuard)
  async create(
    @Request() req: RequestWithUser,
    @Param('userPlaceId') userPlaceId: string,
    @Body() createReviewDto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.create(req.user.userId, userPlaceId, createReviewDto);
  }

  @Get('my-reviews')
  async findMyReviews(@Request() req: RequestWithUser): Promise<ReviewsResponseDto> {
    return this.reviewsService.findByUser(req.user.userId);
  }

  @Patch(':id')
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.update(req.user.userId, id, updateReviewDto);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Request() req: RequestWithUser, @Param('id') id: string): Promise<void> {
    return this.reviewsService.delete(req.user.userId, id);
  }

  @Patch(':id/visibility')
  async toggleVisibility(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.toggleVisibility(req.user.userId, id);
  }
}

@Controller('places')
export class PlacesReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get(':placeId/reviews')
  async findByPlace(@Param('placeId') placeId: string): Promise<ReviewsResponseDto> {
    return this.reviewsService.findByPlace(placeId);
  }
}
