import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY is not configured. Email sending will be disabled.');
    }
    this.resend = new Resend(apiKey);
  }

  async sendVerificationEmail(email: string, nickname: string, token: string, frontendUrl?: string): Promise<void> {
    const baseUrl = frontendUrl || this.configService.get<string>('FRONTEND_URL');
    const verificationLink = `${baseUrl}/verify-email?token=${token}`;

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.configService.get<string>('EMAIL_FROM', 'Travel Planner <noreply@resend.dev>'),
        to: [email],
        subject: '[Travel Planner] 이메일 인증을 완료해주세요',
        html: this.getVerificationEmailTemplate(nickname, verificationLink),
      });

      if (error) {
        this.logger.error(`Failed to send verification email to ${email}`, error);
        throw new Error('Failed to send verification email');
      }

      this.logger.log(`Verification email sent to ${email} with ID: ${data?.id}`);
    } catch (error) {
      this.logger.error(`Error sending verification email to ${email}`, error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, nickname: string): Promise<void> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.configService.get<string>('EMAIL_FROM', 'Travel Planner <noreply@resend.dev>'),
        to: [email],
        subject: '[Travel Planner] 환영합니다! 🎉',
        html: this.getWelcomeEmailTemplate(nickname),
      });

      if (error) {
        this.logger.error(`Failed to send welcome email to ${email}`, error);
        throw new Error('Failed to send welcome email');
      }

      this.logger.log(`Welcome email sent to ${email} with ID: ${data?.id}`);
    } catch (error) {
      this.logger.error(`Error sending welcome email to ${email}`, error);
      throw error;
    }
  }

  private getVerificationEmailTemplate(nickname: string, verificationLink: string): string {
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>이메일 인증</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f15a20 0%, #e23e16 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Travel Planner</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px;">안녕하세요, ${nickname}님! 👋</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
                Travel Planner에 가입해 주셔서 감사합니다.<br>
                아래 버튼을 클릭하여 이메일 인증을 완료해주세요.
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 24px 0;">
                    <a href="${verificationLink}" style="display: inline-block; background-color: #f15a20; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      이메일 인증하기
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 24px 0 0 0; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                링크는 <strong>24시간 동안</strong> 유효합니다.<br>
                본인이 가입하지 않았다면 이 메일을 무시해주세요.
              </p>

              <p style="color: #9ca3af; font-size: 12px; line-height: 18px; margin: 16px 0 0 0;">
                버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣기 해주세요:<br>
                <span style="word-break: break-all;">${verificationLink}</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                © 2025 Travel Planner. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  async sendPasswordResetEmail(email: string, nickname: string, token: string, frontendUrl?: string): Promise<void> {
    const baseUrl = frontendUrl || this.configService.get<string>('FRONTEND_URL');
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.configService.get<string>('EMAIL_FROM', 'Travel Planner <noreply@resend.dev>'),
        to: [email],
        subject: '[Travel Planner] 비밀번호 재설정 안내',
        html: this.getPasswordResetEmailTemplate(nickname, resetLink),
      });

      if (error) {
        this.logger.error(`Failed to send password reset email to ${email}`, error);
        throw new Error('Failed to send password reset email');
      }

      this.logger.log(`Password reset email sent to ${email} with ID: ${data?.id}`);
    } catch (error) {
      this.logger.error(`Error sending password reset email to ${email}`, error);
      throw error;
    }
  }

  async sendPasswordChangedEmail(
    email: string,
    nickname: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.configService.get<string>('EMAIL_FROM', 'Travel Planner <noreply@resend.dev>'),
        to: [email],
        subject: '[Travel Planner] 비밀번호가 변경되었습니다',
        html: this.getPasswordChangedEmailTemplate(nickname, ipAddress, userAgent),
      });

      if (error) {
        this.logger.error(`Failed to send password changed email to ${email}`, error);
        throw new Error('Failed to send password changed email');
      }

      this.logger.log(`Password changed email sent to ${email} with ID: ${data?.id}`);
    } catch (error) {
      this.logger.error(`Error sending password changed email to ${email}`, error);
      throw error;
    }
  }

  private getPasswordResetEmailTemplate(nickname: string, resetLink: string): string {
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>비밀번호 재설정</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f15a20 0%, #e23e16 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Travel Planner</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px;">안녕하세요, ${nickname}님</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
                비밀번호 재설정을 요청하셨습니다.<br>
                아래 버튼을 클릭하여 새 비밀번호를 설정해주세요.
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 24px 0;">
                    <a href="${resetLink}" style="display: inline-block; background-color: #f15a20; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      비밀번호 재설정하기
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 24px 0 0 0; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                링크는 <strong>1시간 동안</strong> 유효합니다.<br>
                <br>
                본인이 요청하지 않았다면 이 메일을 무시해주세요.<br>
                계정은 안전하게 보호되고 있습니다.
              </p>

              <p style="color: #9ca3af; font-size: 12px; line-height: 18px; margin: 16px 0 0 0;">
                버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣기 해주세요:<br>
                <span style="word-break: break-all;">${resetLink}</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                © 2025 Travel Planner. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private getPasswordChangedEmailTemplate(nickname: string, ipAddress?: string, userAgent?: string): string {
    const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>비밀번호 변경 알림</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f15a20 0%, #e23e16 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Travel Planner</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px;">안녕하세요, ${nickname}님 🔒</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
                귀하의 계정 비밀번호가 방금 변경되었습니다.
              </p>

              <div style="background-color: #fef5ee; border-left: 4px solid #f15a20; padding: 16px; margin: 24px 0;">
                <h3 style="color: #1f2937; margin: 0 0 12px 0; font-size: 16px;">변경 정보</h3>
                <p style="color: #4b5563; margin: 0; font-size: 14px;">
                  <strong>변경 일시:</strong> ${now}<br>
                  ${ipAddress ? `<strong>IP 주소:</strong> ${ipAddress}<br>` : ''}
                  ${userAgent ? `<strong>디바이스:</strong> ${userAgent}` : ''}
                </p>
              </div>

              <p style="color: #dc2626; font-size: 16px; line-height: 24px; margin: 24px 0;">
                <strong>⚠️ 본인이 변경하지 않았다면 즉시 고객센터로 연락 주세요.</strong>
              </p>

              <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 24px 0 0 0; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                계정 보안을 위해 정기적으로 비밀번호를 변경하는 것을 권장합니다.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                © 2025 Travel Planner. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private getWelcomeEmailTemplate(nickname: string): string {
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>환영합니다</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f15a20 0%, #e23e16 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Travel Planner</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px;">환영합니다, ${nickname}님! 🎉</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
                이메일 인증이 완료되었습니다.<br>
                이제 Travel Planner의 모든 기능을 사용하실 수 있습니다!
              </p>

              <div style="background-color: #fef5ee; border-left: 4px solid #f15a20; padding: 16px; margin: 24px 0;">
                <h3 style="color: #1f2937; margin: 0 0 12px 0; font-size: 18px;">시작하기</h3>
                <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">관심 있는 여행지를 검색하고 저장하세요</li>
                  <li style="margin-bottom: 8px;">나만의 여행 리스트를 만들어보세요</li>
                  <li style="margin-bottom: 8px;">방문한 장소를 기록하고 공유하세요</li>
                </ul>
              </div>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 24px 0;">
                    <a href="${this.configService.get<string>('FRONTEND_URL')}" style="display: inline-block; background-color: #f15a20; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      시작하기
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 24px 0 0 0; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                궁금한 점이 있으시면 언제든지 문의해주세요.<br>
                즐거운 여행 계획 되세요! ✈️
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                © 2025 Travel Planner. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}
