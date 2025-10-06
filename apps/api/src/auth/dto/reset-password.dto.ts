import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: '비밀번호 재설정 토큰',
    example: 'abc123...',
  })
  @IsString()
  token!: string;

  @ApiProperty({
    description: '새 비밀번호 (8자 이상, 영문 대소문자 + 숫자 조합)',
    example: 'NewSecurePass123!',
  })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: '비밀번호는 영문 대소문자와 숫자를 포함해야 합니다',
  })
  newPassword!: string;
}
