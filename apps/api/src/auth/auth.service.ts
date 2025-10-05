import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { RecaptchaService } from '../common/recaptcha/recaptcha.service';
import { LoginDto, SignupDto } from './dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
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
    const tokens = await this.generateTokens(user.id, user.email);

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

  async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

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

      // 새로운 토큰 생성
      const tokens = await this.generateTokens(payload.sub, payload.email);

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
    } catch (error) {
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
    // 인증 토큰 조회
    const verification = await this.prisma.emailVerification.findUnique({
      where: { token },
    });

    if (!verification) {
      throw new BadRequestException('유효하지 않은 인증 링크입니다');
    }

    if (verification.verifiedAt) {
      throw new BadRequestException('이미 인증된 이메일입니다');
    }

    if (verification.expiresAt < new Date()) {
      throw new BadRequestException('만료된 인증 링크입니다');
    }

    // 이메일 인증 처리
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

    // 웰컴 이메일 발송
    try {
      await this.emailService.sendWelcomeEmail(user!.email, user!.nickname);
    } catch (error) {
      // 이메일 발송 실패 시 로그만 남기고 인증은 완료
      console.error('Failed to send welcome email:', error);
    }

    return {
      message: '이메일 인증이 완료되었습니다',
      user: {
        id: user!.id,
        email: user!.email,
        emailVerified: user!.emailVerified,
      },
    };
  }

  async googleLogin(googleUser: any) {
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
      const tokens = await this.generateTokens(user.id, user.email);

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

    // 토큰 생성
    const tokens = await this.generateTokens(user.id, user.email);

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
}
