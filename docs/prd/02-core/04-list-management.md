# 목록 관리 화면 PRD

## 1. 개요

### 1.1 화면 목적
- 테마별 장소 목록 생성 및 관리
- 목록 아이콘 및 메타데이터 설정
- 목록 탐색 및 정렬

### 1.2 주요 사용자 플로우
```
목록 관리 화면 → 목록 생성 → 정보 입력 (이름, 설명, 아이콘) → 저장
                ↓
                목록 카드 → 목록 상세 → 장소 추가
```

### 1.3 성공 지표
- 목록 생성률: > 70% (가입 후 1주일)
- 목록당 평균 장소: > 5개
- 목록 편집률: > 40%

## 2. 사용자 스토리

### US-1: 목록 생성
**As a** 사용자
**I want** 테마별로 장소를 묶는 목록을 만들고 싶다
**So that** 효율적으로 장소를 관리할 수 있다

### US-2: 아이콘 설정
**As a** 사용자
**I want** 목록에 이모지나 이미지 아이콘을 지정하고 싶다
**So that** 시각적으로 구분할 수 있다

### US-3: 목록 탐색
**As a** 사용자
**I want** 내 목록을 한눈에 보고 빠르게 접근하고 싶다
**So that** 원하는 목록을 쉽게 찾을 수 있다

## 3. 기능 요구사항

### 3.1 필수 기능 (Phase 1)

#### F-1: 헤더
- [ ] 제목: "내 목록"
- [ ] 검색 아이콘 (Phase 2)
- [ ] 정렬 버튼
  - 최근 수정순
  - 이름순
  - 생성일순

#### F-2: 목록 그리드
- [ ] 그리드 레이아웃 (2열)
- [ ] 목록 카드:
  - 아이콘 (이모지/이미지)
  - 목록 이름
  - 설명 (1줄, 말줄임)
  - 장소 수
  - 진행률 (방문/전체)
- [ ] 빈 상태 (목록 없을 때)
  - 안내 메시지
  - "+ 첫 목록 만들기" 버튼

**목록 카드 레이아웃:**
```
┌──────────────┐
│   🍔         │
│              │
│  맛집 탐방    │
│  서울 맛집... │
│              │
│  ██████░░░   │
│  8개 · 6/8   │
└──────────────┘
```

**API 요청:**
```typescript
GET /api/lists?sort=updatedAt&order=desc

Response 200:
{
  lists: [
    {
      id: string;
      name: string;
      description: string;
      icon: string | { url: string; type: 'emoji' | 'image' };
      placesCount: number;
      visitedCount: number;
      updatedAt: string;
    }
  ]
}
```

#### F-3: 목록 생성 (플로팅 버튼)
- [ ] 우측 하단 플로팅 "+" 버튼
- [ ] 탭 시 목록 생성 모달 표시

#### F-4: 목록 생성/편집 모달
- [ ] 이름 입력 필드
  - 최대 50자
  - 필수
- [ ] 설명 입력 필드
  - 최대 200자
  - 선택
- [ ] 아이콘 선택 섹션
  - "이모지" 탭 (기본)
  - "이미지" 탭
- [ ] 저장 버튼
- [ ] 취소 버튼

**이모지 선택:**
- [ ] 최근 사용 이모지 (8개)
- [ ] 카테고리별 이모지
  - 음식 🍔🍕🍜
  - 여행 ✈️🏖️🗺️
  - 활동 ⚽🎨🎬
  - 기타 💡⭐🎉
- [ ] 이모지 검색 (Phase 2)

**이미지 선택:**
- [ ] 갤러리에서 선택
- [ ] 크롭 기능 (정사각형)
- [ ] WebP 변환 및 최적화
  - 512x512px
  - 최대 100KB
- [ ] 미리보기

