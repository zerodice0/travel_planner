import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { randomBytes } from 'crypto';

export interface UploadedImage {
  thumbnail: string; // 100x100
  medium: string; // 400x400
  original: string; // 원본
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(private configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucketName = this.configService.get<string>('R2_BUCKET_NAME') || '';
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL') || '';

    // Cloudflare R2 S3 클라이언트 설정
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
      },
    });
  }

  async uploadProfileImage(buffer: Buffer, userId: string): Promise<UploadedImage> {
    const timestamp = Date.now();
    const randomString = randomBytes(8).toString('hex');
    const baseKey = `profiles/${userId}/${timestamp}-${randomString}`;

    try {
      // 1. Thumbnail (100x100)
      const thumbnailBuffer = await sharp(buffer)
        .resize(100, 100, { fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();

      const thumbnailKey = `${baseKey}-thumbnail.webp`;
      await this.uploadToR2(thumbnailKey, thumbnailBuffer, 'image/webp');

      // 2. Medium (400x400)
      const mediumBuffer = await sharp(buffer)
        .resize(400, 400, { fit: 'cover' })
        .webp({ quality: 85 })
        .toBuffer();

      const mediumKey = `${baseKey}-medium.webp`;
      await this.uploadToR2(mediumKey, mediumBuffer, 'image/webp');

      // 3. Original (최대 1200x1200)
      const originalBuffer = await sharp(buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 90 })
        .toBuffer();

      const originalKey = `${baseKey}-original.webp`;
      await this.uploadToR2(originalKey, originalBuffer, 'image/webp');

      return {
        thumbnail: `${this.publicUrl}/${thumbnailKey}`,
        medium: `${this.publicUrl}/${mediumKey}`,
        original: `${this.publicUrl}/${originalKey}`,
      };
    } catch (error) {
      this.logger.error('Failed to upload profile image', error);
      throw new Error('이미지 업로드에 실패했습니다');
    }
  }

  private async uploadToR2(key: string, buffer: Buffer, contentType: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
    this.logger.log(`Uploaded to R2: ${key}`);
  }

  async uploadPlacePhoto(buffer: Buffer, userId: string, placeId: string): Promise<string> {
    const timestamp = Date.now();
    const randomString = randomBytes(8).toString('hex');
    const key = `places/${userId}/${placeId}/${timestamp}-${randomString}.webp`;

    try {
      // 최대 800x600으로 리사이징
      const resizedBuffer = await sharp(buffer)
        .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();

      await this.uploadToR2(key, resizedBuffer, 'image/webp');

      return `${this.publicUrl}/${key}`;
    } catch (error) {
      this.logger.error('Failed to upload place photo', error);
      throw new Error('장소 사진 업로드에 실패했습니다');
    }
  }

  /**
   * R2 스토리지 연결 확인
   * @returns 연결 가능 여부
   */
  async checkConnection(): Promise<boolean> {
    try {
      const command = new HeadBucketCommand({
        Bucket: this.bucketName,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      this.logger.warn('R2 connection check failed', error);
      return false;
    }
  }
}
