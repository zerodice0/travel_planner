# Convex Backend API

Travel Planner의 Convex 백엔드 API 문서입니다.

## 📁 프로젝트 구조

```
convex/
├── _generated/           # 자동 생성된 타입 파일 (git ignore)
├── actions/             # 외부 API 호출을 위한 Actions
│   └── googlePlaces.ts  # Google Places API 연동
├── schema.ts            # 데이터베이스 스키마 정의
├── users.ts             # 사용자 관리 API
├── places.ts            # 장소 관리 API
├── lists.ts             # 리스트 관리 API
├── upload.ts            # 파일 업로드 API
├── tsconfig.json        # TypeScript 설정
└── README.md            # 이 문서
```

## 🗄️ 데이터베이스 스키마

### 주요 테이블

| 테이블 | 설명 | 주요 인덱스 |
|--------|------|-----------|
| **users** | 사용자 정보 (Clerk 연동) | clerkId, email |
| **places** | 공개 장소 (캐싱) | externalId, category |
| **userPlaces** | 내 장소 (개인화) | userId, placeId |
| **lists** | 여행 리스트 | userId, isPublic |
| **listItems** | 리스트 항목 | listId, order |
| **categories** | 카테고리 | userId, name |
| **reviews** | 리뷰 | placeId, userId |
| **reports** | 신고 | targetType, status |
| **notifications** | 알림 | userId, isRead |

### 관계도

```
User (Clerk)
  ├── UserPlace (1:N)
  │   └── Place (N:1)
  ├── List (1:N)
  │   └── ListItem (1:N)
  │       └── UserPlace (N:1)
  └── Review (1:N)
      └── Place (N:1)
```

## 📚 API 문서

### 1. Users API (users.ts)

사용자 관리 API입니다.

#### Queries

| 함수 | 설명 | 인증 |
|------|------|------|
| `getCurrentUserInfo` | 현재 로그인한 사용자 정보 조회 | ✅ |
| `getUserById` | 사용자 ID로 조회 | ✅ |
| `searchUsers` | 닉네임으로 사용자 검색 | ✅ |
| `getUserStats` | 사용자 통계 조회 | ✅ |

#### Mutations

| 함수 | 설명 | 인증 |
|------|------|------|
| `createUser` | 사용자 생성 (Internal) | 🔒 |
| `updateUser` | 사용자 정보 업데이트 (Internal) | 🔒 |
| `deleteUser` | 사용자 삭제 (Internal) | 🔒 |
| `updateProfile` | 프로필 업데이트 | ✅ |
| `updateLastLogin` | 마지막 로그인 시간 업데이트 | ✅ |

**사용 예시:**

```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

const MyProfile = () => {
  // 현재 사용자 정보 조회
  const user = useQuery(api.users.getCurrentUserInfo);
  const updateProfile = useMutation(api.users.updateProfile);

  const handleUpdate = async () => {
    await updateProfile({
      nickname: "새 닉네임",
    });
  };

  return <div>{user?.nickname}</div>;
};
```

---

### 2. Places API (places.ts)

장소 관리 API입니다.

#### Queries

| 함수 | 설명 | 인증 | 매개변수 |
|------|------|------|---------|
| `listPublicPlaces` | 공개 장소 목록 조회 | ❌ | limit?, category? |
| `getPlace` | 장소 상세 조회 | ❌ | placeId |
| `searchPlaces` | 장소 검색 | ❌ | query, limit? |
| `listMyPlaces` | 내 장소 목록 조회 | ✅ | visited? |
| `getMyPlace` | 내 장소 상세 조회 | ✅ | userPlaceId |

#### Mutations

