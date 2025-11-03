import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import {
  HealthResponseDto,
  HealthCheckStatusDto,
} from './dto/health-response.dto';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime: number;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {
    this.startTime = Date.now();
  }

  async getHealth(): Promise<HealthResponseDto> {
    const [databaseStatus, storageStatus] = await Promise.all([
      this.checkDatabase(),
      this.checkStorage(),
    ]);

    const status = this.calculateOverallStatus(databaseStatus, storageStatus);

    return {
      status,
      timestamp: new Date().toISOString(),
      version: this.getVersion(),
      environment: this.config.get<string>('NODE_ENV', 'development'),
      commit: this.getCommitHash(),
      database: databaseStatus,
      storage: storageStatus,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  private async checkDatabase(): Promise<HealthCheckStatusDto> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', message: 'Connected' };
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  private async checkStorage(): Promise<HealthCheckStatusDto> {
    try {
      // R2 연결 확인 (간단한 헤드 요청)
      const isConnected = await this.storage.checkConnection();

      if (isConnected) {
        return { status: 'ok', message: 'Connected' };
      }

      return { status: 'error', message: 'Connection failed' };
    } catch (error) {
      this.logger.error('Storage health check failed:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  private calculateOverallStatus(
    database: HealthCheckStatusDto,
    storage: HealthCheckStatusDto,
  ): 'ok' | 'degraded' | 'error' {
    const allOk = database.status === 'ok' && storage.status === 'ok';
    const anyError = database.status === 'error' || storage.status === 'error';

    if (allOk) return 'ok';
    if (anyError && (database.status === 'error' || storage.status === 'error')) {
      // 데이터베이스 에러는 치명적
      return 'error';
    }
    return 'degraded';
  }

  private getVersion(): string {
    // package.json에서 버전 읽기 (빌드 시 주입 가능)
    return process.env.npm_package_version || '0.1.0';
  }

  private getCommitHash(): string | undefined {
    // GitHub Actions에서 주입한 커밋 해시
    return process.env.GIT_COMMIT_SHA || process.env.GITHUB_SHA;
  }
}
