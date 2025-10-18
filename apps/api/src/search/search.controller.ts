import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard, JwtPayload } from '../auth/guards/jwt-auth.guard';
import { SearchQueryDto } from './dto/search-query.dto';

interface RequestWithUser extends Request {
  user: JwtPayload;
}

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Request() req: RequestWithUser, @Query() query: SearchQueryDto) {
    return this.searchService.search(req.user.userId, query);
  }
}
