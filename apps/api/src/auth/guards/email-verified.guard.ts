import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtPayload } from './jwt-auth.guard';

/**
 * 이메일 인증이 완료된 사용자만 접근할 수 있도록 제한하는 가드
 *
 * 사용법:
 * @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
 *
 * 주의: JwtAuthGuard와 함께 사용해야 합니다 (JwtAuthGuard가 먼저 실행되어야 함)
 */
@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user) {
      throw new ForbiddenException('인증이 필요합니다');
    }

    if (!user.emailVerified) {
      throw new ForbiddenException({
        message: '이메일 인증이 필요합니다',
        errorCode: 'EMAIL_NOT_VERIFIED',
        requiresEmailVerification: true,
      });
    }

    return true;
  }
}
