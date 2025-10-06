# 카테고리 관리 화면 PRD

## 1. 개요

### 1.1 화면 목적
- 사용자 정의 카테고리 생성 및 관리
- 카테고리별 장소 통계 확인
- 빠른 카테고리 필터링

### 1.2 주요 사용자 플로우
```
설정 → 카테고리 관리 → 카테고리 생성/편집/삭제
                      ↓
                      카테고리별 장소 확인
```

### 1.3 성공 지표
- 커스텀 카테고리 생성률: > 50%
- 카테고리당 평균 장소: > 3개
- 카테고리 활용률: > 70%

## 2. 사용자 스토리

### US-1: 카테고리 생성
**As a** 사용자
**I want** 나만의 카테고리를 만들고 싶다
**So that** 장소를 내 방식대로 분류할 수 있다

### US-2: 카테고리 통계
**As a** 사용자
**I want** 카테고리별 장소 수를 보고 싶다
**So that** 어떤 유형을 많이 저장하는지 알 수 있다

### US-3: 카테고리 정리
**As a** 사용자
**I want** 사용하지 않는 카테고리를 삭제하고 싶다
**So that** 깔끔하게 관리할 수 있다

## 3. 기능 요구사항

### 3.1 필수 기능 (Phase 1)

#### F-1: 기본 카테고리
- [ ] 8개 기본 카테고리 (시스템 제공)
  - 맛집 (restaurant)
  - 카페 (cafe)
  - 관광 (tourist_attraction)
  - 쇼핑 (shopping)
  - 문화 (culture)
  - 자연 (nature)
  - 숙박 (accommodation)
  - 기타 (etc)
- [ ] 기본 카테고리는 삭제 불가
- [ ] 이름 변경 가능 (Phase 2)

#### F-2: 카테고리 리스트
- [ ] 카테고리 카드:
  - 색상 칩
  - 카테고리명
  - 아이콘 (Phase 2)
  - 장소 수
  - 편집 버튼
- [ ] 정렬: 장소 수 많은 순

**카테고리 카드:**
```
┌─────────────────────┐
│ ● 맛집         12개  ⋮│
│ ● 카페          8개  ⋮│
│ ● 관광          5개  ⋮│
└─────────────────────┘
```

#### F-3: 커스텀 카테고리 추가
- [ ] 플로팅 "+" 버튼
- [ ] 추가 모달:
  - 카테고리명 (최대 20자)
  - 색상 선택 (12색 팔레트)
  - 저장 버튼

**색상 팔레트:**
- 빨강, 주황, 노랑, 초록, 청록, 파랑
- 보라, 분홍, 갈색, 회색, 검정, 흰색

**API 요청:**
```typescript
POST /api/categories
{
  name: string;
  color: string; // Hex code
}

Response 201:
{
  id: string;
  name: string;
  color: string;
  isCustom: true;
  placesCount: 0;
}
```

#### F-4: 카테고리 편집
- [ ] 편집 버튼 → 편집 모달
- [ ] 이름 변경
- [ ] 색상 변경
- [ ] 저장

**API 요청:**
```typescript
PUT /api/categories/:id
{
  name?: string;
  color?: string;
}

Response 200:
{
  id: string;
  name: string;
  color: string;
}
```

#### F-5: 카테고리 삭제
- [ ] 편집 모달에서 "삭제" 버튼
- [ ] 확인 다이얼로그:
  - "'{카테고리명}'을(를) 삭제하시겠습니까?"
  - "이 카테고리의 장소는 '기타'로 이동됩니다"
  - "취소" / "삭제"

**API 요청:**
```typescript
DELETE /api/categories/:id

Response 204: No Content

// 해당 카테고리의 장소들은 자동으로 '기타'로 변경됨
```

### 3.2 중요 기능 (Phase 2)

#### F-6: 카테고리 아이콘
- [ ] 카테고리별 아이콘 선택
- [ ] 이모지 또는 사전 정의 아이콘
- [ ] 카드 및 필터에서 표시

#### F-7: 카테고리별 통계
- [ ] 카드 탭 → 통계 화면
- [ ] 표시 정보:
  - 총 장소 수
  - 방문 완료 수
  - 방문률
  - 최근 추가 장소 (5개)

#### F-8: 미사용 카테고리 정리
- [ ] 장소 수 0인 카테고리 자동 감지
- [ ] 정리 제안 배너
- [ ] "일괄 삭제" 버튼

