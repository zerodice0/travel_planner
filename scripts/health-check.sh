#!/bin/bash

# Travel Planner - Health Check 스크립트
# API 서버 및 웹 서버의 상태를 확인

set -e

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

# 설정
API_URL="${API_URL:-http://localhost:4000}"
WEB_URL="${WEB_URL:-http://localhost:3000}"
MAX_RETRIES="${MAX_RETRIES:-5}"
RETRY_INTERVAL="${RETRY_INTERVAL:-30}"

log_info "🏥 Starting health check..."
log_info "API URL: $API_URL"
log_info "Web URL: $WEB_URL"
log_info "Max retries: $MAX_RETRIES"

# Health Check 함수
check_api_health() {
    local url="$1/api/health"
    local response

    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

    if [ "$response" = "200" ]; then
        return 0
    else
        return 1
    fi
}

check_web_health() {
    local url="$1"
    local response

    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

    if [ "$response" = "200" ]; then
        return 0
    else
        return 1
    fi
}

# API Health Check
log_info "📡 Checking API server..."
API_SUCCESS=false

for i in $(seq 1 "$MAX_RETRIES"); do
    log_info "API health check attempt $i/$MAX_RETRIES..."

    if check_api_health "$API_URL"; then
        log_success "✅ API server is healthy!"

        # Health 정보 출력
        log_info "API Health details:"
        curl -s "$API_URL/api/health" | jq '.' || echo "(jq not available)"

        API_SUCCESS=true
        break
    fi

    if [ "$i" -lt "$MAX_RETRIES" ]; then
        log_warning "⚠️  API health check failed. Retrying in ${RETRY_INTERVAL}s..."
        sleep "$RETRY_INTERVAL"
    fi
done

if [ "$API_SUCCESS" = false ]; then
    log_error "❌ API server health check failed after $MAX_RETRIES attempts"
    API_FAILED=true
else
    API_FAILED=false
fi

# Web Health Check
log_info "🌐 Checking Web server..."
WEB_SUCCESS=false

for i in $(seq 1 "$MAX_RETRIES"); do
    log_info "Web health check attempt $i/$MAX_RETRIES..."

    if check_web_health "$WEB_URL"; then
        log_success "✅ Web server is healthy!"

        WEB_SUCCESS=true
        break
    fi

    if [ "$i" -lt "$MAX_RETRIES" ]; then
        log_warning "⚠️  Web health check failed. Retrying in ${RETRY_INTERVAL}s..."
        sleep "$RETRY_INTERVAL"
    fi
done

if [ "$WEB_SUCCESS" = false ]; then
    log_error "❌ Web server health check failed after $MAX_RETRIES attempts"
    WEB_FAILED=true
else
    WEB_FAILED=false
fi

# 결과 요약
echo ""
log_info "📊 Health Check Summary:"
echo "  - API Server: $([ "$API_FAILED" = false ] && echo -e "${GREEN}✅ Healthy${NC}" || echo -e "${RED}❌ Failed${NC}")"
echo "  - Web Server: $([ "$WEB_FAILED" = false ] && echo -e "${GREEN}✅ Healthy${NC}" || echo -e "${RED}❌ Failed${NC}")"

# 종료 코드 결정
if [ "$API_FAILED" = true ] || [ "$WEB_FAILED" = true ]; then
    log_error "❌ Health check failed"
    exit 1
else
    log_success "✅ All services are healthy"
    exit 0
fi
