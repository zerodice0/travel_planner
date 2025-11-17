# 🚀 Travel Planner 기술 스택 마이그레이션 계획

## 📋 개요

**목표:** NestJS + SQLite/D1 → Convex + Clerk + Railway 서버리스 아키텍처로 전환

**마이그레이션 일정:** 약 3-4주 (17-25일)

**마이그레이션 방식:** 완전 재구축 (신규 시작)

---

## 🎯 목표 기술 스택

| 카테고리 | 현재 | 변경 후 |
|---------|------|---------|
| **백엔드** | NestJS + Prisma | **Convex (서버리스 함수 + DB)** |
| **데이터베이스** | SQLite (dev) / Cloudflare D1 (prod) | **Convex DB (실시간 반응형)** |
| **인증** | JWT + Passport (Google OAuth) | **Clerk (완전 관리형)** |
| **프론트엔드** | React + Vite | React + Vite (유지) |
| **호스팅** | Docker Compose | **Railway (Frontend만)** |
| **스토리지** | Cloudflare R2 | **Convex File Storage / Clerk** |
| **이메일** | Resend | Resend (유지) |
| **분석** | - | **PostHog (이벤트 분석)** |
| **로깅** | - | **AxiomFM (로그 관리)** |

---

## 🏗️ 목표 아키텍처

```
┌─────────────────────────────────────────────────┐
│           Railway (Frontend Hosting)            │
│  React + Vite + TypeScript + Tailwind CSS       │
└─────────────────┬───────────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼────┐  ┌────▼─────┐  ┌───▼────────┐
│ Clerk  │  │ Convex   │  │  PostHog   │
│ Auth   │  │ DB+API   │  │ Analytics  │
└────────┘  └──┬───────┘  └────────────┘
               │
         ┌─────┴─────┐
    ┌───▼────┐  ┌───▼────────┐
    │ AxiomFM│  │  Resend    │
    │ Logging│  │  Email     │
    └────────┘  └────────────┘
```

---

## 💰 비용 분석 (무료 티어)

| 서비스 | 무료 티어 제한 | 예상 충분성 |
|--------|---------------|------------|
| **Railway** | 월 $5 크레딧 (500시간) | ✅ Frontend 정적 사이트에 충분 |
| **Convex** | 1GB DB + 1M 함수 호출/월 | ✅ 소규모~중규모 프로젝트 충분 |
| **Clerk** | 10,000 MAU/월 | ✅ 초기 단계에 매우 충분 |
| **PostHog** | 1M 이벤트/월 | ✅ 초기 분석 충분 |
| **AxiomFM** | 0.5GB 로그/월 | ✅ 기본 로깅 충분 |
| **Resend** | 3,000 이메일/월 | ✅ 이메일 인증/알림 충분 |

**총평:** 모든 서비스 무료 티어로 시작 가능, 현재보다 인프라 비용 절감 가능

---

## 📊 마이그레이션 단계별 계획

### Phase 1: 환경 준비 및 기초 설정 (1-2일)

**체크리스트:**
- [ ] Convex 계정 생성 및 프로젝트 초기화
- [ ] Clerk 앱 등록 및 Google OAuth 설정
- [ ] PostHog 프로젝트 생성
- [ ] AxiomFM 데이터셋 생성
- [ ] Railway 프로젝트 생성 및 GitHub 연동

**산출물:**
- Convex 개발 환경 URL
- Clerk publishable key
- PostHog API key
- Railway 프로젝트 대시보드

---

### Phase 2: 인증 시스템 전환 (2-3일)

**현재 제거 대상:**
- `apps/web/src/contexts/AuthContext.tsx`
- `apps/web/src/hooks/useAuth.ts`
- `apps/api/src/auth/*` (전체 모듈)

**신규 구현:**
1. **Clerk React SDK 설치**
   ```bash
   cd apps/web
   pnpm add @clerk/clerk-react
   ```

2. **ClerkProvider 설정**
   ```tsx
   // apps/web/src/main.tsx
   import { ClerkProvider } from '@clerk/clerk-react';

   <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
     <App />
   </ClerkProvider>
   ```