| 함수 | 설명 | 인증 | 매개변수 |
|------|------|------|---------|
| `addPlace` | 장소 추가 | ✅ | name, address, latitude, longitude, ... |
| `updateMyPlace` | 내 장소 업데이트 | ✅ | userPlaceId, customName?, labels?, ... |
| `deleteMyPlace` | 내 장소 삭제 | ✅ | userPlaceId |
| `toggleVisited` | 방문 체크 토글 | ✅ | userPlaceId |
| `addLabel` | 라벨 추가 | ✅ | userPlaceId, label |
| `removeLabel` | 라벨 제거 | ✅ | userPlaceId, label |

**사용 예시:**

```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

const MyPlaces = () => {
  // 내 장소 목록 조회 (실시간 구독)
  const places = useQuery(api.places.listMyPlaces);
  const addPlace = useMutation(api.places.addPlace);
  const toggleVisited = useMutation(api.places.toggleVisited);

  const handleAddPlace = async (placeData) => {
    await addPlace({
      name: placeData.name,
      address: placeData.address,
      latitude: placeData.lat,
      longitude: placeData.lng,
      category: "음식점",
      labels: ["가고싶은곳"],
    });
  };

  return (
    <div>
      {places?.map((p) => (
        <div key={p._id}>
          {p.place?.name}
          <button onClick={() => toggleVisited({ userPlaceId: p._id })}>
            방문 체크
          </button>
        </div>
      ))}
    </div>
  );
};
```

---

### 3. Lists API (lists.ts)

리스트 관리 API입니다.

#### Queries

| 함수 | 설명 | 인증 | 매개변수 |
|------|------|------|---------|
| `myLists` | 내 리스트 목록 조회 | ✅ | - |
| `getList` | 리스트 상세 조회 | ✅ | listId |
| `getListWithPlaces` | 리스트와 장소 목록 조회 | ✅ | listId |
| `publicLists` | 공개 리스트 목록 조회 | ❌ | limit? |

#### Mutations

| 함수 | 설명 | 인증 | 매개변수 |
|------|------|------|---------|
| `createList` | 리스트 생성 | ✅ | name, description?, isPublic? |
| `updateList` | 리스트 업데이트 | ✅ | listId, name?, description?, isPublic? |
| `deleteList` | 리스트 삭제 | ✅ | listId |
| `addPlaceToList` | 리스트에 장소 추가 | ✅ | listId, userPlaceId |
| `removePlaceFromList` | 리스트에서 장소 제거 | ✅ | listItemId |
| `reorderListItems` | 리스트 항목 순서 변경 | ✅ | listId, itemOrders |
| `toggleListVisibility` | 공개/비공개 토글 | ✅ | listId |

**사용 예시:**

```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

const MyLists = () => {
  const lists = useQuery(api.lists.myLists);
  const createList = useMutation(api.lists.createList);
  const addPlaceToList = useMutation(api.lists.addPlaceToList);

  const handleCreateList = async () => {
    const listId = await createList({
      name: "서울 맛집 투어",
      description: "꼭 가봐야 할 서울 맛집",
      isPublic: false,
    });

    // 리스트에 장소 추가
    await addPlaceToList({
      listId,
      userPlaceId: "userplace_id_here",
    });
  };

  return (
    <div>
      {lists?.map((list) => (
        <div key={list._id}>
          {list.name} ({list.itemCount}개)
        </div>
      ))}
    </div>
  );
};
```

---

### 4. Upload API (upload.ts)

파일 업로드 API입니다.

#### Mutations

| 함수 | 설명 | 인증 | 매개변수 |
|------|------|------|---------|
| `generateUploadUrl` | 업로드 URL 생성 | ✅ | - |
| `savePhotoToPlace` | 장소에 사진 추가 | ✅ | userPlaceId, storageId |
| `removePhotoFromPlace` | 장소에서 사진 제거 | ✅ | userPlaceId, photoUrl |
| `savePhotoToReview` | 리뷰에 사진 추가 | ✅ | reviewId, storageId |
| `updateProfileImage` | 프로필 이미지 업데이트 | ✅ | storageId |

#### Queries

