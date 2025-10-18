import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export interface JwtPayload {
  userId: string;
  email: string;
  emailVerified: boolean;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
