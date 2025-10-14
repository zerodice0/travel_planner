import { Module } from '@nestjs/common';
import { PlacesController } from './places.controller';
import { PublicPlacesController } from './public-places.controller';
import { PlacesService } from './places.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PlacesController, PublicPlacesController],
  providers: [PlacesService],
})
export class PlacesModule {}
