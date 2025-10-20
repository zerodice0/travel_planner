import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../guards/jwt-auth.guard';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
    });
  }

  async validate(payload: { sub: string; email: string; emailVerified: boolean }): Promise<JwtPayload> {
    // DB에서 최신 사용자 정보 조회 (emailVerified 상태 포함)
    // JWT 토큰은 오래될 수 있으므로, 항상 DB의 최신 값을 사용
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('비활성화된 계정입니다');
    }

    // sub는 userId를 의미함 (JWT 표준)
    return {
      userId: user.id,
      email: user.email,
      emailVerified: user.emailVerified, // DB의 최신 값 사용
    };
  }
}
