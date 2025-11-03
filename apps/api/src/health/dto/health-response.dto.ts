import { ApiProperty } from '@nestjs/swagger';

export class HealthCheckStatusDto {
  @ApiProperty({ description: '서비스 상태', example: 'ok' })
  status!: 'ok' | 'error';

  @ApiProperty({ description: '상태 메시지', example: 'Healthy', required: false })
  message?: string;
}

export class HealthResponseDto {
  @ApiProperty({ description: '전체 상태', example: 'ok' })
  status!: 'ok' | 'degraded' | 'error';

  @ApiProperty({ description: '타임스탬프', example: '2025-10-22T14:30:00Z' })
  timestamp!: string;

  @ApiProperty({ description: '애플리케이션 버전', example: '0.1.0' })
  version!: string;

  @ApiProperty({ description: '환경', example: 'development' })
  environment!: string;

  @ApiProperty({ description: 'Git 커밋 해시', example: 'abc1234', required: false })
  commit?: string;

  @ApiProperty({ description: '데이터베이스 상태', type: HealthCheckStatusDto })
  database!: HealthCheckStatusDto;

  @ApiProperty({ description: '스토리지 상태', type: HealthCheckStatusDto })
  storage!: HealthCheckStatusDto;

  @ApiProperty({ description: '가동 시간 (초)', example: 3600 })
  uptime!: number;
}
