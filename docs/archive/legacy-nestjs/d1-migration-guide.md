# Cloudflare D1 마이그레이션 가이드

PostgreSQL에서 Cloudflare D1 (SQLite)로 마이그레이션하는 완전한 가이드입니다.

## 📋 목차

1. [사전 준비](#사전-준비)
2. [로컬 환경 마이그레이션](#로컬-환경-마이그레이션)
3. [Cloudflare D1 설정](#cloudflare-d1-설정)
4. [개발 환경 배포](#개발-환경-배포)
5. [운영 환경 배포](#운영-환경-배포)
6. [검증 및 테스트](#검증-및-테스트)
7. [롤백 방법](#롤백-방법)
8. [문제 해결](#문제-해결)

---

## 사전 준비

### 1. Wrangler CLI 설치

```bash
npm install -g wrangler

# 버전 확인
wrangler --version
```

### 2. Cloudflare 로그인

```bash
wrangler login
```

브라우저가 열리면 Cloudflare 계정으로 로그인합니다.

### 3. 기존 데이터 백업 (PostgreSQL)

```bash
# PostgreSQL 데이터 백업
pg_dump travel_planner > backup_postgres_$(date +%Y%m%d).sql

# 백업 파일 안전한 곳에 보관
```

---

## 로컬 환경 마이그레이션

### 1. Prisma 클라이언트 재생성

```bash
cd apps/api

# 기존 Prisma 클라이언트 제거
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

# 새로운 스키마로 Prisma 클라이언트 생성
pnpm prisma generate
```

### 2. 로컬 SQLite 데이터베이스 생성

```bash
# 초기 마이그레이션 생성
DATABASE_URL="file:./dev.db" pnpm prisma migrate dev --name init

# 마이그레이션 성공 확인
ls prisma/migrations
```

### 3. 로컬 테스트

```bash
# 개발 서버 실행
DATABASE_URL="file:./dev.db" pnpm dev

# 다른 터미널에서 API 테스트
curl http://localhost:4000/health
```

### 4. 테스트 데이터 생성 (선택사항)

```bash
# Seed 스크립트 실행
DATABASE_URL="file:./dev.db" pnpm prisma db seed
```

---

## Cloudflare D1 설정

### 1. 개발 환경 D1 데이터베이스 생성

```bash
# 개발용 데이터베이스 생성
wrangler d1 create travel-planner-dev
```

**출력 예시:**
```
✅ Successfully created DB 'travel-planner-dev'!

[[d1_databases]]
binding = "DB"
database_name = "travel-planner-dev"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**중요:** `database_id`를 복사해두세요!

### 2. 운영 환경 D1 데이터베이스 생성

```bash
# 운영용 데이터베이스 생성
wrangler d1 create travel-planner-prod
```

마찬가지로 `database_id`를 복사해두세요.

### 3. wrangler.toml 업데이트

루트 디렉토리의 `wrangler.toml` 파일을 열고 `database_id`를 입력:

```toml
[[d1_databases]]
binding = "DB"
database_name = "travel-planner-dev"
database_id = "여기에-개발-DB-ID-입력"

[[env.production.d1_databases]]
binding = "DB"
database_name = "travel-planner-prod"
database_id = "여기에-운영-DB-ID-입력"
```

### 4. D1 스키마 적용

```bash
# 개발 DB에 스키마 적용
cd apps/api
wrangler d1 execute travel-planner-dev --remote --file=prisma/migrations/YYYYMMDDHHMMSS_init/migration.sql

# 운영 DB에 스키마 적용 (나중에)
wrangler d1 execute travel-planner-prod --remote --file=prisma/migrations/YYYYMMDDHHMMSS_init/migration.sql
```

**참고:** `YYYYMMDDHHMMSS_init`는 실제 마이그레이션 폴더 이름으로 변경하세요.

---

## 개발 환경 배포

### 1. 환경변수 설정

`apps/api/.env.development` 파일 업데이트:

```env
# Cloudflare D1 (로컬 테스트)
DATABASE_URL="file:./dev.db"

# 또는 원격 D1 사용
# DATABASE_URL="libsql://{database_id}.d1.workers.dev"
```

### 2. 로컬 테스트

```bash
cd apps/api

# Prisma 생성
pnpm prisma generate

# 서버 실행
pnpm dev

# API 테스트
curl http://localhost:4000/api/health
```

### 3. 개발 서버 배포

```bash
# 미니 PC SSH 접속
ssh user@minipc-ip

# 프로젝트 디렉토리로 이동
cd /path/to/travel-planner

# Git pull
git pull origin develop

# Prisma 생성
cd apps/api
pnpm prisma generate

# Docker 재시작 (또는 프로세스 재시작)
# Docker 사용 시:
cd ../../docker
docker-compose restart dev-api

# PM2 사용 시:
pm2 restart dev-api
```

---

## 운영 환경 배포

### 1. GitHub Secrets 설정

GitHub Repository → Settings → Secrets and variables → Actions

다음 Secrets 추가:

```
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
PROD_JWT_SECRET=your-production-jwt-secret
PROD_JWT_REFRESH_SECRET=your-production-refresh-secret
PROD_GOOGLE_MAPS_API_KEY=your-google-maps-key
PROD_R2_ACCESS_KEY_ID=your-r2-access-key
PROD_R2_SECRET_ACCESS_KEY=your-r2-secret-key
PROD_RESEND_API_KEY=your-resend-api-key
```

### 2. 데이터 마이그레이션 (PostgreSQL → D1)

**Option A: 수동 마이그레이션**

```bash
# 1. PostgreSQL 데이터 덤프
pg_dump -d travel_planner --data-only --inserts > data_dump.sql

# 2. SQLite 호환 형식으로 변환 (수동 편집 필요)
# - UUID 함수 제거
# - 날짜 형식 변경
# - 배열 타입 JSON으로 변환

# 3. D1에 데이터 삽입
wrangler d1 execute travel-planner-prod --remote --file=data_dump_converted.sql
```

**Option B: 프로그래밍 방식 마이그레이션 (추천)**

나중에 제공될 `scripts/migrate-to-d1.ts` 스크립트 사용

### 3. main 브랜치에 Merge

```bash
git checkout main
git merge develop
git push origin main
```

GitHub Actions가 자동으로 운영 환경에 배포합니다.

---

## 검증 및 테스트

### 1. 데이터베이스 확인

```bash
# D1 데이터베이스 조회
wrangler d1 execute travel-planner-dev --remote --command "SELECT count(*) FROM users"
wrangler d1 execute travel-planner-prod --remote --command "SELECT count(*) FROM users"
```

### 2. API 엔드포인트 테스트

```bash
# 개발 환경
curl https://dev-api.yourdomain.com/api/health
curl https://dev-api.yourdomain.com/api/public/places

# 운영 환경
curl https://api.yourdomain.com/api/health
curl https://api.yourdomain.com/api/public/places
```

### 3. 기능 테스트

- [ ] 회원가입/로그인
- [ ] 장소 추가
- [ ] 리스트 생성
- [ ] 이미지 업로드
- [ ] 리뷰 작성

---

## 롤백 방법

### 긴급 롤백 (PostgreSQL로 복귀)

1. **schema.prisma 복원**

```bash
git checkout HEAD~1 apps/api/prisma/schema.prisma
```

2. **환경변수 변경**

```env
DATABASE_URL="postgresql://username:password@localhost:5432/travel_planner"
```

3. **Prisma 재생성**

```bash
pnpm prisma generate
```

4. **서비스 재시작**

```bash
# Docker
docker-compose restart api

# PM2
pm2 restart api
```

5. **PostgreSQL 데이터 복원 (필요시)**

```bash
psql travel_planner < backup_postgres_20250121.sql
```

---

## 문제 해결

### 문제 1: "Cannot find module @prisma/client"

**원인:** Prisma 클라이언트가 제대로 생성되지 않음

**해결:**
```bash
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client
pnpm prisma generate
```

### 문제 2: "UNIQUE constraint failed"

**원인:** 중복 데이터 삽입 시도

**해결:**
```bash
# 중복 데이터 확인
wrangler d1 execute travel-planner-dev --remote \
  --command "SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1"

# 중복 데이터 제거
wrangler d1 execute travel-planner-dev --remote \
  --command "DELETE FROM users WHERE rowid NOT IN (SELECT MIN(rowid) FROM users GROUP BY email)"
```

### 문제 3: "배열 필드가 JSON 문자열로 저장됨"

**원인:** 미들웨어가 제대로 작동하지 않음

**확인:**
```typescript
// apps/api/src/prisma/prisma.service.ts 확인
this.$use(arrayJsonMiddleware);  // 이 줄이 있는지 확인
```

### 문제 4: Wrangler 인증 오류

**해결:**
```bash
# 재로그인
wrangler logout
wrangler login
```

### 문제 5: D1 마이그레이션 실패

**해결:**
```bash
# 마이그레이션 파일 확인
cat prisma/migrations/YYYYMMDDHHMMSS_init/migration.sql

# 수동으로 SQL 실행
wrangler d1 execute travel-planner-dev --remote \
  --file=prisma/migrations/YYYYMMDDHHMMSS_init/migration.sql
```

---

## 유용한 명령어

### D1 데이터베이스 관리

```bash
# 데이터베이스 목록 조회
wrangler d1 list

# 테이블 목록 조회
wrangler d1 execute travel-planner-dev --remote \
  --command "SELECT name FROM sqlite_master WHERE type='table'"

# 특정 테이블 스키마 조회
wrangler d1 execute travel-planner-dev --remote \
  --command "PRAGMA table_info(users)"

# 데이터 개수 확인
wrangler d1 execute travel-planner-dev --remote \
  --command "SELECT
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM places) as places,
    (SELECT COUNT(*) FROM user_places) as user_places"
```

### Prisma 관리

```bash
# Prisma Studio (D1은 지원 안 함)
DATABASE_URL="file:./dev.db" pnpm prisma studio

# 마이그레이션 상태 확인
pnpm prisma migrate status

# 마이그레이션 리셋 (개발 환경만!)
DATABASE_URL="file:./dev.db" pnpm prisma migrate reset
```

---

## 다음 단계

마이그레이션 완료 후:

1. [ ] PostgreSQL 서버 종료 (비용 절감)
2. [ ] 백업 스크립트 설정 (D1 자동 백업)
3. [ ] 모니터링 설정
4. [ ] 성능 테스트
5. [ ] 사용자 피드백 수집

---

## 추가 리소스

- [Cloudflare D1 공식 문서](https://developers.cloudflare.com/d1/)
- [Prisma SQLite 가이드](https://www.prisma.io/docs/concepts/database-connectors/sqlite)
- [Wrangler CLI 문서](https://developers.cloudflare.com/workers/wrangler/)

---

**마지막 업데이트:** 2025-01-21
