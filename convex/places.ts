/**
 * Places API - Convex Queries & Mutations
 *
 * 장소 관리 API입니다. 공개 장소 조회 및 내 장소 CRUD를 제공합니다.
 * Clerk 인증과 통합되어 있습니다.
 */

import { query, mutation } from "./_generated/server";
import { type QueryCtx, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";

/**
 * 현재 인증된 사용자 정보를 가져오는 헬퍼 함수
 */
async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

// ==================== Queries (데이터 조회) ====================

/**
 * 공개 장소 목록 조회
 *
 * 모든 사용자가 조회 가능한 공개 장소 목록을 반환합니다.
 * Google Maps API 호출을 최소화하기 위한 캐싱된 데이터입니다.
 */
export const listPublicPlaces = query({
  args: {
    limit: v.optional(v.number()),
    category: v.optional(v.string()),
  },
  handler: async (ctx: QueryCtx, args) => {
    let placesQuery = ctx.db
      .query("places")
      .withIndex("by_isPublic", (q) => q.eq("isPublic", true));

    // 카테고리 필터링
    const places = await placesQuery.collect();

    let filteredPlaces = places;
    if (args.category) {
      filteredPlaces = places.filter((p) => p.category === args.category);
    }

    // 제한 적용
    const limit = args.limit ?? 50;
    return filteredPlaces.slice(0, limit);
  },
});

/**
 * 장소 상세 조회 (ID로)
 */
export const getPlace = query({
  args: { placeId: v.id("places") },
  handler: async (ctx: QueryCtx, args) => {
    const place = await ctx.db.get(args.placeId);
    if (!place) {
      throw new Error("Place not found");
    }
    return place;
  },
});

/**
 * 장소 검색 (이름, 주소, 설명)
 *
 * 텍스트 기반 검색을 제공합니다.
 */
export const searchPlaces = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: QueryCtx, args) => {
    const places = await ctx.db
      .query("places")
      .withIndex("by_isPublic", (q) => q.eq("isPublic", true))
      .collect();

    const searchQuery = args.query.toLowerCase();
    const filteredPlaces = places.filter((place) => {
      const nameMatch = place.name.toLowerCase().includes(searchQuery);
      const addressMatch = place.address.toLowerCase().includes(searchQuery);
      const descMatch = place.description?.toLowerCase().includes(searchQuery);
      return nameMatch || addressMatch || descMatch;
    });

    const limit = args.limit ?? 20;
    return filteredPlaces.slice(0, limit);
  },
});

/**
 * 내 장소 목록 조회
 *
 * 현재 로그인한 사용자의 장소 목록을 반환합니다.
 * 장소 정보와 함께 반환됩니다.
 */
export const listMyPlaces = query({
  args: {
    visited: v.optional(v.boolean()),
  },
  handler: async (ctx: QueryCtx, args) => {
    const user = await getCurrentUser(ctx);

    let userPlacesQuery = ctx.db
      .query("userPlaces")
      .withIndex("by_userId", (q) => q.eq("userId", user._id));

    const userPlaces = await userPlacesQuery.collect();

    // 방문 여부 필터링
    let filteredPlaces = userPlaces;
    if (args.visited !== undefined) {
      filteredPlaces = userPlaces.filter((up) => up.visited === args.visited);
    }

    // 관련 장소 정보 조인
    const placesWithDetails = await Promise.all(
      filteredPlaces.map(async (up) => {
        const place = await ctx.db.get(up.placeId);
        return {
          ...up,
          place,
        };
      })
    );

    return placesWithDetails;
  },
});

/**
 * 내 장소 상세 조회
 */
