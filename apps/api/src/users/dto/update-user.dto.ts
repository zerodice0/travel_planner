import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ required: false, description: '닉네임 (2-50자)', example: '새로운닉네임' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: '닉네임은 최소 2자 이상이어야 합니다' })
  @MaxLength(50, { message: '닉네임은 최대 50자까지 가능합니다' })
  nickname?: string;

  @ApiProperty({ required: false, description: '프로필 이미지 URL', example: 'https://example.com/profile.jpg' })
  @IsOptional()
  @IsString()
  profileImage?: string;
}
