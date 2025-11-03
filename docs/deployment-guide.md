# Travel Planner - 배포 가이드

자동 배포 시스템 사용 가이드입니다.

## 📋 목차

1. [개요](#개요)
2. [환경별 배포 전략](#환경별-배포-전략)
3. [GitHub Secrets 설정](#github-secrets-설정)
4. [개발 서버 배포](#개발-서버-배포)
5. [운영 서버 배포](#운영-서버-배포)
6. [트러블슈팅](#트러블슈팅)

---

## 개요

### 배포 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│ GitHub Repository                                            │
│                                                              │
│ develop 브랜치 push → 개발 서버 자동 배포 (미니PC)          │
│ v*.*.* 태그 생성   → 운영 서버 자동 배포 (Cloudflare)      │
└─────────────────────────────────────────────────────────────┘
```

### 자동화된 프로세스

**개발 서버 (develop 브랜치)**:
1. 코드 push → GitHub Actions 트리거
2. 타입 체크, 린트, 빌드 검증
3. 미니PC SSH 배포
4. Health Check 수행
5. Email 알림

**운영 서버 (태그 생성)**:
1. 태그 생성 → GitHub Actions 트리거
2. 전체 테스트 스위트 실행
3. Cloudflare D1/Pages/Workers 배포
4. Health Check 수행
5. GitHub Release 생성
6. Email 알림

---

## 환경별 배포 전략

### 개발 서버 (Development)

**대상**: 미니PC Self-hosted
**트리거**: develop 브랜치 push
**데이터베이스**: SQLite (dev.db)
**스토리지**: Cloudflare R2 (travel-planner-dev)
**배포 시간**: ~3-5분

**자동 실행 단계**:
- ✅ 의존성 설치 및 캐싱
- ✅ 타입 체크 (TypeScript)
- ✅ 린트 (ESLint)
- ✅ 빌드 테스트
- ✅ SSH 배포 (Docker Compose 재시작)
- ✅ Health Check (최대 5회 재시도)
- ✅ Email 알림

### 운영 서버 (Production)

**대상**: Cloudflare
**트리거**: v*.*.* 태그 생성
**데이터베이스**: Cloudflare D1 (travel-planner-prod)
**스토리지**: Cloudflare R2 (travel-planner-prod)
**배포 시간**: ~5-10분

**자동 실행 단계**:
- ✅ 태그 검증 (Semantic Versioning)
- ✅ 전체 테스트 스위트
- ✅ 프로덕션 빌드
- ✅ D1 마이그레이션 적용
- ✅ Cloudflare Pages/Workers 배포
- ✅ Health Check (최대 10회 재시도)
- ✅ GitHub Release 생성
- ✅ Email 알림

---

## GitHub Secrets 설정

### 개발 서버 Secrets

Repository → Settings → Secrets and variables → Actions

```
DEV_SSH_HOST=<미니PC IP 또는 도메인>
DEV_SSH_USER=<SSH 사용자명>
DEV_SSH_KEY=<SSH Private Key>
DEV_SSH_PORT=22
DEV_PROJECT_PATH=/home/user/travel-planner
DEV_API_URL=https://dev-api.yourdomain.com
DEV_WEB_URL=https://dev.yourdomain.com
```

### 운영 서버 Secrets

```
CLOUDFLARE_API_TOKEN=<Cloudflare API Token>
CLOUDFLARE_ACCOUNT_ID=<Cloudflare Account ID>
PROD_API_URL=https://api.yourdomain.com
PROD_WEB_URL=https://yourdomain.com
```

### 알림 Secrets

```
EMAIL_USERNAME=<Gmail 주소>
EMAIL_PASSWORD=<Gmail App Password>
NOTIFICATION_EMAIL=<알림 받을 이메일>
```

**Gmail App Password 생성 방법**:
1. Google 계정 → 보안
2. 2단계 인증 활성화
3. 앱 비밀번호 생성
4. 생성된 16자리 비밀번호를 EMAIL_PASSWORD로 사용

---

## 개발 서버 배포

### 자동 배포 (권장)

**1. develop 브랜치에 push**

```bash
git checkout develop
git add .
git commit -m "feat: 새로운 기능 추가"
git push origin develop
```

**2. GitHub Actions 확인**

- Repository → Actions 탭
- "Deploy to Development Server" 워크플로우 확인
- 실행 중인 단계 실시간 모니터링

**3. Email 알림 수신**

배포 완료 시 다음 정보를 포함한 이메일 수신:
- 커밋 정보 (SHA, 작성자, 메시지)
- 배포 링크 (API, Web)
- GitHub Actions 로그 링크

**4. Health Check 확인**

```bash
curl https://dev-api.yourdomain.com/api/health | jq '.'
```

### 수동 배포 (미니PC 직접 접속)

```bash
# 1. 미니PC SSH 접속
ssh user@mini-pc-ip

# 2. 프로젝트 디렉토리로 이동
cd ~/travel-planner

# 3. 배포 스크립트 실행
./scripts/deploy-dev.sh

# 4. Health Check
./scripts/health-check.sh
```

---

## 운영 서버 배포

### 자동 배포 (태그 기반)

**1. 태그 생성 및 push**

```bash
# main 브랜치에서 태그 생성
git checkout main
git pull origin main

# Semantic Versioning 준수 (v1.0.0, v1.2.3 등)
git tag -a v1.0.0 -m "Release v1.0.0: 초기 운영 배포"
git push origin v1.0.0
```

**2. GitHub Actions 확인**

- Repository → Actions 탭
- "Deploy to Production" 워크플로우 확인
- 단계별 진행 상황 모니터링

**3. Email 알림 및 Release 확인**

- 배포 완료 이메일 수신
- Repository → Releases 탭에서 Release 노트 확인

**4. Health Check**

```bash
curl https://api.yourdomain.com/api/health | jq '.'
```

### 롤백 방법

**문제 발생 시 이전 버전으로 복원**:

```bash
# 1. 이전 태그 확인
git tag -l

# 2. 이전 태그로 롤백
git checkout v1.0.0
git tag -a v1.0.1-rollback -m "Rollback to v1.0.0"
git push origin v1.0.1-rollback
```

---

## 트러블슈팅

### 문제 1: 배포 실패 (타입 체크 에러)

**증상**:
```
Type check failed with exit code 1
```

**해결**:
```bash
# 로컬에서 타입 체크 실행
pnpm typecheck

# 에러 수정 후 다시 push
```

### 문제 2: SSH 연결 실패

**증상**:
```
Failed to connect to dev server
```

**해결**:
1. 미니PC 네트워크 연결 확인
2. SSH Key 권한 확인 (`chmod 600 ~/.ssh/id_rsa`)
3. GitHub Secrets의 `DEV_SSH_KEY` 확인

### 문제 3: Health Check 실패

**증상**:
```
❌ Health check failed after 5 attempts
```

**해결**:
```bash
# 1. 컨테이너 로그 확인
docker-compose -f docker-compose.dev.yml logs

# 2. 컨테이너 재시작
docker-compose -f docker-compose.dev.yml restart

# 3. 수동 Health Check
curl http://localhost:4000/api/health
```

### 문제 4: Cloudflare 배포 실패

**증상**:
```
Cloudflare deployment failed
```

**해결**:
1. CLOUDFLARE_API_TOKEN 권한 확인
2. wrangler.toml 설정 확인
3. D1 데이터베이스 ID 확인

---

## 배포 체크리스트

### 개발 서버 배포 전

- [ ] 타입 체크 통과 (`pnpm typecheck`)
- [ ] 린트 통과 (`pnpm lint`)
- [ ] 로컬 빌드 성공 (`pnpm build`)
- [ ] develop 브랜치에 병합
- [ ] 미니PC 네트워크 연결 확인

### 운영 서버 배포 전

- [ ] main 브랜치에 병합
- [ ] 전체 테스트 통과
- [ ] CHANGELOG.md 업데이트
- [ ] 버전 번호 확정 (Semantic Versioning)
- [ ] D1 마이그레이션 검증
- [ ] 롤백 계획 수립

---

## 추가 리소스

- [미니PC 설정 가이드](./minipc-setup-guide.md)
- [Docker 가이드](./docker-guide.md)
- [D1 마이그레이션 가이드](./d1-migration-guide.md)
- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Cloudflare Pages 문서](https://developers.cloudflare.com/pages/)

---

**마지막 업데이트**: 2025-10-22
