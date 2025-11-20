# Docker Compose Guide

Travel Planner 프로젝트의 Docker Compose 사용 가이드입니다.

## 📋 목차

1. [사전 준비](#사전-준비)
2. [개발 환경 실행](#개발-환경-실행)
3. [프로덕션 환경 실행](#프로덕션-환경-실행)
4. [유용한 명령어](#유용한-명령어)
5. [문제 해결](#문제-해결)

---

## 사전 준비

### 필수 프로그램 설치

1. **Docker Desktop 설치**
   ```bash
   # macOS (Homebrew 사용)
   brew install --cask docker

   # 또는 공식 웹사이트에서 다운로드
   # https://www.docker.com/products/docker-desktop
   ```

2. **Docker 버전 확인**
   ```bash
   docker --version
   docker-compose --version
   ```

### 환경 변수 설정

개발 환경 변수가 이미 설정되어 있습니다:
- `apps/api/.env` - 로컬 개발용 (gitignored)
- `apps/api/.env.development` - 개발 환경 템플릿
- `apps/api/.env.production` - 프로덕션 환경 템플릿

프로덕션 환경을 실행하려면 환경 변수를 설정해야 합니다:
```bash
# 프로덕션 환경 변수 설정 (예시)
export PROD_JWT_SECRET="your-production-jwt-secret"
export PROD_JWT_REFRESH_SECRET="your-production-refresh-secret"
export PROD_GOOGLE_MAPS_API_KEY="your-google-maps-key"
# ... 기타 환경 변수
```

---

## 개발 환경 실행

### 🚀 빠른 시작

```bash
# 1. 프로젝트 루트에서 실행
docker-compose -f docker-compose.dev.yml up -d

# 2. 로그 확인
docker-compose -f docker-compose.dev.yml logs -f

# 3. 접속
# API: http://localhost:4000
# Web: http://localhost:3000
```

### 📝 상세 설명

**개발 환경 특징:**
- ✅ Hot Reload 지원 (코드 수정 시 자동 재시작)
- ✅ 로컬 SQLite 사용 (`dev.db`)
- ✅ 소스 코드 마운트 (실시간 반영)
- ✅ 개발용 환경 변수 사용

**서비스 구성:**
- `dev-api`: NestJS API 서버 (포트 4000)
- `dev-web`: Vite 개발 서버 (포트 3000)

**데이터 영속성:**
- 데이터베이스는 `dev-db-data` 볼륨에 저장됩니다
- 컨테이너를 재시작해도 데이터가 유지됩니다

### 개발 환경 중지

```bash
# 컨테이너 중지 (데이터 유지)
docker-compose -f docker-compose.dev.yml stop

# 컨테이너 중지 및 제거 (데이터는 유지)
docker-compose -f docker-compose.dev.yml down

# 컨테이너 및 볼륨 모두 제거 (데이터 삭제 주의!)
docker-compose -f docker-compose.dev.yml down -v
```

---

## 프로덕션 환경 실행

### 🚀 빠른 시작

```bash
# 1. 환경 변수 파일 생성 (또는 export로 설정)
cat > .env.docker.prod << EOF
PROD_JWT_SECRET=your-production-jwt-secret
PROD_JWT_REFRESH_SECRET=your-production-refresh-secret
PROD_GOOGLE_CLIENT_ID=your-google-client-id
PROD_GOOGLE_CLIENT_SECRET=your-google-client-secret
PROD_GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/auth/google/callback
PROD_GOOGLE_MAPS_API_KEY=your-google-maps-key
PROD_R2_ACCOUNT_ID=your-r2-account-id
PROD_R2_ACCESS_KEY_ID=your-r2-access-key
PROD_R2_SECRET_ACCESS_KEY=your-r2-secret-key
PROD_R2_PUBLIC_URL=https://your-r2-public-url.r2.dev
PROD_RESEND_API_KEY=your-resend-api-key
EOF

# 2. 프로덕션 환경 실행
docker-compose -f docker-compose.prod.yml --env-file .env.docker.prod up -d

# 3. 로그 확인
docker-compose -f docker-compose.prod.yml logs -f

# 4. 접속
# API: http://localhost:4001
# Web: http://localhost:3001
# Nginx: http://localhost (통합 접속)
```

### 📝 상세 설명

**프로덕션 환경 특징:**
- ✅ 최적화된 빌드 (Production build)
- ✅ 로컬 SQLite 사용 (`prod.db`)
- ✅ Nginx 리버스 프록시
- ✅ 로그 로테이션 설정
- ✅ Health check 모니터링

**서비스 구성:**
- `prod-api`: NestJS API 서버 (포트 4001)
- `prod-web`: Nginx + 정적 파일 (포트 3001)
- `nginx`: 리버스 프록시 (포트 80, 443)

**포트 매핑:**
- 80: Nginx 리버스 프록시 (HTTP)
- 443: Nginx 리버스 프록시 (HTTPS) - SSL 설정 필요
- 4001: API 직접 접근
- 3001: Web 직접 접근

### SSL/TLS 설정 (선택사항)

```bash
# SSL 인증서 디렉토리 생성
mkdir -p nginx/ssl

# Let's Encrypt 또는 자체 서명 인증서 배치
# nginx/ssl/cert.pem
# nginx/ssl/key.pem

# nginx.conf에서 HTTPS 서버 블록 활성화
```

### 프로덕션 환경 중지

```bash
# 컨테이너 중지
docker-compose -f docker-compose.prod.yml stop

# 컨테이너 중지 및 제거 (데이터는 유지)
docker-compose -f docker-compose.prod.yml down

# 컨테이너 및 볼륨 모두 제거 (데이터 삭제 주의!)
docker-compose -f docker-compose.prod.yml down -v
```

---

## 유용한 명령어

### 로그 확인

```bash
# 전체 로그 확인 (실시간)
docker-compose -f docker-compose.dev.yml logs -f

# 특정 서비스 로그만 확인
docker-compose -f docker-compose.dev.yml logs -f dev-api
docker-compose -f docker-compose.dev.yml logs -f dev-web

# 최근 100줄만 확인
docker-compose -f docker-compose.dev.yml logs --tail=100
```

### 컨테이너 상태 확인

```bash
# 실행 중인 컨테이너 확인
docker-compose -f docker-compose.dev.yml ps

# 상세 정보 확인
docker-compose -f docker-compose.dev.yml ps -a
```

### 컨테이너 내부 접속

```bash
# API 컨테이너 접속
docker-compose -f docker-compose.dev.yml exec dev-api sh

# Web 컨테이너 접속
docker-compose -f docker-compose.dev.yml exec dev-web sh

# 데이터베이스 확인
docker-compose -f docker-compose.dev.yml exec dev-api sh
# 컨테이너 내부에서:
cd /app/apps/api
sqlite3 prisma/dev.db
# SQLite 명령어:
.tables
.schema users
SELECT * FROM users;
.quit
```

### 빌드 관련

```bash
# 이미지 다시 빌드 (코드 변경 시)
docker-compose -f docker-compose.dev.yml build

# 캐시 없이 빌드
docker-compose -f docker-compose.dev.yml build --no-cache

# 특정 서비스만 빌드
docker-compose -f docker-compose.dev.yml build dev-api

# 빌드 후 실행
docker-compose -f docker-compose.dev.yml up -d --build
```

### 데이터베이스 관리

```bash
# 데이터베이스 마이그레이션 실행
docker-compose -f docker-compose.dev.yml exec dev-api sh -c "cd apps/api && pnpm prisma migrate deploy"

# Prisma Studio 실행 (GUI)
docker-compose -f docker-compose.dev.yml exec dev-api sh -c "cd apps/api && pnpm prisma studio"

# 데이터베이스 초기화 (주의: 모든 데이터 삭제!)
docker-compose -f docker-compose.dev.yml exec dev-api sh -c "cd apps/api && pnpm prisma migrate reset"
```

### 리소스 정리

```bash
# 사용하지 않는 이미지 삭제
docker image prune -a

# 사용하지 않는 볼륨 삭제
docker volume prune

# 모든 미사용 리소스 삭제
docker system prune -a --volumes
```

---

## 문제 해결

### 문제 1: 포트 충돌 (EADDRINUSE)

**증상:**
```
Error: bind: address already in use
```

**해결:**
```bash
# 사용 중인 포트 확인
lsof -i :4000  # API 포트
lsof -i :3000  # Web 포트

# 프로세스 종료
kill -9 <PID>

# 또는 docker-compose.yml에서 포트 변경
# ports:
#   - "4002:4000"  # 호스트 포트 변경
```

### 문제 2: 데이터베이스 연결 실패

**증상:**
```
Error: Can't reach database server
```

**해결:**
```bash
# 1. 컨테이너 재시작
docker-compose -f docker-compose.dev.yml restart dev-api

# 2. 로그 확인
docker-compose -f docker-compose.dev.yml logs dev-api

# 3. 데이터베이스 파일 권한 확인
docker-compose -f docker-compose.dev.yml exec dev-api ls -la /app/apps/api/prisma/

# 4. 마이그레이션 다시 실행
docker-compose -f docker-compose.dev.yml exec dev-api sh -c "cd apps/api && pnpm prisma migrate deploy"
```

### 문제 3: 이미지 빌드 실패

**증상:**
```
ERROR: failed to solve: process "/bin/sh -c pnpm install" did not complete successfully
```

**해결:**
```bash
# 1. Docker 빌드 캐시 삭제
docker builder prune -a

# 2. 캐시 없이 다시 빌드
docker-compose -f docker-compose.dev.yml build --no-cache

# 3. 로컬 node_modules 삭제 후 재시도
rm -rf node_modules apps/*/node_modules
docker-compose -f docker-compose.dev.yml build
```

### 문제 4: Hot Reload 작동 안 함

**증상:** 코드를 수정해도 자동 재시작 안 됨

**해결:**
```bash
# 1. 볼륨 마운트 확인
docker-compose -f docker-compose.dev.yml config

# 2. 파일 감시 제한 늘리기 (Linux/macOS)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# 3. Docker Desktop 설정에서 파일 공유 확인
# Settings → Resources → File Sharing
```

### 문제 5: 메모리 부족

**증상:**
```
ERROR: Container killed, Killed by OOM
```

**해결:**
```bash
# Docker Desktop 메모리 할당 증가
# Settings → Resources → Memory → 4GB 이상 할당

# 또는 docker-compose.yml에 리소스 제한 추가
# services:
#   dev-api:
#     deploy:
#       resources:
#         limits:
#           memory: 1G
```

---

## 성능 최적화

### 빌드 속도 향상

1. **BuildKit 사용**
   ```bash
   export DOCKER_BUILDKIT=1
   docker-compose build
   ```

2. **멀티스테이지 빌드 활용** (이미 적용됨)
   - Dockerfile에서 base, dependencies, builder, production 스테이지 분리

3. **pnpm 캐시 활용**
   ```dockerfile
   # Dockerfile에 추가 (이미 적용됨)
   RUN pnpm install --frozen-lockfile
   ```

### 런타임 성능

1. **프로덕션 모드 사용**
   - `NODE_ENV=production` 설정 (이미 적용됨)

2. **로그 로테이션**
   - 자동 로그 로테이션 설정 (이미 적용됨)
   - 최대 10MB, 최대 3개 파일 유지

3. **Health Check**
   - 자동 헬스 체크로 문제 조기 발견 (이미 적용됨)

---

## Cloudflare Tunnel 연동 (선택사항)

미니 PC에 배포된 서비스를 외부에서 접근하려면 Cloudflare Tunnel을 사용할 수 있습니다.

### Cloudflared 설치 및 설정

```bash
# 1. Cloudflared 설치
# macOS
brew install cloudflare/cloudflare/cloudflared

# Linux
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared

# 2. Cloudflare 로그인
cloudflared tunnel login

# 3. 터널 생성
cloudflared tunnel create travel-planner

# 4. 설정 파일 생성
cat > ~/.cloudflared/config.yml << EOF
tunnel: <TUNNEL-ID>
credentials-file: ~/.cloudflared/<TUNNEL-ID>.json

ingress:
  - hostname: api.yourdomain.com
    service: http://localhost:4001
  - hostname: yourdomain.com
    service: http://localhost:3001
  - service: http_status:404
EOF

# 5. DNS 레코드 설정
cloudflared tunnel route dns travel-planner api.yourdomain.com
cloudflared tunnel route dns travel-planner yourdomain.com

# 6. 터널 실행 (백그라운드)
cloudflared tunnel run travel-planner &
```

---

## 추가 리소스

- [Docker 공식 문서](https://docs.docker.com/)
- [Docker Compose 문서](https://docs.docker.com/compose/)
- [Cloudflare Tunnel 문서](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Prisma 문서](https://www.prisma.io/docs)

---

**마지막 업데이트:** 2025-10-21