export const getMyPlace = query({
  args: { userPlaceId: v.id("userPlaces") },
  handler: async (ctx: QueryCtx, args) => {
    const user = await getCurrentUser(ctx);
    const userPlace = await ctx.db.get(args.userPlaceId);

    if (!userPlace) {
      throw new Error("UserPlace not found");
    }

    if (userPlace.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const place = await ctx.db.get(userPlace.placeId);

    return {
      ...userPlace,
      place,
    };
  },
});

// ==================== Mutations (데이터 변경) ====================

/**
 * 장소 추가 (공개 장소 + 내 장소)
 *
 * 1. externalId로 공개 장소 확인 또는 생성
 * 2. 내 장소 생성
 *
 * 이중 장소 저장 구조를 사용합니다:
 * - Place: 모든 사용자가 공유하는 기본 정보 (캐싱)
 * - UserPlace: 사용자별 개인화 정보
 */
export const addPlace = mutation({
  args: {
    // Place 정보
    name: v.string(),
    address: v.string(),
    phone: v.optional(v.string()),
    latitude: v.number(),
    longitude: v.number(),
    category: v.string(),
    description: v.optional(v.string()),
    externalUrl: v.optional(v.string()),
    externalId: v.optional(v.string()),
    // UserPlace 정보
    customName: v.optional(v.string()),
    labels: v.optional(v.array(v.string())),
    memo: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const user = await getCurrentUser(ctx);

    // 1. 공개 장소 확인 또는 생성
    let place = args.externalId
      ? await ctx.db
          .query("places")
          .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId!))
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

    if (!place) {
      throw new Error("Failed to create place");
    }

    // 2. 중복 확인 (사용자가 이미 추가한 장소인지)
    const existingUserPlace = await ctx.db
      .query("userPlaces")
      .withIndex("by_userId_placeId", (q) =>
        q.eq("userId", user._id).eq("placeId", place!._id)
      )
      .unique();

    if (existingUserPlace) {
      throw new Error("이미 추가된 장소입니다");
    }

    // 3. 내 장소 생성
    const userPlaceId = await ctx.db.insert("userPlaces", {
      userId: user._id,
      placeId: place._id,
      customName: args.customName,
      labels: args.labels ?? [],
      memo: args.memo,
      visited: false,
      photos: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      userPlaceId,
      placeId: place._id,
    };
  },
});

/**
 * 내 장소 업데이트
 *
 * 개인화 정보만 업데이트 가능합니다.
 * 공개 장소 정보는 변경할 수 없습니다.
 */
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
  handler: async (ctx: MutationCtx, args) => {
    const user = await getCurrentUser(ctx);
    const userPlace = await ctx.db.get(args.userPlaceId);

    if (!userPlace) {
      throw new Error("UserPlace not found");
    }

    if (userPlace.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // 유효성 검증
    if (args.rating !== undefined && (args.rating < 0 || args.rating > 5)) {
      throw new Error("평점은 0에서 5 사이여야 합니다");
    }

    const { userPlaceId, ...updates } = args;

    await ctx.db.patch(userPlaceId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * 내 장소 삭제
 *
 * UserPlace만 삭제하며, 공개 장소(Place)는 삭제하지 않습니다.
 */
export const deleteMyPlace = mutation({
  args: { userPlaceId: v.id("userPlaces") },
  handler: async (ctx: MutationCtx, args) => {
    const user = await getCurrentUser(ctx);
    const userPlace = await ctx.db.get(args.userPlaceId);

    if (!userPlace) {
      throw new Error("UserPlace not found");
    }

    if (userPlace.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.userPlaceId);

    return { success: true };
  },
});

/**
 * 방문 체크 토글
 *
 * 방문 여부를 토글하고, 방문 날짜를 자동으로 설정합니다.
 */
export const toggleVisited = mutation({
  args: {
    userPlaceId: v.id("userPlaces"),
  },
  handler: async (ctx: MutationCtx, args) => {
    const user = await getCurrentUser(ctx);
    const userPlace = await ctx.db.get(args.userPlaceId);

    if (!userPlace) {
      throw new Error("UserPlace not found");
    }

    if (userPlace.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const newVisited = !userPlace.visited;

    await ctx.db.patch(args.userPlaceId, {
      visited: newVisited,
      visitedAt: newVisited ? Date.now() : undefined,
      updatedAt: Date.now(),
    });

    return { visited: newVisited };
  },
});

/**
 * 장소 라벨 추가
 */
export const addLabel = mutation({
  args: {
    userPlaceId: v.id("userPlaces"),
    label: v.string(),
  },
  handler: async (ctx: MutationCtx, args) => {
    const user = await getCurrentUser(ctx);
    const userPlace = await ctx.db.get(args.userPlaceId);

    if (!userPlace) {
      throw new Error("UserPlace not found");
    }

    if (userPlace.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // 중복 체크
    if (userPlace.labels.includes(args.label)) {
      throw new Error("이미 추가된 라벨입니다");
    }

    await ctx.db.patch(args.userPlaceId, {
      labels: [...userPlace.labels, args.label],
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * 장소 라벨 제거
 */
export const removeLabel = mutation({
  args: {
    userPlaceId: v.id("userPlaces"),
    label: v.string(),
  },
  handler: async (ctx: MutationCtx, args) => {
    const user = await getCurrentUser(ctx);
    const userPlace = await ctx.db.get(args.userPlaceId);

    if (!userPlace) {
      throw new Error("UserPlace not found");
    }

    if (userPlace.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.userPlaceId, {
      labels: userPlace.labels.filter((l) => l !== args.label),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
