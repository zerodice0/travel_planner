# API 사양 PRD

## 1. 개요

RESTful API 설계 및 공통 사양 정의

## 2. API 공통 사양

### 2.1 Base URL
```
Development: http://localhost:3000/api
Production: https://api.travel-planner.com
```

### 2.2 인증
- JWT Bearer Token
- Header: `Authorization: Bearer {accessToken}`
- Refresh Token으로 갱신

### 2.3 응답 형식
```typescript
// 성공
{
  data: T;
  message?: string;
}

// 에러
{
  statusCode: number;
  error: string;
  message: string;
  timestamp: string;
}
```

### 2.4 HTTP 상태 코드
- 200: 성공
- 201: 생성 성공
- 204: 성공 (응답 없음)
- 400: 잘못된 요청
- 401: 인증 필요
- 403: 권한 없음
- 404: 리소스 없음
- 409: 충돌 (중복 등)
- 429: 요청 제한 초과
- 500: 서버 오류

## 3. 주요 API 엔드포인트

### 3.1 인증 (Auth)
```
POST   /auth/signup          회원가입
POST   /auth/login           로그인
POST   /auth/logout          로그아웃
POST   /auth/refresh         토큰 갱신
POST   /auth/request-password-reset  비밀번호 재설정 요청
POST   /auth/reset-password  비밀번호 재설정
GET    /auth/verify-email    이메일 인증
```

### 3.2 장소 (Places)
```
GET    /places               장소 목록
GET    /places/:id           장소 상세
POST   /places               장소 추가
PATCH  /places/:id           장소 수정
DELETE /places/:id           장소 삭제
PATCH  /places/:id/visit     방문 여부 토글
GET    /places/:id/lists     장소가 포함된 목록
POST   /places/:placeId/lists/:listId  목록에 추가
DELETE /places/:placeId/lists/:listId  목록에서 제거
```

### 3.3 목록 (Lists)
```
GET    /lists                목록 목록
GET    /lists/:id            목록 상세
POST   /lists                목록 생성
PUT    /lists/:id            목록 수정
DELETE /lists/:id            목록 삭제
GET    /lists/:id/places     목록 내 장소
POST   /lists/:id/places     장소 추가
DELETE /lists/:listId/places/:placeId  장소 제거
PATCH  /lists/:id/places/reorder  순서 변경
POST   /lists/:id/optimize-route  경로 최적화
```

### 3.4 카테고리 (Categories)
```
GET    /categories           카테고리 목록
POST   /categories           카테고리 생성
PUT    /categories/:id       카테고리 수정
DELETE /categories/:id       카테고리 삭제
```

### 3.5 검색 (Search)
```
GET    /search?q={keyword}   통합 검색
```

### 3.6 대시보드 (Dashboard)
```
GET    /dashboard/stats      통계 정보
```

### 3.7 사용자 (Users)
```
GET    /users/profile        프로필 조회
PUT    /users/profile        프로필 수정
DELETE /users/account        계정 탈퇴
```

### 3.8 업로드 (Upload)
```
POST   /upload/list-icon     목록 아이콘 업로드
POST   /upload/profile-image 프로필 이미지 업로드
POST   /upload/place-photo   장소 사진 업로드
```

## 4. 페이지네이션

```typescript
GET /places?page=1&limit=20

Response:
{
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}
```

## 5. 필터링 및 정렬

```typescript
GET /places?category=restaurant&visited=true&sort=createdAt&order=desc
```

## 6. Rate Limiting

- 인증 API: 5 req/min
- 일반 API: 100 req/min
- 파일 업로드: 10 req/min

## 7. 에러 코드

```typescript
enum ErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  DUPLICATE_EMAIL = 'DUPLICATE_EMAIL',
  INVALID_TOKEN = 'INVALID_TOKEN',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  EMAIL_NOT_FOUND = 'EMAIL_NOT_FOUND',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN'
}
```

## 8. CORS 설정

```typescript
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://travel-planner.com'
  ],
  credentials: true
};
```

## 9. API 문서

- Swagger/OpenAPI 자동 생성
- URL: `/api/docs`