### 3.3 추가 기능 (Phase 3)

#### F-9: 카테고리 병합
- [ ] 여러 카테고리 선택
- [ ] 하나로 병합
- [ ] 장소 자동 이동

#### F-10: 카테고리 공유
- [ ] 내 카테고리 설정 내보내기
- [ ] 다른 사용자 카테고리 가져오기

## 4. UI/UX 사양

### 4.1 레이아웃

```
┌─────────────────────┐
│  ←  카테고리 관리    │ 헤더
├─────────────────────┤
│ 기본 카테고리        │
│ ┌─────────────────┐ │
│ │ ● 맛집    12개 ⋮│ │
│ │ ● 카페     8개 ⋮│ │
│ │ ● 관광     5개 ⋮│ │
│ └─────────────────┘ │
├─────────────────────┤
│ 내 카테고리          │
│ ┌─────────────────┐ │
│ │ ● 데이트   3개 ⋮│ │
│ │ ● 야외     2개 ⋮│ │
│ └─────────────────┘ │
│                     │
│              [  +  ]│ 플로팅 버튼
└─────────────────────┘
```

### 4.2 인터랙션

#### 카테고리 카드
- 탭: 통계 화면 (Phase 2)
- 편집 버튼: 편집 모달

#### 추가/편집 모달
- 색상 선택: 팔레트 탭
- 저장: 유효성 검사 후 저장

## 5. 기술 사양

### 5.1 프론트엔드

```typescript
// CategoryManagementScreen.tsx
interface CategoryManagementScreenProps {}

interface CategoryManagementState {
  defaultCategories: Category[];
  customCategories: Category[];
  isCreating: boolean;
  editingCategory: Category | null;
}

// Category type
interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string; // Phase 2
  isCustom: boolean;
  placesCount: number;
}
```

### 5.2 백엔드

```typescript
// categories.controller.ts
@Controller('categories')
export class CategoriesController {
  @Get()
  async getCategories(@CurrentUser() user: User) {
    return this.categoriesService.findAll(user.id);
  }

  @Post()
  @HttpCode(201)
  async createCategory(
    @CurrentUser() user: User,
    @Body() dto: CreateCategoryDto
  ) {
    return this.categoriesService.create(user.id, dto);
  }

  @Put(':id')
  async updateCategory(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto
  ) {
    return this.categoriesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteCategory(
    @CurrentUser() user: User,
    @Param('id') id: string
  ) {
    await this.categoriesService.delete(user.id, id);
  }
}

// create-category.dto.ts
export class CreateCategoryDto {
  @IsString()
  @Length(1, 20)
  name: string;

  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  color: string; // Hex color
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
```

## 6. 데이터 모델

```typescript
interface Category {
  id: string;
  userId: string | null; // null = 기본 카테고리
  name: string;
  color: string;
  icon?: string;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## 7. API 명세

### GET /api/categories
카테고리 조회

**Response 200:**
```json
{
  "categories": [
    {
      "id": "default-1",
      "name": "맛집",
      "color": "#FF6B6B",
      "isCustom": false,
      "placesCount": 12
    },
    {
      "id": "uuid-1",
      "name": "데이트",
      "color": "#FFB3BA",
      "isCustom": true,
      "placesCount": 3
    }
  ]
}
```

### POST /api/categories
카테고리 생성

**Request:**
```json
{
  "name": "데이트",
  "color": "#FFB3BA"
}
```

**Response 201:**
```json
{
  "id": "uuid-1",
  "name": "데이트",
  "color": "#FFB3BA",
  "isCustom": true,
  "placesCount": 0
}
```

### PUT /api/categories/:id
카테고리 수정

**Request:**
```json
{
  "name": "로맨틱",
  "color": "#FF69B4"
}
```

### DELETE /api/categories/:id
카테고리 삭제

**Response 204:** No Content

## 8. 성능 요구사항

- 조회: < 300ms
- 생성/수정/삭제: < 500ms

## 9. 테스트 계획

```typescript
describe('CategoryManagement', () => {
  it('카테고리 리스트 표시', () => {
    // 테스트 코드
  });

  it('커스텀 카테고리 생성', async () => {
    // 테스트 코드
  });

  it('카테고리 삭제 시 장소 이동', async () => {
    // 테스트 코드
  });
});
```

## 10. 향후 개선사항

- 카테고리 순서 변경
- 카테고리 그룹화
- 스마트 카테고리 (자동 분류)
