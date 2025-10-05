# CORS 설정 전략

## 개요

여러 프로젝트를 동시에 개발할 때를 고려한 유연한 CORS 설정 전략입니다.

## 구현 방식

### 동적 Origin 검증

```typescript
// apps/api/src/main.ts

app.enableCors({
  origin: (origin, callback) => {
    // 1. 개발 환경: localhost의 모든 포트 자동 허용
    if (isDevelopment) {
      const isLocalhost = !origin || /^http:\/\/localhost(:\d+)?$/.test(origin);
      if (isLocalhost) {
        callback(null, true);
        return;
      }
    }

    // 2. 프로덕션: 명시적으로 허용된 origin만 허용
    const allowedOrigins = process.env.CORS_ORIGIN.split(',');
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
});
```

## 환경별 동작

### 개발 환경 (`NODE_ENV=development`)

**자동 허용되는 Origin**:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://localhost:5173`
- `http://localhost:8080`
- ... (localhost의 모든 포트)

**장점**:
- ✅ 포트 변경 시 재설정 불필요
- ✅ 여러 프로젝트 동시 개발 가능
- ✅ Vite, Next.js, CRA 등 다양한 개발 서버 지원

### 프로덕션 환경 (`NODE_ENV=production`)

**허용 방식**: 환경 변수에 명시된 origin만 허용

```bash
# .env.production
CORS_ORIGIN="https://travel-planner.com,https://admin.travel-planner.com"
```

**장점**:
- ✅ 보안 강화 (알려진 도메인만 허용)
- ✅ 여러 도메인 지원 (메인, 어드민 등)
- ✅ 명시적 제어

## 사용 예시

### Case 1: 단일 프론트엔드

```bash
# .env
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3001"
```

개발 환경이므로 localhost:3001뿐만 아니라 **모든 localhost 포트가 허용됨**

### Case 2: 여러 프론트엔드 동시 개발

```bash
# .env
NODE_ENV="development"
# 명시적 설정은 참고용, 실제로는 모든 localhost 허용됨
CORS_ORIGIN="http://localhost:3001,http://localhost:5173,http://localhost:8080"
```

**시나리오**:
- `localhost:3001` - Travel Planner 웹
- `localhost:5173` - 관리자 대시보드
- `localhost:8080` - 모바일 웹뷰

→ 세 개 모두 자동으로 허용됨

### Case 3: 프로덕션 배포

```bash
# .env.production
NODE_ENV="production"
CORS_ORIGIN="https://travel-planner.com,https://admin.travel-planner.com"
```

**허용**:
- ✅ `https://travel-planner.com`
- ✅ `https://admin.travel-planner.com`

**차단**:
- ❌ `https://malicious-site.com`
- ❌ `http://localhost:3001` (프로덕션에서는 localhost 자동 허용 안 됨)

## 보안 고려사항

### 개발 환경

- `localhost` 패턴 매칭으로 포트는 허용하되, **외부 도메인은 차단**
- `127.0.0.1`도 필요시 정규식에 추가 가능

### 프로덕션 환경

- **화이트리스트 방식**: 명시된 origin만 허용
- **와일드카드 사용 금지**: `*.example.com` 같은 패턴은 보안상 위험
- **HTTPS 강제**: 프로덕션에서는 HTTPS origin만 허용 권장

## 트러블슈팅

### "Origin not allowed by CORS" 에러

**개발 환경**:
1. `NODE_ENV=development` 확인
2. `http://localhost` 사용 중인지 확인 (`127.0.0.1`은 다름)
3. 서버 재시작 (환경 변수 변경 시)

**프로덕션 환경**:
1. `CORS_ORIGIN`에 요청 origin 포함 여부 확인
2. 프로토콜 확인 (http vs https)
3. 포트 번호 포함 여부 확인 (`https://example.com:443` vs `https://example.com`)

### 여러 도메인 설정 시

```bash
# ❌ 잘못된 예 (공백 포함)
CORS_ORIGIN="https://a.com, https://b.com"

# ✅ 올바른 예 (공백 없이)
CORS_ORIGIN="https://a.com,https://b.com"

# ✅ 또는 (코드에서 trim 처리됨)
CORS_ORIGIN="https://a.com, https://b.com"
```

## 고급 설정

### 서브도메인 패턴 매칭

```typescript
// 특정 서브도메인 패턴 허용
const isDevelopmentSubdomain = /^https:\/\/[\w-]+\.dev\.example\.com$/.test(origin);
```

### IP 주소 허용

```typescript
// 개발 서버 IP 허용
const isDevServer = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin);
```

### 환경별 파일 분리

```
apps/api/
  .env.development    # 개발 환경
  .env.staging        # 스테이징 환경
  .env.production     # 프로덕션 환경
```

## 참고 자료

- [NestJS CORS Documentation](https://docs.nestjs.com/security/cors)
- [MDN CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [OWASP CORS Security](https://owasp.org/www-community/attacks/CORS_OriginHeaderScrutiny)
