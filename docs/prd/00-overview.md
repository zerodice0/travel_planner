# Travel Planner - 프로젝트 전체 개요

## 1. 프로젝트 비전

### 1.1 목적
여행 계획과 장소 관리를 효율적으로 할 수 있는 개인화된 지도 기반 여행 플래너 웹 애플리케이션

### 1.2 핵심 가치 제안
- **지도 중심 UX**: 시각적으로 장소를 관리하고 탐색
- **유연한 조직화**: 목록, 라벨, 카테고리를 통한 다층적 분류
- **방문 추적**: 방문 여부 및 소감 기록으로 여행 기록 관리
- **개인화**: 사용자 맞춤 라벨과 카테고리로 자신만의 분류 체계 구축

### 1.3 타겟 사용자
- 여행을 계획하고 기록하는 개인 사용자
- 방문하고 싶은 장소를 체계적으로 관리하고 싶은 사람
- 방문한 장소를 기록하고 회고하고 싶은 사람

## 2. 핵심 기능 개요

### 2.1 장소 관리
- 지도에서 장소 검색 및 추가
- 자동 카테고리 지정 (지도 API 기반)
- 사용자 정의 라벨 및 카테고리
- 방문 여부 표시 및 방문 소감 기록

### 2.2 목록 관리
- 테마별 장소 목록 생성
- 목록에 이름, 설명, 아이콘 설정
- 이모지 또는 이미지 아이콘 지원
- 목록별 장소 추가/제거

### 2.3 탐색 및 검색
- 지도 기반 시각적 탐색
- 통합 검색 (장소명, 라벨, 카테고리)
- 카테고리별 필터링
- 방문 여부 필터링

### 2.4 사용자 인증
- 이메일/비밀번호 로그인
- 소셜 로그인 (Google, Kakao, Apple)
- 프로필 관리

## 3. 기술 스택

### 3.1 프론트엔드
- **프레임워크**: React 19
- **스타일링**: Tailwind CSS
- **HTTP 클라이언트**: Ky
- **언어**: TypeScript (strict mode, no any)
- **빌드 도구**: Turbopack

### 3.2 백엔드
- **프레임워크**: NestJS
- **데이터베이스**: PostgreSQL
- **ORM**: TypeORM 또는 Prisma
- **언어**: TypeScript (strict mode, no any)

### 3.3 외부 서비스
- **지도 API**: Kakao Maps 또는 Google Maps
- **이미지 최적화**: Sharp (WebP 변환)
- **파일 스토리지**: AWS S3 또는 Cloudflare R2

### 3.4 아키텍처
- 터보팩 기반 마이크로서비스 모노레포 구조
- 프론트엔드/백엔드 분리
- RESTful API 설계

## 4. 화면 구조 개요

### 4.1 인증 플로우 (Phase 1)
1. 스플래시/온보딩 화면
2. 로그인 화면
3. 회원가입 화면
4. 비밀번호 재설정 화면

### 4.2 핵심 화면 (Phase 1)
1. **홈/대시보드**: 요약 정보 및 빠른 접근
2. **메인 지도 화면**: 지도 기반 장소 관리
3. **장소 상세 화면**: 장소 정보 및 편집
4. **목록 관리 화면**: 목록 생성 및 관리
5. **목록 상세 화면**: 목록 내 장소 관리

### 4.3 부가 화면 (Phase 2)
1. 검색 화면
2. 카테고리 관리 화면
3. 설정 화면

## 5. 개발 원칙

### 5.1 코드 품질
- TypeScript strict 모드 사용
- any 타입 사용 금지
- 500줄 이상 파일 리팩토링 검토
- 기능별 컴포넌트/모듈 분리

### 5.2 성능
- 이미지 WebP 변환 및 최적화
- Lazy loading 적용
- 번들 크기 최적화
- 코드 스플리팅

### 5.3 사용자 경험
- 반응형 디자인
- 로딩 상태 표시
- 에러 핸들링 및 사용자 피드백
- 접근성 고려 (WCAG 2.1 AA)