**API 요청:**
```typescript
POST /api/lists
{
  name: string;
  description?: string;
  icon: {
    type: 'emoji' | 'image';
    value: string; // 이모지 문자 or 이미지 URL
  };
}

Response 201:
{
  id: string;
  name: string;
  description: string | null;
  icon: Icon;
  placesCount: 0;
  visitedCount: 0;
  createdAt: string;
}

PUT /api/lists/:id
{
  name?: string;
  description?: string;
  icon?: Icon;
}

Response 200:
{
  id: string;
  name: string;
  description: string | null;
  icon: Icon;
  updatedAt: string;
}
```

#### F-5: 목록 카드 액션
- [ ] 탭: 목록 상세 화면 이동
- [ ] 롱프레스 (모바일) / 우클릭 (웹): 컨텍스트 메뉴
  - 편집
  - 삭제
  - 공유 (Phase 2)

#### F-6: 목록 삭제
- [ ] 컨텍스트 메뉴 → 삭제
- [ ] 확인 다이얼로그
  - "'{목록명}'을(를) 삭제하시겠습니까?"
  - "목록 내 장소는 삭제되지 않습니다"
  - "취소" / "삭제"
- [ ] 삭제 성공 → 토스트 알림

**API 요청:**
```typescript
DELETE /api/lists/:id

Response 204: No Content
```

### 3.2 중요 기능 (Phase 2)

#### F-7: 목록 템플릿
- [ ] 생성 모달에서 "템플릿 사용" 옵션
- [ ] 템플릿 선택
  - 카페 투어 ☕
  - 맛집 탐방 🍔
  - 관광 명소 🗺️
  - 쇼핑 리스트 🛍️
- [ ] 템플릿 선택 시 이름/아이콘 자동 입력

#### F-8: 목록 복제
- [ ] 컨텍스트 메뉴 → 복제
- [ ] 목록명 자동 생성 ("{원본명} 복사본")
- [ ] 장소 포함 여부 선택

#### F-9: 목록 순서 변경
- [ ] 드래그 앤 드롭으로 순서 변경
- [ ] 순서 저장 (사용자별)

#### F-10: 검색 및 필터
- [ ] 검색 바 (헤더)
- [ ] 목록 이름/설명 검색
- [ ] 필터 옵션
  - 모든 목록
  - 진행 중 (미방문 장소 있음)
  - 완료 (모두 방문)
  - 빈 목록

### 3.3 추가 기능 (Phase 3)

#### F-11: 목록 공유
- [ ] 공개/비공개 설정
- [ ] 공유 링크 생성
- [ ] 다른 사용자 목록 복사

#### F-12: 협업 목록
- [ ] 친구 초대
- [ ] 공동 편집
- [ ] 활동 로그

#### F-13: 목록 통계
- [ ] 카드에 통계 표시
  - 총 예상 비용
  - 평균 별점
  - 최근 업데이트

## 4. UI/UX 사양

### 4.1 레이아웃

```
┌─────────────────────┐
│  내 목록        정렬▼│ 헤더
├─────────────────────┤
│ ┌────────┬────────┐ │
│ │  🍔    │  ☕    │ │ 그리드 (2열)
│ │ 맛집   │ 카페   │ │
│ │ ██████ │ ████░  │ │
│ │ 8개·6/8│ 5개·4/5│ │
│ └────────┴────────┘ │
│ ┌────────┬────────┐ │
│ │  🗺️   │  🛍️   │ │
│ │ 관광   │ 쇼핑   │ │
│ └────────┴────────┘ │
│                     │
│              [  +  ]│ 플로팅 버튼
├─────────────────────┤
│ [홈][지도][목록][설정]│ 네비게이션
└─────────────────────┘
```

### 4.2 인터랙션

#### 목록 카드
- 탭: 목록 상세 이동
- 롱프레스: 컨텍스트 메뉴
- 호버: 약간 확대 (웹)

#### 플로팅 버튼
- 스크롤 시 항상 표시
- 탭: 회전 + 모달 표시

#### 생성/편집 모달
- 바텀시트 (모바일)
- 중앙 모달 (웹)
- 배경 탭: 닫기 (확인 후)

### 4.3 접근성
- 목록 카드: 레이블 제공
- 플로팅 버튼: "목록 추가"
- 모달: focus trap
- 키보드: Tab 순서

