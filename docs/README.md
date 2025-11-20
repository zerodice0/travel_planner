# 📚 Travel Planner 문서

이 디렉토리는 Travel Planner 프로젝트의 모든 문서를 포함합니다.

## 📁 문서 구조

### 핵심 문서 (Root Level)

| 문서 | 설명 | 상태 |
|------|------|------|
| **MIGRATION_PLAN.md** | Convex + Clerk 마이그레이션 전체 계획 (Phase 0-9) | ✅ 활성 |
| **MIGRATION_PROGRESS_REPORT.md** | 마이그레이션 진행 현황 보고서 | ✅ 활성 |
| **ENVIRONMENT_SETUP_GUIDE.md** | 환경변수 설정 가이드 | ✅ 활성 |

### 디렉토리별 문서

#### 📊 `/analytics` - 분석 및 로깅
PostHog, AxiomFM 통합 관련 문서

- `ANALYTICS_SUMMARY.md` - 분석 통합 요약
- `ANALYTICS_INTEGRATION_CHECKLIST.md` - 통합 체크리스트
- `ANALYTICS_LOGGING_SETUP.md` - 로깅 설정 가이드
- `ANALYTICS_USAGE_EXAMPLES.md` - 사용 예제

#### 🔄 `/pdca` - PDCA 사이클 문서
마이그레이션 작업의 Plan-Do-Check-Act 문서

```
pdca/
└── migration-convex/
    ├── plan.md    # 계획 및 가설
    ├── do.md      # 실행 로그
    ├── check.md   # 평가 및 분석
    └── act.md     # 개선 및 학습
```

#### 📋 `/prd` - Product Requirement Documents
기능별 요구사항 명세

```
prd/
├── 00-overview.md
├── 01-authentication/    # 인증 기능
├── 02-core/             # 핵심 기능
├── 03-features/         # 부가 기능
├── 04-settings/         # 설정
├── 05-technical/        # 기술 스펙
└── 06-ux-design/        # UX 디자인
```

#### 🗂️ `/migration` - 마이그레이션 세부 문서
Phase별 실행 가이드 및 진행 로그

#### 🧪 `/development` - 개발 참고 문서
개발 중 발생한 이슈 해결 및 전략 문서

- `cors-strategy.md` - CORS 전략

#### 📦 `/archive` - 아카이브
더 이상 사용하지 않는 레거시 문서

- `legacy-nestjs/` - NestJS 기반 아키텍처 문서
  - `d1-migration-guide.md`
  - `docker-guide.md`
  - `deployment-guide.md`
  - `minipc-setup-guide.md`
- `migration-docs/` - 중복/구식 마이그레이션 문서
  - `DETAILED_MIGRATION_PLAN.md`
  - `MIGRATION_STATUS.md`
  - `ENV_SETUP.md`
  - `CONVEX_SETUP.md`

## 🎯 현재 마이그레이션 상태

**목표 아키텍처:** NestJS + SQLite/D1 → **Convex + Clerk + Railway**

**진행 상황:**
- ✅ Phase 0-6: 구현 완료
- ⏳ Phase 7: Railway 배포 (대기)
- ⏳ Phase 8: 테스팅 및 검증 (대기)
- ⏳ Phase 9: 클린업 (대기)

## 📖 문서 사용 가이드

### 새로운 개발자 온보딩
1. `MIGRATION_PLAN.md` - 프로젝트 전체 아키텍처 이해
2. `ENVIRONMENT_SETUP_GUIDE.md` - 개발 환경 설정
3. `prd/00-overview.md` - 프로젝트 요구사항 파악

### 마이그레이션 작업 진행
1. `MIGRATION_PLAN.md` - Phase별 작업 계획 확인
2. `MIGRATION_PROGRESS_REPORT.md` - 현재 진행 상황 파악
3. `pdca/migration-convex/` - PDCA 사이클 문서 업데이트

### Analytics 통합
1. `analytics/ANALYTICS_SUMMARY.md` - 통합 개요
2. `analytics/ANALYTICS_INTEGRATION_CHECKLIST.md` - 체크리스트
3. `analytics/ANALYTICS_USAGE_EXAMPLES.md` - 실제 사용 예제

## 🔄 문서 유지보수 원칙

1. **Single Source of Truth:** 중복 문서 금지, 하나의 권위 있는 문서 유지
2. **Archive, Don't Delete:** 구식 문서는 `/archive`로 이동
3. **Keep It Updated:** 진행 상황은 `MIGRATION_PROGRESS_REPORT.md`에 지속 업데이트
4. **PDCA Documentation:** 모든 구현 작업은 PDCA 사이클 문서로 기록

---

**Last Updated:** 2025-01-18
**Maintained by:** Development Team
