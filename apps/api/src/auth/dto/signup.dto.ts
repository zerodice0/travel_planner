import {
  IsEmail,
  IsString,
  MinLength,
  Matches,
  Length,
  ValidateNested,
  IsBoolean,
  Equals,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AgreementsDto {
  @IsBoolean()
  @Equals(true, { message: '서비스 이용약관에 동의해주세요' })
  termsOfService!: boolean;

  @IsBoolean()
  @Equals(true, { message: '개인정보 처리방침에 동의해주세요' })
  privacyPolicy!: boolean;

  @IsBoolean()
  marketing!: boolean;
}

export class SignupDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
  email!: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다' })
  @Matches(/^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/, {
    message: '영문, 숫자, 특수문자만 사용 가능합니다',
  })
  password!: string;

  @IsString()
  @Length(2, 20, { message: '닉네임은 2-20자 사이여야 합니다' })
  @Matches(/^[가-힣a-zA-Z0-9]+$/, {
    message: '한글, 영문, 숫자만 입력 가능합니다',
  })
  nickname!: string;

  @ValidateNested()
  @Type(() => AgreementsDto)
  agreements!: AgreementsDto;

  @IsOptional()
  @IsString()
  recaptchaToken?: string;

  @IsOptional()
  @IsString()
  frontendUrl?: string;
}