3. **인증 페이지 교체**
   - `/login` → Clerk의 `<SignIn />` 컴포넌트
   - `/register` → Clerk의 `<SignUp />` 컴포넌트
   - `/profile` → `<UserProfile />` 컴포넌트

4. **라우팅 보호 변경**
   ```tsx
   // Before
   <ProtectedRoute><Dashboard /></ProtectedRoute>

   // After
   <SignedIn><Dashboard /></SignedIn>
   <SignedOut><RedirectToSignIn /></SignedOut>
   ```

**테스트:**
- [ ] 회원가입 플로우
- [ ] 로그인/로그아웃
- [ ] Google OAuth 로그인
- [ ] 보호된 라우트 접근 제어

---

### Phase 3: 데이터베이스 스키마 구축 (2-3일)

**Convex 스키마 작성 (`convex/schema.ts`):**

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    nickname: v.string(),
    profileImage: v.optional(v.string()),
    isActive: v.boolean(),
    isAdmin: v.boolean(),
    lastLoginAt: v.optional(v.number()),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  places: defineTable({
    name: v.string(),
    address: v.string(),
    phone: v.optional(v.string()),
    latitude: v.float64(),
    longitude: v.float64(),
    category: v.string(),
    description: v.optional(v.string()),
    externalUrl: v.optional(v.string()),
    externalId: v.optional(v.string()),
    isPublic: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_externalId", ["externalId"])
    .index("by_category", ["category"]),

  userPlaces: defineTable({
    userId: v.id("users"),
    placeId: v.id("places"),
    customName: v.optional(v.string()),
    labels: v.array(v.string()),
    memo: v.optional(v.string()),
    visited: v.boolean(),
    visitedAt: v.optional(v.number()),
    visitMemo: v.optional(v.string()),
    rating: v.optional(v.float64()),
    estimatedCost: v.optional(v.float64()),
    photos: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_placeId", ["placeId"])
    .index("by_userId_placeId", ["userId", "placeId"]),

  lists: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  listItems: defineTable({
    listId: v.id("lists"),
    userPlaceId: v.id("userPlaces"),
    order: v.float64(),
    addedAt: v.number(),
  })
    .index("by_listId", ["listId"])
    .index("by_listId_order", ["listId", "order"]),

  categories: defineTable({
    userId: v.id("users"),
    name: v.string(),
    color: v.string(),
    icon: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  reviews: defineTable({
    userId: v.id("users"),
    placeId: v.id("places"),
    rating: v.float64(),
    content: v.string(),
    photos: v.array(v.string()),
    isModerated: v.boolean(),
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_placeId", ["placeId"])
    .index("by_userId", ["userId"]),

  reports: defineTable({
    userId: v.id("users"),
    targetType: v.string(),
    targetId: v.string(),
    reason: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    isRead: v.boolean(),
    link: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_userId_isRead", ["userId", "isRead"]),
});
```

**배포:**
```bash
npx convex dev  # 개발 환경에 스키마 배포
```

**검증:**
- [ ] Convex 대시보드에서 테이블 생성 확인
- [ ] 인덱스 생성 확인
- [ ] 타입 파일 자동 생성 확인 (`convex/_generated`)

---

### Phase 4: 핵심 API 마이그레이션 (5-7일)

#### 4.1 장소 관리 API (`convex/places.ts`)

**Queries (데이터 조회):**
```typescript
// convex/places.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// 공개 장소 목록 조회
export const listPublicPlaces = query({
  args: {
    limit: v.optional(v.number()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const places = await ctx.db
      .query("places")
      .filter((q) => q.eq(q.field("isPublic"), true))
      .filter((q) =>
        args.category ? q.eq(q.field("category"), args.category) : true
      )
      .take(args.limit ?? 50);
    return places;
  },
});

// 내 장소 목록 조회
export const listMyPlaces = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const userPlaces = await ctx.db
      .query("userPlaces")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    // 관련 장소 정보 조인
    const placesWithDetails = await Promise.all(
      userPlaces.map(async (up) => {
        const place = await ctx.db.get(up.placeId);
        return { ...up, place };
      })
    );

    return placesWithDetails;
  },
});
```

**Mutations (데이터 변경):**
```typescript
// 장소 추가 (공개 장소 + 내 장소)
export const addPlace = mutation({
  args: {
    name: v.string(),
    address: v.string(),
    phone: v.optional(v.string()),
    latitude: v.number(),
    longitude: v.number(),
    category: v.string(),
    description: v.optional(v.string()),
    externalUrl: v.optional(v.string()),
    externalId: v.optional(v.string()),
    customName: v.optional(v.string()),
    labels: v.array(v.string()),
    memo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    // 1. 공개 장소 확인 또는 생성
    let place = args.externalId
      ? await ctx.db
          .query("places")
          .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
          .unique()
      : null;

    if (!place) {
      const placeId = await ctx.db.insert("places", {
        name: args.name,
        address: args.address,
        phone: args.phone,
        latitude: args.latitude,
        longitude: args.longitude,
        category: args.category,
        description: args.description,
        externalUrl: args.externalUrl,
        externalId: args.externalId,
        isPublic: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      place = await ctx.db.get(placeId);
    }

    if (!place) throw new Error("Failed to create place");

    // 2. 내 장소 생성
    const userPlaceId = await ctx.db.insert("userPlaces", {
      userId: user._id,
      placeId: place._id,
      customName: args.customName,
      labels: args.labels,
      memo: args.memo,
      visited: false,
      photos: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { userPlaceId, placeId: place._id };
  },
});

// 내 장소 업데이트
export const updateMyPlace = mutation({
  args: {
    userPlaceId: v.id("userPlaces"),
    customName: v.optional(v.string()),
    labels: v.optional(v.array(v.string())),
    memo: v.optional(v.string()),
    visited: v.optional(v.boolean()),
    visitedAt: v.optional(v.number()),
    visitMemo: v.optional(v.string()),
    rating: v.optional(v.number()),
    estimatedCost: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userPlace = await ctx.db.get(args.userPlaceId);
    if (!userPlace) throw new Error("UserPlace not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || userPlace.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const { userPlaceId, ...updates } = args;
    await ctx.db.patch(userPlaceId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// 내 장소 삭제
export const deleteMyPlace = mutation({
  args: { userPlaceId: v.id("userPlaces") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userPlace = await ctx.db.get(args.userPlaceId);
    if (!userPlace) throw new Error("UserPlace not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || userPlace.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.userPlaceId);
    return { success: true };
  },
});
```

#### 4.2 Google Places API 연동 (`convex/actions/googlePlaces.ts`)

```typescript
// convex/actions/googlePlaces.ts
import { action } from "../_generated/server";
import { v } from "convex/values";

export const searchPlaces = action({
  args: {
    query: v.string(),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) throw new Error("Google Maps API key not configured");

    const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    url.searchParams.set("query", args.query);
    url.searchParams.set("key", apiKey);
    if (args.location) {
      url.searchParams.set("location", `${args.location.lat},${args.location.lng}`);
      url.searchParams.set("radius", "5000");
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    return data.results.map((place: any) => ({
      name: place.name,
      address: place.formatted_address,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      externalId: place.place_id,
      category: place.types[0] || "기타",
      rating: place.rating,
      photos: place.photos?.map((p: any) => p.photo_reference) || [],
    }));
  },
});

export const getPlaceDetails = action({
  args: { placeId: v.string() },
  handler: async (ctx, args) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) throw new Error("Google Maps API key not configured");

    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    url.searchParams.set("place_id", args.placeId);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("fields", "name,formatted_address,geometry,formatted_phone_number,website,rating,reviews");

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    const place = data.result;
    return {
      name: place.name,
      address: place.formatted_address,
      phone: place.formatted_phone_number,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      externalUrl: place.website,
      rating: place.rating,
      reviews: place.reviews || [],
    };
  },
});
```

#### 4.3 리스트 관리 API (`convex/lists.ts`)

```typescript
// convex/lists.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const myLists = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    return await ctx.db
      .query("lists")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const getListWithPlaces = query({
  args: { listId: v.id("lists") },
  handler: async (ctx, args) => {
    const list = await ctx.db.get(args.listId);
    if (!list) throw new Error("List not found");

    const items = await ctx.db
      .query("listItems")
      .withIndex("by_listId_order", (q) => q.eq("listId", args.listId))
      .collect();

    const placesWithDetails = await Promise.all(
      items.map(async (item) => {
        const userPlace = await ctx.db.get(item.userPlaceId);
        const place = userPlace ? await ctx.db.get(userPlace.placeId) : null;
        return { item, userPlace, place };
      })
    );

    return { list, places: placesWithDetails };
  },
});

export const createList = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const listId = await ctx.db.insert("lists", {
      userId: user._id,
      name: args.name,
      description: args.description,
      isPublic: args.isPublic,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return listId;
  },
});

export const addPlaceToList = mutation({
  args: {
    listId: v.id("lists"),
    userPlaceId: v.id("userPlaces"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const list = await ctx.db.get(args.listId);
    if (!list) throw new Error("List not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || list.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // 최대 order 값 찾기
    const items = await ctx.db
      .query("listItems")
      .withIndex("by_listId", (q) => q.eq("listId", args.listId))
      .collect();

    const maxOrder = items.reduce((max, item) => Math.max(max, item.order), 0);

    const itemId = await ctx.db.insert("listItems", {
      listId: args.listId,
      userPlaceId: args.userPlaceId,
      order: maxOrder + 1,
      addedAt: Date.now(),
    });

    return itemId;
  },
});
```

#### 4.4 프론트엔드 API 호출 변경

**Before (REST API):**
```tsx
// apps/web/src/pages/Places.tsx
import { placesApi } from '#lib/api/places';

const Places = () => {
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    const loadPlaces = async () => {
      const data = await placesApi.getAll();
      setPlaces(data);
    };
    loadPlaces();
  }, []);

  return <div>{/* ... */}</div>;
};
```

**After (Convex):**
```tsx
// apps/web/src/pages/Places.tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

const Places = () => {
  // 실시간 데이터 구독 - 자동으로 리액티브하게 업데이트됨
  const places = useQuery(api.places.listMyPlaces);
  const addPlace = useMutation(api.places.addPlace);

  const handleAddPlace = async (placeData) => {
    try {
      await addPlace(placeData);
      toast.success("장소가 추가되었습니다");
    } catch (error) {
      toast.error("장소 추가 실패");
    }
  };

  if (places === undefined) return <div>로딩 중...</div>;

  return <div>{/* places 자동 업데이트 */}</div>;
};
```

**체크리스트:**
- [ ] 장소 CRUD 구현 및 테스트
- [ ] 리스트 CRUD 구현 및 테스트
- [ ] 카테고리 CRUD 구현 및 테스트
- [ ] 검색 기능 구현 및 테스트
- [ ] Google Places API 연동 테스트
- [ ] 실시간 업데이트 동작 확인

---

### Phase 5: 파일 업로드 마이그레이션 (2-3일)

**Convex File Storage 사용:**

```typescript
// convex/upload.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const savePhotoToPlace = mutation({
  args: {
    userPlaceId: v.id("userPlaces"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userPlace = await ctx.db.get(args.userPlaceId);
    if (!userPlace) throw new Error("UserPlace not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || userPlace.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new Error("Failed to get file URL");

    await ctx.db.patch(args.userPlaceId, {
      photos: [...userPlace.photos, url],
      updatedAt: Date.now(),
    });

    return { success: true, url };
  },
});
```

**프론트엔드:**
```tsx
// apps/web/src/components/PhotoUpload.tsx
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

const PhotoUpload = ({ userPlaceId }) => {
  const generateUploadUrl = useMutation(api.upload.generateUploadUrl);
  const savePhoto = useMutation(api.upload.savePhotoToPlace);

  const handleUpload = async (file: File) => {
    // 1. 업로드 URL 생성
    const uploadUrl = await generateUploadUrl();

    // 2. 파일 업로드
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });

    const { storageId } = await response.json();

    // 3. DB에 저장
    await savePhoto({ userPlaceId, storageId });
    toast.success("사진이 업로드되었습니다");
  };

  return <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />;
};
```

**체크리스트:**
- [ ] 업로드 URL 생성 구현
- [ ] 파일 업로드 프론트엔드 구현
- [ ] 이미지 압축 (browser-image-compression 유지)
- [ ] 저장된 이미지 표시 테스트

---

### Phase 6: 모니터링 및 분석 통합 (1-2일)

#### 6.1 PostHog 통합

```bash
cd apps/web
pnpm add posthog-js
```

```tsx
// apps/web/src/main.tsx
import posthog from 'posthog-js';

posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
  api_host: 'https://app.posthog.com',
});

// 사용자 식별 (Clerk와 통합)
import { useUser } from '@clerk/clerk-react';

const App = () => {
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      posthog.identify(user.id, {
        email: user.emailAddresses[0]?.emailAddress,
        name: user.fullName,
      });
    }
  }, [user]);
};

// 이벤트 트래킹
posthog.capture('place_added', {
  category: 'restaurant',
  source: 'google_maps',
});
```

#### 6.2 AxiomFM 통합

```bash
cd apps/web
pnpm add @axiomhq/js
```

```typescript
// apps/web/src/lib/axiom.ts
import { Axiom } from '@axiomhq/js';

const axiom = new Axiom({
  token: import.meta.env.VITE_AXIOM_TOKEN,
  dataset: import.meta.env.VITE_AXIOM_DATASET,
});

export const logError = (error: Error, context?: any) => {
  axiom.ingest([
    {
      level: 'error',
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    },
  ]);
};

export const logInfo = (message: string, data?: any) => {
  axiom.ingest([
    {
      level: 'info',
      message,
      data,
      timestamp: new Date().toISOString(),
    },
  ]);
};
```

**Convex 함수에서 로깅:**
```typescript
// convex/actions/logging.ts
import { action } from "../_generated/server";
import { v } from "convex/values";

export const logToAxiom = action({
  args: {
    level: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const axiomToken = process.env.AXIOM_TOKEN;
    const axiomDataset = process.env.AXIOM_DATASET;

    if (!axiomToken || !axiomDataset) return;

    await fetch(`https://api.axiom.co/v1/datasets/${axiomDataset}/ingest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${axiomToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          level: args.level,
          message: args.message,
          data: args.data,
          timestamp: new Date().toISOString(),
        },
      ]),
    });
  },
});
```

**체크리스트:**
- [ ] PostHog 초기화 및 사용자 식별
- [ ] 주요 이벤트 트래킹 구현
- [ ] AxiomFM 로깅 설정
- [ ] 에러 로깅 테스트

---

### Phase 7: Railway 배포 (1일)

#### 7.1 Railway 프로젝트 설정

**Railway 대시보드:**
1. New Project → Deploy from GitHub repo
2. 저장소 선택: `travel-planner`
3. Root directory: `apps/web`

#### 7.2 빌드 설정

**`railway.toml` 생성:**
```toml
[build]
builder = "nixpacks"
buildCommand = "pnpm install && pnpm run build"

[deploy]
startCommand = "pnpm run preview"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3

[env]
VITE_CONVEX_URL = "$VITE_CONVEX_URL"
VITE_CLERK_PUBLISHABLE_KEY = "$VITE_CLERK_PUBLISHABLE_KEY"
VITE_POSTHOG_KEY = "$VITE_POSTHOG_KEY"
VITE_GOOGLE_MAPS_API_KEY = "$VITE_GOOGLE_MAPS_API_KEY"
```

또는 Vite Preview 대신 **정적 서버 사용:**
```bash
pnpm add -D sirv-cli
```

**package.json 수정:**
```json
{
  "scripts": {
    "preview": "sirv dist --port $PORT --host 0.0.0.0 --single"
  }
}
```

#### 7.3 환경 변수 설정

Railway 대시보드에서 환경 변수 추가:
- `VITE_CONVEX_URL`: Convex 프로덕션 URL
- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk 퍼블릭 키
- `VITE_POSTHOG_KEY`: PostHog API 키
- `VITE_GOOGLE_MAPS_API_KEY`: Google Maps API 키
- `VITE_AXIOM_TOKEN`: AxiomFM 토큰
- `VITE_AXIOM_DATASET`: AxiomFM 데이터셋

#### 7.4 도메인 연결

Railway 대시보드:
1. Settings → Networking
2. Generate Domain (Railway 제공 도메인)
3. 또는 Custom Domain 연결

#### 7.5 CI/CD 설정

**자동 배포 활성화:**
- Railway는 기본적으로 GitHub main 브랜치 푸시 시 자동 배포
- PR 생성 시 Preview Deployment 자동 생성

**체크리스트:**
- [ ] Railway 프로젝트 생성
- [ ] 빌드 설정 완료
- [ ] 환경 변수 설정
- [ ] 배포 성공 확인
- [ ] 도메인 접속 테스트
- [ ] CI/CD 파이프라인 동작 확인

---

### Phase 8: 테스팅 및 검증 (2-3일)

#### 8.1 기능 테스트 체크리스트

**인증:**
- [ ] 회원가입 (이메일)
- [ ] 로그인 (이메일)
- [ ] Google OAuth 로그인
- [ ] 로그아웃
- [ ] 프로필 수정
- [ ] 비밀번호 재설정 (Clerk 제공)

**장소 관리:**
- [ ] 공개 장소 검색
- [ ] Google Places 검색
- [ ] 내 장소 추가
- [ ] 내 장소 수정
- [ ] 내 장소 삭제
- [ ] 장소 상세 조회
- [ ] 사진 업로드
- [ ] 방문 체크
- [ ] 평점/메모 추가

**리스트 관리:**
- [ ] 리스트 생성
- [ ] 리스트 수정
- [ ] 리스트 삭제
- [ ] 리스트에 장소 추가
- [ ] 리스트에서 장소 제거
- [ ] 리스트 순서 변경

**실시간 기능:**
- [ ] 데이터 자동 동기화 (다른 탭에서 변경 시)
- [ ] 충돌 해결 (Convex 자동 처리)

#### 8.2 성능 테스트

- [ ] Lighthouse 점수 (90점 이상 목표)
  - Performance
  - Accessibility
  - Best Practices
  - SEO
- [ ] Google Maps 로드 시간
- [ ] 이미지 로드 최적화
- [ ] 번들 사이즈 확인 (< 500KB gzip)

#### 8.3 보안 검증

- [ ] Clerk 인증 토큰 검증
- [ ] HTTPS 강제
- [ ] XSS 방지
- [ ] CSRF 방지 (Convex 자동 처리)
- [ ] API Rate Limiting (Convex 자동)
- [ ] 환경 변수 노출 확인

#### 8.4 모니터링 확인

- [ ] PostHog 이벤트 수집 확인
- [ ] AxiomFM 로그 수집 확인
- [ ] Railway 배포 로그 확인
- [ ] Convex 함수 실행 로그 확인

---

### Phase 9: 클린업 (1일)

**제거 대상:**

1. **백엔드 디렉토리 전체:**
   ```bash
   rm -rf apps/api
   ```

2. **Docker 설정:**
   ```bash
   rm docker-compose.dev.yml
   rm docker-compose.prod.yml
   rm -rf nginx
   ```

3. **미사용 의존성:**
   ```bash
   # Root package.json 업데이트
   # apps/web/package.json에서 ky, 커스텀 API 클라이언트 제거
   pnpm remove ky
   ```

4. **환경 변수 파일:**
   ```bash
   rm apps/api/.env*
   ```

5. **문서 업데이트:**
   - [ ] README.md 업데이트 (새 아키텍처 반영)
   - [ ] CLAUDE.md 업데이트 (Convex 관련 규칙 추가)
   - [ ] 배포 가이드 작성

**새로운 README.md 구조:**
```markdown
# Travel Planner

## 기술 스택
- Frontend: React + Vite + TypeScript
- Backend: Convex (서버리스)
- Auth: Clerk
- Hosting: Railway
- Analytics: PostHog
- Logging: AxiomFM

## 개발 환경 설정

### 1. 의존성 설치
\`\`\`bash
pnpm install
\`\`\`

### 2. 환경 변수 설정
\`\`\`bash
cp apps/web/.env.example apps/web/.env
# .env 파일 편집
\`\`\`

### 3. Convex 개발 서버 시작
\`\`\`bash
npx convex dev
\`\`\`

### 4. Frontend 개발 서버 시작
\`\`\`bash
cd apps/web
pnpm dev
\`\`\`

## 배포
- Railway 자동 배포 (main 브랜치 푸시 시)
- Convex 프로덕션 배포: \`npx convex deploy\`
```

**체크리스트:**
- [ ] 백엔드 파일 제거
- [ ] Docker 설정 제거
- [ ] 미사용 의존성 제거
- [ ] 문서 업데이트
- [ ] Git 커밋 및 푸시

---

## 🚨 주요 리스크 및 대응 방안

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|----------|
| **Convex 무료 티어 초과** | 중 | 사용량 모니터링, 필요시 유료 플랜 ($25/월) |
| **Google Maps API 호출 증가** | 중 | 캐싱 전략 유지, externalId 중복 방지 |
| **학습 곡선** | 중 | 단계적 도입, 문서화 강화 |
| **파일 스토리지 마이그레이션** | 하 | Convex Storage로 전환, 기존 URL 유지 |
| **실시간 기능 복잡도** | 하 | Convex 공식 문서 참고, 간단한 구독부터 시작 |

---

## 📚 참고 자료

### Convex
- 공식 문서: https://docs.convex.dev
- React 통합: https://docs.convex.dev/client/react
- 인증 (Clerk): https://docs.convex.dev/auth/clerk

### Clerk
- 공식 문서: https://clerk.com/docs
- React 통합: https://clerk.com/docs/quickstarts/react

### Railway
- 공식 문서: https://docs.railway.app
- 배포 가이드: https://docs.railway.app/deploy/deployments

### PostHog
- 공식 문서: https://posthog.com/docs
- React 통합: https://posthog.com/docs/libraries/react

### AxiomFM
- 공식 문서: https://axiom.co/docs
- JavaScript SDK: https://axiom.co/docs/send-data/ingest#using-the-javascript-sdk

---

## ✅ 최종 체크리스트

**환경 준비:**
- [ ] Convex 계정 생성
- [ ] Clerk 앱 설정
- [ ] PostHog 프로젝트 생성
- [ ] AxiomFM 데이터셋 생성
- [ ] Railway 프로젝트 생성

**코어 마이그레이션:**
- [ ] 인증 시스템 전환
- [ ] 데이터베이스 스키마 구축
- [ ] 장소 API 마이그레이션
- [ ] 리스트 API 마이그레이션
- [ ] 카테고리 API 마이그레이션
- [ ] 검색 API 마이그레이션
- [ ] 파일 업로드 마이그레이션

**통합:**
- [ ] PostHog 통합
- [ ] AxiomFM 통합
- [ ] Google Places API 연동

**배포:**
- [ ] Railway 배포 설정
- [ ] 환경 변수 구성
- [ ] CI/CD 파이프라인 구성

**테스팅:**
- [ ] 기능 테스트
- [ ] 성능 테스트
- [ ] 보안 검증

**클린업:**
- [ ] 백엔드 제거
- [ ] 문서 업데이트

---

## 🎓 다음 단계

1. **프로토타입 구축** (2-3일)
   - Convex 튜토리얼 학습
   - Clerk 통합 테스트
   - 간단한 CRUD 구현

2. **본격 마이그레이션** (3-4주)
   - 위 계획에 따라 단계별 진행

3. **프로덕션 배포**
   - Railway 배포
   - 모니터링 활성화
   - 사용자 피드백 수집

---

**작성일:** 2025-01-17
**작성자:** Claude Code (AI Agent)
**문서 버전:** 1.0
