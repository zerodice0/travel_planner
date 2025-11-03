import { Controller, Get, Post, Param, Query, Body, Request, UseGuards, HttpCode } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PlacesService } from './places.service';
import { PlaceQueryDto, ViewportQueryDto, NearestPlaceQueryDto } from './dto/place-query.dto';
import {
  PublicPlaceDetailResponseDto,
  PublicPlacesResponseDto,
} from './dto/public-place-response.dto';
import { CreatePublicPlaceDto } from './dto/create-public-place.dto';
import { JwtAuthGuard, JwtPayload } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { ValidateCoordinatesPipe } from '../common/pipes/validate-coordinates.pipe';

interface RequestWithUser extends Request {
  user: JwtPayload;
}

@Controller('public/places')
export class PublicPlacesController {
  constructor(private readonly placesService: PlacesService) {}

  // 검색: 1분에 20회
  @Get()
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  async findAll(
    @Query() query: PlaceQueryDto,
    @Query('keyword') keyword?: string,
  ): Promise<PublicPlacesResponseDto> {
    // If keyword is provided, use FTS5 search
    if (keyword) {
      return this.placesService.searchPublicPlaces({
        keyword,
        category: query.category,
        limit: query.limit ?? 50,
        offset: query.offset ?? 0,
      });
    }

    // Otherwise, return all public places
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

  // 장소 추가: 1시간에 10회
  @Post()
  @Throttle({ long: { limit: 10, ttl: 3600000 } })
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @HttpCode(201)
  async create(
    @Request() req: RequestWithUser,
    @Body(ValidateCoordinatesPipe) createPublicPlaceDto: CreatePublicPlaceDto,
  ): Promise<PublicPlaceDetailResponseDto> {
    return this.placesService.createPublicPlace(createPublicPlaceDto);
  }
}