## 5. 기술 사양

### 5.1 프론트엔드

#### 컴포넌트 구조
```typescript
// ListManagementScreen.tsx
interface ListManagementScreenProps {}

interface ListManagementState {
  lists: List[];
  sortBy: 'updatedAt' | 'name' | 'createdAt';
  sortOrder: 'asc' | 'desc';
  isLoading: boolean;
  isCreating: boolean;
  editingList: List | null;
}

// ListCard.tsx
interface ListCardProps {
  list: {
    id: string;
    name: string;
    description?: string;
    icon: Icon;
    placesCount: number;
    visitedCount: number;
  };
  onPress: (id: string) => void;
  onEdit: (list: List) => void;
  onDelete: (id: string) => void;
}

// ListFormModal.tsx
interface ListFormModalProps {
  isOpen: boolean;
  list?: List; // 편집 시
  onClose: () => void;
  onSubmit: (data: ListFormData) => void;
}

interface ListFormData {
  name: string;
  description?: string;
  icon: {
    type: 'emoji' | 'image';
    value: string;
  };
}

// EmojiPicker.tsx
interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

// ImagePicker.tsx
interface ImagePickerProps {
  onSelect: (imageUrl: string) => void;
}
```

#### 이미지 최적화
```typescript
async function optimizeListIcon(file: File): Promise<string> {
  const image = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // 정사각형 크롭
  const size = Math.min(image.width, image.height);
  const offsetX = (image.width - size) / 2;
  const offsetY = (image.height - size) / 2;

  // 512x512로 리사이징
  canvas.width = 512;
  canvas.height = 512;
  ctx.drawImage(
    image,
    offsetX, offsetY, size, size,
    0, 0, 512, 512
  );

  // WebP 변환
  return new Promise((resolve) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) return;

        // 업로드
        const formData = new FormData();
        formData.append('image', blob, 'icon.webp');

        const response = await api.post('upload/list-icon', {
          body: formData
        }).json<{ url: string }>();

        resolve(response.url);
      },
      'image/webp',
      0.8 // 품질
    );
  });
}
```

### 5.2 백엔드

#### API 엔드포인트
```typescript
// lists.controller.ts
@Controller('lists')
export class ListsController {
  @Get()
  async getLists(
    @CurrentUser() user: User,
    @Query('sort') sort: string = 'updatedAt',
    @Query('order') order: 'asc' | 'desc' = 'desc'
  ) {
    return this.listsService.findAll(user.id, { sort, order });
  }

  @Post()
  @HttpCode(201)
  async createList(
    @CurrentUser() user: User,
    @Body() dto: CreateListDto
  ) {
    return this.listsService.create(user.id, dto);
  }

  @Put(':id')
  async updateList(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateListDto
  ) {
    return this.listsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteList(
    @CurrentUser() user: User,
    @Param('id') id: string
  ) {
    await this.listsService.delete(user.id, id);
  }
}

// create-list.dto.ts
export class CreateListDto {
  @IsString()
  @Length(1, 50)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ValidateNested()
  @Type(() => IconDto)
  icon: IconDto;
}

export class IconDto {
  @IsEnum(['emoji', 'image'])
  type: 'emoji' | 'image';

  @IsString()
  value: string; // 이모지 문자 or 이미지 URL
}

export class UpdateListDto extends PartialType(CreateListDto) {}
```

#### 이미지 업로드
```typescript
// upload.controller.ts
@Controller('upload')
export class UploadController {
  @Post('list-icon')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new BadRequestException('이미지 파일만 업로드 가능합니다'), false);
        }
      }
    })
  )
  async uploadListIcon(
    @UploadedFile() file: Express.Multer.File
  ) {
    const url = await this.uploadService.uploadListIcon(file);
    return { url };
  }
}

// upload.service.ts
async uploadListIcon(file: Express.Multer.File): Promise<string> {
  // Sharp로 이미지 처리
  const buffer = await sharp(file.buffer)
    .resize(512, 512, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer();

  // S3 or Cloudflare R2 업로드
  const key = `list-icons/${uuidv4()}.webp`;
  await this.s3.putObject({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'image/webp',
    ACL: 'public-read'
  });

  return `${process.env.CDN_URL}/${key}`;
}
```

