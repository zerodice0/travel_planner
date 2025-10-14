import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController, PlacesReviewsController } from './reviews.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReviewsController, PlacesReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
