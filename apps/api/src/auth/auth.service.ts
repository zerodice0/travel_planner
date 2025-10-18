import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { RecaptchaService } from '../common/recaptcha/recaptcha.service';
import { LoginDto, SignupDto } from './dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private recaptchaService: RecaptchaService,
  ) {}

  async login(dto: LoginDto) {
    // 사용자 조회
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('등록되지 않은 이메일입니다. 회원가입 해주세요.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('비활성화된 계정입니다. 고객센터에 문의하세요.');
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('비밀번호가 올바르지 않습니다.');
    }

    // 토큰 생성
    const tokens = await this.generateTokens(user.id, user.email, user.emailVerified);

    // 마지막 로그인 시간 업데이트
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Refresh Token 저장
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일
      },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        profileImage: user.profileImage,
      },
    };
  }

  async generateTokens(userId: string, email: string, emailVerified: boolean = false) {
    const payload = { sub: userId, email, emailVerified };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    try {
      // Refresh Token 검증
      const payload = await this.jwtService.verifyAsync(refreshToken);

      // DB에서 Refresh Token 확인
      const tokenRecord = await this.prisma.refreshToken.findFirst({
        where: {
          token: refreshToken,
          userId: payload.sub,
          expiresAt: { gt: new Date() },
        },
      });

      if (!tokenRecord) {
        throw new UnauthorizedException('유효하지 않은 Refresh Token입니다');
      }

      // 사용자 정보 조회 (최신 emailVerified 상태 반영)
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('사용자를 찾을 수 없습니다');
      }

      // 새로운 토큰 생성
      const tokens = await this.generateTokens(user.id, user.email, user.emailVerified);

      // 기존 Refresh Token 삭제 및 새 토큰 저장
      await this.prisma.$transaction([
        this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } }),
        this.prisma.refreshToken.create({
          data: {
            userId: payload.sub,
            token: tokens.refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        }),
      ]);

      return tokens;
    } catch {
      throw new UnauthorizedException('Refresh Token이 만료되었습니다');
    }
  }

  async signup(dto: SignupDto) {
    // reCAPTCHA 검증
    if (dto.recaptchaToken) {
      await this.recaptchaService.verifyToken(dto.recaptchaToken, 'signup');
    }

    // 이메일 중복 확인
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingEmail) {
      throw new ConflictException('이미 사용 중인 이메일입니다');
    }

    // 닉네임 중복 확인
    const existingNickname = await this.prisma.user.findFirst({
      where: { nickname: dto.nickname },
    });

    if (existingNickname) {
      throw new ConflictException('이미 사용 중인 닉네임입니다');
    }

    // 비밀번호 해싱
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // 사용자 생성
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        nickname: dto.nickname,
        authProvider: 'email',
        emailVerified: false,
        isActive: true,
      },
    });

    // 이메일 인증 토큰 생성
    const verificationToken = await this.generateVerificationToken(user.id);

    // 이메일 발송
    try {
      await this.emailService.sendVerificationEmail(user.email, user.nickname, verificationToken, dto.frontendUrl);
    } catch (error) {
      // 이메일 발송 실패 시 로그만 남기고 가입은 진행
      console.error('Failed to send verification email:', error);
    }

    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      emailVerified: user.emailVerified,
      message: '인증 메일이 발송되었습니다',
    };
  }

  async isEmailAvailable(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return !user;
  }

  async isNicknameAvailable(nickname: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: { nickname },
    });
    return !user;
  }

  async verifyEmail(token: string) {
    this.logger.log(`이메일 인증 시도 - Token: ${token.substring(0, 8)}...`);

    // 인증 토큰 조회
    const verification = await this.prisma.emailVerification.findUnique({
      where: { token },
    });

    if (!verification) {
      this.logger.warn(`유효하지 않은 인증 토큰 - Token: ${token.substring(0, 8)}...`);
      throw new BadRequestException('유효하지 않은 인증 링크입니다');
    }

    // 이미 인증된 경우 - 멱등성 보장을 위해 성공 응답 반환
    if (verification.verifiedAt) {
      this.logger.log(`이미 인증된 이메일 요청 - UserId: ${verification.userId}`);

      const user = await this.prisma.user.findUnique({
        where: { id: verification.userId },
      });

      return {
        message: '이메일 인증이 완료되었습니다',
        user: {
          id: user!.id,
          email: user!.email,
          emailVerified: user!.emailVerified,
        },
      };
    }

    if (verification.expiresAt < new Date()) {
      this.logger.warn(`만료된 인증 토큰 - UserId: ${verification.userId}, ExpiresAt: ${verification.expiresAt}`);
      throw new BadRequestException('만료된 인증 링크입니다');
    }

    // 이메일 인증 처리
    try {
      await this.prisma.$transaction([
        this.prisma.emailVerification.update({
          where: { id: verification.id },
          data: { verifiedAt: new Date() },
        }),
        this.prisma.user.update({
          where: { id: verification.userId },
          data: { emailVerified: true },
        }),
      ]);

      const user = await this.prisma.user.findUnique({
        where: { id: verification.userId },
      });

      this.logger.log(`이메일 인증 성공 - UserId: ${user!.id}, Email: ${user!.email}`);

      // 웰컴 이메일 발송
      try {
        await this.emailService.sendWelcomeEmail(user!.email, user!.nickname);
      } catch (error) {
        // 이메일 발송 실패 시 로그만 남기고 인증은 완료
        this.logger.error(`웰컴 이메일 발송 실패 - UserId: ${user!.id}`, error instanceof Error ? error.stack : String(error));
      }

      return {
        message: '이메일 인증이 완료되었습니다',
        user: {
          id: user!.id,
          email: user!.email,
          emailVerified: user!.emailVerified,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`이메일 인증 처리 중 오류 - UserId: ${verification.userId}`, error instanceof Error ? error.stack : String(error));
      throw new BadRequestException('인증 처리 중 오류가 발생했습니다');
    }
  }

  async googleLogin(googleUser: { googleId: string; email: string; firstName: string; lastName: string; profileImage: string; }) {
    // Google ID로 기존 사용자 조회
    let user = await this.prisma.user.findFirst({
      where: {
        email: googleUser.email,
      },
    });

    if (user) {
      // 기존 사용자가 이메일로 가입한 경우
      if (user.authProvider === 'email') {
        throw new ConflictException('이메일로 가입된 계정입니다. 이메일 로그인을 이용해주세요.');
      }

      // 구글 계정으로 로그인
      const tokens = await this.generateTokens(user.id, user.email, user.emailVerified);

      // 마지막 로그인 시간 업데이트
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Refresh Token 저장
      await this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          profileImage: user.profileImage,
          emailVerified: user.emailVerified,
        },
      };
    }

    // 새로운 사용자 - 추가 정보 입력 필요
    return {
      needsAdditionalInfo: true,
      tempUser: {
        email: googleUser.email,
        profileImage: googleUser.profileImage,
        googleId: googleUser.googleId,
      },
    };
  }

  async completeGoogleSignup(email: string, nickname: string, googleId: string, profileImage?: string) {
    // 닉네임 중복 확인
    const existingNickname = await this.prisma.user.findFirst({
      where: { nickname },
    });

    if (existingNickname) {
      throw new ConflictException('이미 사용 중인 닉네임입니다');
    }

    // 사용자 생성
    const user = await this.prisma.user.create({
      data: {
        email,
        nickname,
        profileImage,
        passwordHash: '', // 소셜 로그인은 비밀번호 불필요
        authProvider: 'google',
        emailVerified: true, // Google 계정은 이미 인증됨
        isActive: true,
      },
    });

    // 토큰 생성 (Google 회원가입 시 이메일은 이미 인증됨)
    const tokens = await this.generateTokens(user.id, user.email, true);

    // Refresh Token 저장
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // 웰컴 이메일 발송
    try {
      await this.emailService.sendWelcomeEmail(user.email, user.nickname);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        profileImage: user.profileImage,
        emailVerified: user.emailVerified,
      },
    };
  }

  async resendVerificationEmail(email: string, frontendUrl?: string) {
    // 사용자 조회
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('등록되지 않은 이메일입니다');
    }

    if (user.emailVerified) {
      throw new BadRequestException('이미 인증된 이메일입니다');
    }

    // 기존 미사용 토큰 삭제
    await this.prisma.emailVerification.deleteMany({
      where: {
        userId: user.id,
        verifiedAt: null,
      },
    });

    // 새 인증 토큰 생성
    const verificationToken = await this.generateVerificationToken(user.id);

    // 이메일 발송
    await this.emailService.sendVerificationEmail(user.email, user.nickname, verificationToken, frontendUrl);

    return {
      message: '인증 메일이 재발송되었습니다',
      nextAvailableAt: new Date(Date.now() + 60 * 1000), // 1분 후
    };
  }

  private async generateVerificationToken(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');

    await this.prisma.emailVerification.create({
      data: {
        userId,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간
      },
    });

    return token;
  }

  // 비밀번호 재설정 요청
  async requestPasswordReset(email: string, ipAddress?: string, userAgent?: string) {
    // 사용자 조회
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // 보안: 이메일 존재 여부와 관계없이 항상 성공 응답
    if (!user) {
      return {
        message: '입력하신 이메일로 비밀번호 재설정 링크를 발송했습니다',
      };
    }

    // 기존 미사용 토큰 삭제
    await this.prisma.passwordReset.deleteMany({
      where: {
        userId: user.id,
        used: false,
      },
    });

    // 새 재설정 토큰 생성
    const resetToken = await this.generateResetToken(user.id, ipAddress, userAgent);

    // 이메일 발송
    try {
      await this.emailService.sendPasswordResetEmail(user.email, user.nickname, resetToken);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // 이메일 발송 실패 시에도 성공 응답 (보안)
    }

    return {
      message: '입력하신 이메일로 비밀번호 재설정 링크를 발송했습니다',
    };
  }

  // 비밀번호 재설정
  async resetPassword(token: string, newPassword: string) {
    // 토큰 검증
    const resetRequest = await this.prisma.passwordReset.findUnique({
      where: { token },
    });

    if (!resetRequest) {
      throw new BadRequestException('유효하지 않은 재설정 링크입니다');
    }

    if (resetRequest.used) {
      throw new BadRequestException('이미 사용된 재설정 링크입니다');
    }

    if (resetRequest.expiresAt < new Date()) {
      throw new BadRequestException('만료된 재설정 링크입니다');
    }

    // 새 비밀번호 해싱
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // 사용자 비밀번호 업데이트 및 토큰 사용 처리
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetRequest.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordReset.update({
        where: { id: resetRequest.id },
        data: {
          used: true,
          usedAt: new Date(),
        },
      }),
    ]);

    // 사용자 정보 조회
    const user = await this.prisma.user.findUnique({
      where: { id: resetRequest.userId },
    });

    // 비밀번호 변경 알림 이메일 발송
    try {
      await this.emailService.sendPasswordChangedEmail(
        user!.email,
        user!.nickname,
        resetRequest.ipAddress ?? undefined,
        resetRequest.userAgent ?? undefined,
      );
    } catch (error) {
      console.error('Failed to send password changed email:', error);
    }

    return {
      message: '비밀번호가 성공적으로 변경되었습니다',
    };
  }

  private async generateResetToken(userId: string, ipAddress?: string, userAgent?: string): Promise<string> {
    const token = randomBytes(32).toString('hex');

    await this.prisma.passwordReset.create({
      data: {
        userId,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1시간
        ipAddress,
        userAgent,
      },
    });

    return token;
  }
}