| 함수 | 설명 | 인증 | 매개변수 |
|------|------|------|---------|
| `getFileUrl` | 파일 URL 조회 | ❌ | storageId |
| `getFileMetadata` | 파일 메타데이터 조회 | ❌ | storageId |

**사용 예시:**

```typescript
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
  };

  return (
    <input
      type="file"
      onChange={(e) => handleUpload(e.target.files[0])}
    />
  );
};
```

---

### 5. Google Places API (actions/googlePlaces.ts)

Google Places API 연동 Actions입니다.

#### Actions

| 함수 | 설명 | 매개변수 |
|------|------|---------|
| `searchPlaces` | 장소 검색 (Text Search) | query, location?, radius? |
| `searchNearbyPlaces` | 주변 장소 검색 | location, radius?, type?, keyword? |
| `getPlaceDetails` | 장소 상세 정보 조회 | placeId |
| `getPhotoUrl` | 사진 URL 생성 | photoReference, maxWidth?, maxHeight? |
| `autocomplete` | 자동완성 | input, location?, radius? |

**사용 예시:**

```typescript
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";

const PlaceSearch = () => {
  const searchPlaces = useAction(api.actions.googlePlaces.searchPlaces);

  const handleSearch = async (query: string) => {
    const results = await searchPlaces({
      query,
      location: { lat: 37.5665, lng: 126.9780 }, // 서울
      radius: 5000,
    });

    console.log(results);
  };

  return <input onChange={(e) => handleSearch(e.target.value)} />;
};
```

## 🔐 인증 (Authentication)

### Clerk 통합

Convex는 Clerk와 완벽하게 통합됩니다.

**Frontend 설정:**

```typescript
// apps/web/src/main.tsx
import { ClerkProvider } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

<ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
  <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
    <App />
  </ConvexProviderWithClerk>
</ClerkProvider>
```

**Convex 함수에서 인증 확인:**

```typescript
export const myFunction = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    return user;
  },
});
```

## 🚀 배포

### 개발 환경

```bash
npx convex dev
```

### 프로덕션 배포

```bash
npx convex deploy
```

## 📊 모니터링

Convex 대시보드에서 다음 정보를 모니터링할 수 있습니다:

- **Functions**: 함수 실행 로그 및 성능
- **Data**: 실시간 데이터베이스 탐색
- **Logs**: 함수 실행 로그 및 오류
- **Settings**: 환경 변수 및 배포 설정

## 🔧 개발 팁

### 1. 실시간 데이터 구독

Convex Query는 자동으로 실시간 구독됩니다:

```typescript
// 데이터가 변경되면 자동으로 재렌더링됨
const places = useQuery(api.places.listMyPlaces);
```

### 2. Optimistic Updates

```typescript
const addPlace = useMutation(api.places.addPlace);

const handleAdd = async (data) => {
  // Optimistic update
  const optimisticPlace = { ...data, _id: "temp_id" };
  setPlaces([...places, optimisticPlace]);

  try {
    await addPlace(data);
  } catch (error) {
    // 실패 시 롤백
    setPlaces(places.filter((p) => p._id !== "temp_id"));
  }
};
```

### 3. 타입 안전성

Convex는 자동으로 TypeScript 타입을 생성합니다:

```typescript
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

// 타입 안전한 API 호출
const places = useQuery(api.places.listMyPlaces);
const placeId: Id<"places"> = "place_id_here";
```

## 🐛 디버깅

### 로그 확인

```typescript
export const myFunction = query({
  handler: async (ctx, args) => {
    console.log("Arguments:", args);
    // Convex 대시보드의 Logs 탭에서 확인 가능
  },
});
```

### 에러 핸들링

```typescript
export const myFunction = mutation({
  handler: async (ctx, args) => {
    try {
      // 로직 실행
    } catch (error) {
      console.error("Error:", error);
      throw new Error("사용자에게 표시할 에러 메시지");
    }
  },
});
```

---

**작성일:** 2025-01-18
**문서 버전:** 1.0
