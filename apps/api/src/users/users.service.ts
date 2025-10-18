import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        profileImage: true,
        authProvider: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    return user;
  }

  async update(userId: string, updateUserDto: UpdateUserDto) {
    // 닉네임 중복 확인 (자신 제외)
    if (updateUserDto.nickname) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          nickname: updateUserDto.nickname,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new BadRequestException('이미 사용 중인 닉네임입니다');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        nickname: true,
        profileImage: true,
        authProvider: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    return updatedUser;
  }

  async deleteAccount(userId: string): Promise<void> {
    // 사용자 존재 확인
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    // User 삭제 (Cascade로 관련 데이터 자동 삭제)
    // - UserPlace (메모, 커스텀 라벨 포함)
    // - Review (리뷰)
    // - List (리스트)
    // - PlaceList (리스트-장소 연결)
    // - Category (커스텀 카테고리)
    // - Notification, RefreshToken, PasswordReset, EmailVerification
    // ※ Place는 공용 데이터이므로 삭제되지 않음
    await this.prisma.user.delete({
      where: { id: userId },
    });
  }
}
