import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorageService } from '../storage/storage.service';
import { UsersService } from '../users/users.service';

interface RequestWithUser extends Request {
  user: {
    sub: string;
    email: string;
  };
}

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(
    private storageService: StorageService,
    private usersService: UsersService,
  ) {}

  @Post('profile-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @HttpCode(200)
  @ApiOperation({ summary: '프로필 이미지 업로드' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: '업로드 성공' })
  @ApiResponse({ status: 400, description: '잘못된 파일 형식 또는 크기' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async uploadProfileImage(@UploadedFile() file: Express.Multer.File, @Req() req: RequestWithUser) {
    if (!file) {
      throw new BadRequestException('파일이 업로드되지 않았습니다');
    }

    // MIME 타입 검증
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('지원하지 않는 파일 형식입니다 (JPEG, PNG, WebP만 가능)');
    }

    // 파일 크기 검증 (2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('파일 크기는 2MB를 초과할 수 없습니다');
    }

    const userId = req.user.sub;
    const images = await this.storageService.uploadProfileImage(file.buffer, userId);

    // User 테이블에 프로필 이미지 URL 저장 (medium 사이즈 사용)
    await this.usersService.update(userId, { profileImage: images.medium });

    return {
      message: '프로필 이미지가 업로드되었습니다',
      images,
    };
  }

  @Post('place-photo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @HttpCode(200)
  @ApiOperation({ summary: '장소 사진 업로드' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
        placeId: {
          type: 'string',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: '업로드 성공' })
  async uploadPlacePhoto(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) {
      throw new BadRequestException('파일이 업로드되지 않았습니다');
    }

    // MIME 타입 검증
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('지원하지 않는 파일 형식입니다');
    }

    // 파일 크기 검증 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('파일 크기는 5MB를 초과할 수 없습니다');
    }

    const userId = req.user?.sub || '';
    const placeId = req.body?.placeId || 'temp';
    const url = await this.storageService.uploadPlacePhoto(file.buffer, userId, placeId);

    return {
      message: '사진이 업로드되었습니다',
      url,
    };
  }
}
