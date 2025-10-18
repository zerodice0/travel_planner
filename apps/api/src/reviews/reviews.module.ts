import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController, PlacesReviewsController } from './reviews.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [ReviewsController, PlacesReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
