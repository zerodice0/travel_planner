import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { UsersModule } from './users/users.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ListsModule } from './lists/lists.module';
import { PlacesModule } from './places/places.module';
import { SearchModule } from './search/search.module';
import { CategoriesModule } from './categories/categories.module';
import { ReviewsModule } from './reviews/reviews.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthModule } from './health/health.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1초
        limit: 3, // 1초에 3회
      },
      {
        name: 'medium',
        ttl: 60000, // 1분
        limit: 20, // 1분에 20회
      },
      {
        name: 'long',
        ttl: 3600000, // 1시간
        limit: 100, // 1시간에 100회
      },
    ]),
    PrismaModule,
    AuthModule.forRoot(),
    UploadModule,
    UsersModule,
    DashboardModule,
    ListsModule,
    PlacesModule,
    SearchModule,
    CategoriesModule,
    ReviewsModule,
    NotificationsModule,
    HealthModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