### 5.4 보안
- 입력 값 검증
- XSS/CSRF 방지
- 인증/인가 처리
- 민감 정보 암호화

## 6. 개발 로드맵

### Phase 1: MVP (4-6주)
**목표**: 핵심 기능 구현 및 사용 가능한 최소 제품

#### Week 1-2: 기반 설정
- 프로젝트 구조 설정 (Turbopack 모노레포)
- 인증 시스템 구축
- 데이터베이스 스키마 설계
- 지도 API 통합

#### Week 3-4: 핵심 기능
- 지도 화면 및 장소 추가
- 장소 상세 정보 및 편집
- 목록 생성 및 관리
- 기본 카테고리 시스템

#### Week 5-6: 완성 및 테스트
- 대시보드 구현
- UI/UX 개선
- 통합 테스트
- 버그 수정

### Phase 2: 기능 확장 (4주)
- 검색 및 필터링 고도화
- 이미지 업로드 및 최적화
- 카테고리 관리 고도화
- 소셜 로그인 추가

### Phase 3: 고급 기능 (4주)
- 경로 최적화
- 공유 기능
- 통계 및 인사이트
- 성능 최적화

## 7. 성공 지표 (KPIs)

### 7.1 기술 지표
- 페이지 로드 시간: < 2초
- API 응답 시간: < 200ms
- 번들 크기: 메인 < 200KB
- Lighthouse 점수: 90+ (Performance, Accessibility, Best Practices)

### 7.2 사용자 지표 (Phase 2 이후)
- 사용자당 평균 장소 등록 수
- 목록 생성률
- 방문 기록 작성률
- 주간 활성 사용자 수 (WAU)

## 8. 위험 요소 및 대응

### 8.1 기술적 위험
- **지도 API 제한**: 대안 API 준비 (Kakao ↔ Google)
- **이미지 스토리지 비용**: 압축 최적화 및 용량 제한
- **성능 이슈**: 가상화, 페이지네이션, 캐싱 전략

### 8.2 UX 위험
- **복잡한 네비게이션**: 사용자 테스트 및 반복 개선
- **모바일 경험**: 모바일 우선 설계
- **데이터 입력 피로도**: 자동화 및 기본값 제공

## 9. 향후 확장 가능성

### 9.1 소셜 기능
- 친구와 목록 공유
- 장소 추천
- 협업 목록

### 9.2 AI/ML 기능
- 개인화된 장소 추천
- 자동 일정 생성
- 이미지 기반 장소 인식

### 9.3 오프라인 지원
- PWA 전환
- 오프라인 지도 캐싱
- 동기화 메커니즘

## 10. 문서 인덱스

### 인증 관련
- [01-splash-onboarding.md](./01-authentication/01-splash-onboarding.md)
- [02-login.md](./01-authentication/02-login.md)
- [03-signup.md](./01-authentication/03-signup.md)
- [04-password-reset.md](./01-authentication/04-password-reset.md)

### 핵심 기능
- [01-dashboard.md](./02-core/01-dashboard.md)
- [02-map-view.md](./02-core/02-map-view.md)
- [03-place-detail.md](./02-core/03-place-detail.md)
- [04-list-management.md](./02-core/04-list-management.md)
- [05-list-detail.md](./02-core/05-list-detail.md)

### 부가 기능
- [01-search.md](./03-features/01-search.md)
- [02-category-management.md](./03-features/02-category-management.md)

### 설정
- [01-settings.md](./04-settings/01-settings.md)

### 기술 사양
- [01-api-specifications.md](./05-technical/01-api-specifications.md)
- [02-data-models.md](./05-technical/02-data-models.md)
- [03-image-optimization.md](./05-technical/03-image-optimization.md)
- [04-map-integration.md](./05-technical/04-map-integration.md)

### UX 디자인
- [01-design-system.md](./06-ux-design/01-design-system.md)
- [02-navigation-patterns.md](./06-ux-design/02-navigation-patterns.md)
- [03-accessibility.md](./06-ux-design/03-accessibility.md)
