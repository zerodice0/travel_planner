import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { HealthResponseDto } from './dto/health-response.dto';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: '헬스 체크',
    description: 'API 서버, 데이터베이스, 스토리지의 상태를 확인합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '헬스 체크 성공',
    type: HealthResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: '서비스 일부 또는 전체 장애',
  })
  async check(): Promise<HealthResponseDto> {
    return this.healthService.getHealth();
  }
}