## 6. 데이터 모델

### 6.1 List
```typescript
interface List {
  id: string;
  userId: string;
  name: string;
  description?: string;
  icon: {
    type: 'emoji' | 'image';
    value: string;
  };
  colorTheme?: string; // Phase 2
  isPublic: boolean; // Phase 3
  sortOrder: number; // Phase 2
  createdAt: Date;
  updatedAt: Date;

  // 관계 (조인)
  places?: Place[];
  placesCount?: number;
  visitedCount?: number;
}
```

## 7. API 명세

### GET /api/lists
목록 조회

**Query Params:**
- `sort`: 정렬 기준 (updatedAt, name, createdAt)
- `order`: 정렬 순서 (asc, desc)

**Response 200:**
```json
{
  "lists": [
    {
      "id": "uuid-1",
      "name": "맛집 탐방",
      "description": "서울 맛집 리스트",
      "icon": {
        "type": "emoji",
        "value": "🍔"
      },
      "placesCount": 8,
      "visitedCount": 6,
      "updatedAt": "2025-10-05T10:00:00Z"
    }
  ]
}
```

### POST /api/lists
목록 생성

**Request:**
```json
{
  "name": "맛집 탐방",
  "description": "서울 맛집 리스트",
  "icon": {
    "type": "emoji",
    "value": "🍔"
  }
}
```

**Response 201:**
```json
{
  "id": "uuid-1",
  "name": "맛집 탐방",
  "description": "서울 맛집 리스트",
  "icon": {
    "type": "emoji",
    "value": "🍔"
  },
  "placesCount": 0,
  "visitedCount": 0,
  "createdAt": "2025-10-05T10:00:00Z"
}
```

### PUT /api/lists/:id
목록 수정

**Request:**
```json
{
  "name": "서울 맛집",
  "description": "업데이트된 설명"
}
```

**Response 200:**
```json
{
  "id": "uuid-1",
  "name": "서울 맛집",
  "description": "업데이트된 설명",
  "updatedAt": "2025-10-05T12:00:00Z"
}
```

### DELETE /api/lists/:id
목록 삭제

**Response 204:** No Content

## 8. 성능 요구사항

### 8.1 로딩 시간
- 목록 조회: < 500ms
- 목록 생성: < 1초
- 이미지 업로드: < 3초

### 8.2 이미지 최적화
- WebP 변환 (80% 품질)
- 512x512px 고정
- 최대 100KB

### 8.3 UI 성능
- 60fps 스크롤
- 이미지 lazy loading

## 9. 보안 고려사항

### 9.1 권한 검증
- 본인 목록만 조회/수정/삭제
- 서버 측 userId 검증

### 9.2 파일 업로드
- 파일 타입 검증 (이미지만)
- 파일 크기 제한 (2MB)
- 악성 파일 차단

## 10. 테스트 계획

### 10.1 Unit 테스트
```typescript
describe('ListManagementScreen', () => {
  it('목록 조회 및 표시', async () => {
    // 테스트 코드
  });

  it('목록 생성', async () => {
    // 테스트 코드
  });

  it('목록 삭제 확인', async () => {
    // 테스트 코드
  });
});
```

### 10.2 E2E 시나리오
1. 목록 생성: + 버튼 → 정보 입력 → 저장
2. 목록 편집: 롱프레스 → 편집 → 수정 → 저장
3. 목록 삭제: 롱프레스 → 삭제 → 확인

## 11. 향후 개선사항

### 11.1 UX 개선
- 목록 미리보기 (지도)
- 스마트 목록 (자동 분류)
- 목록 태그

### 11.2 소셜
- 인기 목록 탐색
- 목록 좋아요
- 목록 댓글

### 11.3 분석
- 목록 활용도
- 완료율 추세
- 추천 알고리즘
