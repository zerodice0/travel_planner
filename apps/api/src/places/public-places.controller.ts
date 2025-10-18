import { Controller, Get, Param, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PlacesService } from './places.service';
import { PlaceQueryDto, ViewportQueryDto, NearestPlaceQueryDto } from './dto/place-query.dto';
import {
  PublicPlaceDetailResponseDto,
  PublicPlacesResponseDto,
} from './dto/public-place-response.dto';

// Public API는 더 관대한 rate limiting 적용 (30회/60초)
@Throttle({ default: { limit: 30, ttl: 60000 } })
@Controller('public/places')
export class PublicPlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get()
  async findAll(@Query() query: PlaceQueryDto): Promise<PublicPlacesResponseDto> {
    return this.placesService.findAllPublic(query);
  }

  @Get('viewport')
  async findByViewport(@Query() query: ViewportQueryDto): Promise<PublicPlacesResponseDto> {
    return this.placesService.findByViewport(query);
  }

  @Get('nearest')
  async findNearest(@Query() query: NearestPlaceQueryDto): Promise<PublicPlacesResponseDto> {
    return this.placesService.findNearest(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PublicPlaceDetailResponseDto> {
    return this.placesService.findOnePublic(id);
  }
}
