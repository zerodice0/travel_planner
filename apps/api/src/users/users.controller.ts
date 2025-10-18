import { Controller, Get, Patch, Delete, Body, UseGuards, Req, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, JwtPayload } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

interface RequestWithUser extends Request {
  user: JwtPayload;
}

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @HttpCode(200)
  @ApiOperation({ summary: '내 프로필 조회' })
  @ApiResponse({ status: 200, description: '프로필 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async getProfile(@Req() req: RequestWithUser) {
    return this.usersService.findOne(req.user.userId);
  }

  @Patch('me')
  @HttpCode(200)
  @ApiOperation({ summary: '내 프로필 수정' })
  @ApiResponse({ status: 200, description: '프로필 수정 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청 (닉네임 중복 등)' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async updateProfile(@Req() req: RequestWithUser, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.userId, updateUserDto);
  }

  @Delete('account')
  @HttpCode(204)
  @ApiOperation({ summary: '계정 탈퇴' })
  @ApiResponse({ status: 204, description: '계정 탈퇴 성공 (모든 관련 데이터 삭제됨)' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async deleteAccount(@Req() req: RequestWithUser) {
    await this.usersService.deleteAccount(req.user.userId);
  }
}
