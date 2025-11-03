import { Module, DynamicModule, Provider } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { RecaptchaModule } from '../common/recaptcha/recaptcha.module';

@Module({})
export class AuthModule {
  static forRoot(): DynamicModule {
    // Google OAuth가 설정되어 있을 때만 GoogleStrategy 추가
    const configService = new ConfigService();
    const googleClientId = configService.get<string>('GOOGLE_CLIENT_ID');
    const googleClientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');

    const providers: Provider[] = [AuthService, JwtStrategy];

    if (googleClientId && googleClientSecret) {
      providers.push(GoogleStrategy);
    }

    return {
      module: AuthModule,
      imports: [
        PassportModule,
        PrismaModule,
        EmailModule,
        RecaptchaModule,
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => ({
            secret: configService.get<string>('JWT_SECRET'),
            signOptions: { expiresIn: '15m' },
          }),
          inject: [ConfigService],
        }),
      ],
      controllers: [AuthController],
      providers,
      exports: [AuthService],
    };
  }
}
