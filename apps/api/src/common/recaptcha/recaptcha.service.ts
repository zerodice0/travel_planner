import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RecaptchaVerificationResponse {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  'error-codes'?: string[];
}

@Injectable()
export class RecaptchaService {
  private readonly logger = new Logger(RecaptchaService.name);
  private readonly secretKey: string;
  private readonly minScore: number = 0.5;

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('RECAPTCHA_SECRET_KEY') || '';
  }

  async verifyToken(token: string, action?: string): Promise<void> {
    if (!this.secretKey) {
      this.logger.warn('reCAPTCHA secret key is not configured');
      return; // 개발 환경에서는 검증 스킵
    }

    try {
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${this.secretKey}&response=${token}`,
      });

      const data: RecaptchaVerificationResponse = await response.json();

      // 검증 실패
      if (!data.success) {
        this.logger.error('reCAPTCHA verification failed', data['error-codes']);
        throw new UnauthorizedException('reCAPTCHA 검증에 실패했습니다');
      }

      // 점수 확인 (v3)
      if (data.score !== undefined && data.score < this.minScore) {
        this.logger.warn(`reCAPTCHA score too low: ${data.score}`);
        throw new UnauthorizedException('의심스러운 활동이 감지되었습니다');
      }

      // 액션 확인 (선택적)
      if (action && data.action !== action) {
        this.logger.warn(`reCAPTCHA action mismatch: expected ${action}, got ${data.action}`);
        throw new UnauthorizedException('잘못된 요청입니다');
      }

      this.logger.log(`reCAPTCHA verification successful (score: ${data.score})`);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('reCAPTCHA verification error', error);
      throw new UnauthorizedException('reCAPTCHA 검증 중 오류가 발생했습니다');
    }
  }
}
