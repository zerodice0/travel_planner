#!/bin/bash

# Travel Planner - 개발 서버 배포 스크립트
# 미니PC에서 실행되는 스크립트

set -e # 에러 발생 시 즉시 중지

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수 정의
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 프로젝트 루트 디렉토리 (기본값)
PROJECT_DIR="${PROJECT_DIR:-$HOME/travel-planner}"

log_info "🚀 Starting deployment to development server..."
log_info "Project directory: $PROJECT_DIR"

# 1. 프로젝트 디렉토리 존재 확인
if [ ! -d "$PROJECT_DIR" ]; then
    log_error "Project directory does not exist: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR" || exit 1

# 2. Git 저장소 확인
if [ ! -d ".git" ]; then
    log_error "Not a git repository: $PROJECT_DIR"
    exit 1
fi

# 3. Git pull (develop 브랜치)
log_info "📥 Pulling latest code from develop branch..."
git fetch origin develop
git reset --hard origin/develop

# 4. 배포 정보 출력
log_info "📊 Deployment information:"
COMMIT_HASH=$(git rev-parse --short HEAD)
COMMIT_AUTHOR=$(git log -1 --pretty=format:'%an')
COMMIT_MESSAGE=$(git log -1 --pretty=format:'%s')

echo "  - Commit: $COMMIT_HASH"
echo "  - Author: $COMMIT_AUTHOR"
echo "  - Message: $COMMIT_MESSAGE"

# 5. Docker Compose 파일 확인
if [ ! -f "docker-compose.dev.yml" ]; then
    log_error "docker-compose.dev.yml not found"
    exit 1
fi

# 6. Docker Compose 재시작 (빌드 포함)
log_info "🔄 Restarting Docker containers with rebuild..."
docker-compose -f docker-compose.dev.yml down || log_warning "Failed to stop containers (may not be running)"
docker-compose -f docker-compose.dev.yml up -d --build

# 7. 컨테이너 시작 대기
log_info "⏳ Waiting for containers to start (30 seconds)..."
sleep 30

# 8. 컨테이너 상태 확인
log_info "✅ Checking container status..."
docker-compose -f docker-compose.dev.yml ps

# 9. 실행 중인 컨테이너 확인
RUNNING_CONTAINERS=$(docker-compose -f docker-compose.dev.yml ps -q | wc -l)
if [ "$RUNNING_CONTAINERS" -eq 0 ]; then
    log_error "No containers are running!"
    docker-compose -f docker-compose.dev.yml logs --tail=50
    exit 1
fi

log_success "✅ Deployment completed successfully!"
log_success "   Commit: $COMMIT_HASH"
log_success "   Running containers: $RUNNING_CONTAINERS"

exit 0
