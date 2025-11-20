# Plan: Migration to Convex + Clerk + Railway

## Hypothesis

**목표:** NestJS + SQLite/D1 아키텍처를 Convex + Clerk + Railway 서버리스 아키텍처로 전환하여 인프라 비용 절감 및 실시간 기능 강화

**접근 방법:** 완전 재구축 (새 브랜치에서 단계별 마이그레이션)

## Expected Outcomes

**정량적 목표:**
- 구현 시간: 3-4주 (17-25일)
- 인프라 비용: 100% 무료 티어로 시작 가능
- 실시간 업데이트: Convex로 자동 동기화 구현
- 인증 구현 시간: 기존 대비 50% 단축 (Clerk 사용)
- 배포 시간: Docker 대비 80% 단축 (Railway 정적 호스팅)

**기술적 목표:**
- TypeScript 타입 안정성 100% (Convex 자동 생성)
- API 응답 시간: 서버리스로 Cold Start 최소화
- 테스트 커버리지: 기존 수준 유지

## Architecture Changes

### Before
```
Docker Compose
├── NestJS Backend (Port 4000)
│   ├── Prisma ORM
│   ├── JWT/Passport Auth
│   └── SQLite (dev) / D1 (prod)
├── React Frontend (Port 3001)
└── Cloudflare R2 Storage
```

### After
```
Railway (Frontend Only)
├── React + Vite
├── Clerk Auth (Managed)
└── Convex Client SDK

Convex (Backend + DB)
├── Serverless Functions
├── Realtime Database
└── File Storage

External Services
├── PostHog (Analytics)
├── AxiomFM (Logging)
└── Resend (Email)
```

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Convex 무료 티어 초과** | Medium | 사용량 모니터링, 필요시 유료 전환 ($25/mo) |
| **학습 곡선** | Medium | 단계별 도입, Convex 튜토리얼 선행 학습 |
| **실시간 기능 복잡도** | Low | 간단한 구독부터 시작, 점진적 확장 |
| **데이터 마이그레이션** | Low | 테스트 데이터만 있어 신규 시작 가능 |
| **Google Maps API 호출 증가** | Medium | 기존 캐싱 전략 유지 (Place 테이블) |

## Success Criteria

- [ ] 모든 Phase 완료 (0-9)
- [ ] 기능 테스트 100% 통과
- [ ] 성능: Lighthouse 점수 90+ (Performance, Accessibility)
- [ ] 보안: OWASP Top 10 준수
- [ ] 배포: Railway에서 정상 실행
- [ ] 문서: 모든 변경사항 문서화 완료

## Timeline

- Phase 0: Pre-setup (30min) - **현재 진행 중**
- Phase 1: Environment setup (4-6hrs)
- Phase 2: Auth migration (6-8hrs)
- Phase 3: Database schema (4-6hrs)
- Phase 4: Core API (12-16hrs)
- Phase 5: External integrations (4-6hrs)
- Phase 6: Monitoring (2-3hrs)
- Phase 7: Railway deployment (2hrs)
- Phase 8: Testing (4-6hrs)
- Phase 9: Cleanup (2hrs)

**Total:** 17-25 days (3-4 weeks)
