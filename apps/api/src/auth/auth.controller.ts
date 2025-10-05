import { Body, Controller, HttpCode, Post, Get, Query, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, SignupDto } from './dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: '이메일/비밀번호 로그인' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: '토큰 갱신' })
  @ApiResponse({ status: 200, description: '토큰 갱신 성공' })
  @ApiResponse({ status: 401, description: 'Refresh Token 유효하지 않음' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @Post('signup')
  @HttpCode(201)
  @ApiOperation({ summary: '이메일 회원가입' })
  @ApiResponse({ status: 201, description: '회원가입 성공' })
  @ApiResponse({ status: 409, description: '이메일 또는 닉네임 중복' })
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Get('check-email')
  @HttpCode(200)
  @ApiOperation({ summary: '이메일 중복 확인' })
  @ApiResponse({ status: 200, description: '중복 확인 성공' })
  async checkEmail(@Query('email') email: string) {
    const available = await this.authService.isEmailAvailable(email);
    return { available };
  }

  @Get('check-nickname')
  @HttpCode(200)
  @ApiOperation({ summary: '닉네임 중복 확인' })
  @ApiResponse({ status: 200, description: '중복 확인 성공' })
  async checkNickname(@Query('nickname') nickname: string) {
    const available = await this.authService.isNicknameAvailable(nickname);
    return { available };
  }

  @Get('verify-email')
  @HttpCode(200)
  @ApiOperation({ summary: '이메일 인증' })
  @ApiResponse({ status: 200, description: '이메일 인증 성공' })
  @ApiResponse({ status: 400, description: '유효하지 않거나 만료된 토큰' })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification-email')
  @Throttle({ default: { limit: 1, ttl: 60000 } }) // 1분에 1회
  @HttpCode(200)
  @ApiOperation({ summary: '인증 메일 재발송' })
  @ApiResponse({ status: 200, description: '재발송 성공' })
  @ApiResponse({ status: 400, description: '유효하지 않은 요청' })
  @ApiResponse({ status: 429, description: '너무 많은 요청 (1분 제한)' })
  async resendVerificationEmail(@Body('email') email: string) {
    return this.authService.resendVerificationEmail(email);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google 로그인 시작' })
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google 로그인 콜백' })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user);

    if ('needsAdditionalInfo' in result && result.needsAdditionalInfo) {
      // 추가 정보 입력 필요 - 프론트엔드로 리다이렉트
      const params = new URLSearchParams();
      params.append('email', result.tempUser.email);
      params.append('profileImage', result.tempUser.profileImage || '');
      params.append('googleId', result.tempUser.googleId);
      return res.redirect(`${process.env.FRONTEND_URL}/signup/google?${params.toString()}`);
    }

    // 로그인 성공 - 토큰과 함께 프론트엔드로 리다이렉트
    const loginResult = result as { accessToken: string; refreshToken: string };
    const params = new URLSearchParams();
    params.append('accessToken', loginResult.accessToken);
    params.append('refreshToken', loginResult.refreshToken);
    return res.redirect(`${process.env.FRONTEND_URL}/auth/callback?${params.toString()}`);
  }

  @Post('google/complete-signup')
  @HttpCode(201)
  @ApiOperation({ summary: 'Google 회원가입 완료' })
  @ApiResponse({ status: 201, description: 'Google 회원가입 완료' })
  async completeGoogleSignup(
    @Body() body: { email: string; nickname: string; googleId: string; profileImage?: string }
  ) {
    return this.authService.completeGoogleSignup(body.email, body.nickname, body.googleId, body.profileImage);
  }
}
