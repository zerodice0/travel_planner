# 이미지 최적화 PRD

## 1. 개요

이미지 업로드, 변환, 최적화 프로세스 정의

## 2. 이미지 유형

### 2.1 프로필 이미지
- 크기: 512x512px
- 포맷: WebP
- 품질: 80%
- 최대 파일 크기: 200KB

### 2.2 목록 아이콘
- 크기: 512x512px
- 포맷: WebP
- 품질: 80%
- 최대 파일 크기: 100KB

### 2.3 장소 사진
- 크기: 1024x1024px (원본 비율 유지)
- 포맷: WebP
- 품질: 85%
- 최대 파일 크기: 500KB
- 썸네일: 256x256px (WebP, 80%)

## 3. 처리 파이프라인

### 3.1 업로드 플로우
```
1. 클라이언트: 이미지 선택
2. 클라이언트: 기본 검증 (크기, 타입)
3. 서버: 파일 수신
4. 서버: Sharp로 리사이징 및 변환
5. 서버: S3/R2 업로드
6. 서버: URL 반환
7. 클라이언트: URL 저장
```

### 3.2 Sharp 사용 예시

```typescript
import sharp from 'sharp';

// 프로필 이미지
async function optimizeProfileImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(512, 512, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer();
}

// 목록 아이콘
async function optimizeListIcon(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(512, 512, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer();
}

// 장소 사진
async function optimizePlacePhoto(buffer: Buffer): Promise<{
  original: Buffer;
  thumbnail: Buffer;
}> {
  const original = await sharp(buffer)
    .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  const thumbnail = await sharp(buffer)
    .resize(256, 256, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer();

  return { original, thumbnail };
}
```

## 4. 스토리지

### 4.1 AWS S3 설정
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string = 'image/webp'
): Promise<string> {
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
    CacheControl: 'max-age=31536000' // 1년
  }));

  return `${process.env.CDN_URL}/${key}`;
}
```

### 4.2 파일 경로 구조
```
bucket/
  profiles/
    {userId}/{timestamp}.webp
  list-icons/
    {userId}/{listId}.webp
  place-photos/
    {userId}/{placeId}/
      original/{photoId}.webp
      thumbnail/{photoId}.webp
```

## 5. 클라이언트 최적화

### 5.1 이미지 로딩
```typescript
// Lazy Loading
<img
  src={url}
  loading="lazy"
  alt={alt}
/>

// Responsive Images
<img
  srcSet={`
    ${thumbnailUrl} 256w,
    ${mediumUrl} 512w,
    ${originalUrl} 1024w
  `}
  sizes="(max-width: 600px) 256px, (max-width: 1200px) 512px, 1024px"
  src={originalUrl}
  alt={alt}
/>
```

### 5.2 캐싱
```typescript
// Service Worker 캐싱
const CACHE_NAME = 'images-v1';

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/images/')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
  }
});
```

## 6. 보안

### 6.1 파일 검증
```typescript
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function validateImageFile(file: Express.Multer.File): void {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new BadRequestException('지원하지 않는 이미지 형식입니다');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new BadRequestException('파일 크기는 5MB 이하여야 합니다');
  }
}
```

### 6.2 악성 파일 차단
```typescript
import fileType from 'file-type';

async function verifyImageType(buffer: Buffer): Promise<boolean> {
  const type = await fileType.fromBuffer(buffer);

  if (!type || !type.mime.startsWith('image/')) {
    return false;
  }

  return ALLOWED_MIME_TYPES.includes(type.mime);
}
```

## 7. 성능 목표

- 업로드 시간: < 3초
- 변환 시간: < 1초
- CDN 응답 시간: < 100ms
- 이미지 로딩 시간: < 500ms

## 8. CDN 설정

- CloudFront or Cloudflare CDN
- 엣지 캐싱: 1년
- Gzip/Brotli 압축
- HTTP/2 지원
