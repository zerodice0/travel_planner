/**
 * Users API - Convex Queries & Mutations
 *
 * 사용자 관리 API입니다.
 * Clerk Webhook과 통합하여 사용자 정보를 동기화합니다.
 */

import { query, mutation, internalMutation } from "./_generated/server";
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
 * 현재 로그인한 사용자 정보 조회
 */
export const getCurrentUserInfo = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return user;
  },
});

/**
 * 사용자 ID로 조회
 */
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx: QueryCtx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // 공개 정보만 반환
    return {
      _id: user._id,
      nickname: user.nickname,
      profileImage: user.profileImage,
      isActive: user.isActive,
    };
  },
});

/**
 * 사용자 검색 (닉네임으로)
 */
export const searchUsers = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: QueryCtx, args) => {
    const users = await ctx.db.query("users").collect();

    const searchQuery = args.query.toLowerCase();
    const filteredUsers = users.filter((user) =>
      user.nickname.toLowerCase().includes(searchQuery)
    );

    const limit = args.limit ?? 10;
    return filteredUsers.slice(0, limit).map((user) => ({
      _id: user._id,
      nickname: user.nickname,
      profileImage: user.profileImage,
    }));
  },
});

// ==================== Mutations (데이터 변경) ====================

/**
 * 사용자 생성 (Clerk Webhook에서 호출)
 *
 * Clerk에서 새 사용자가 생성되면 자동으로 호출됩니다.
 * Internal Mutation으로 보호되어 있습니다.
 */
export const createUser = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    nickname: v.string(),
    profileImage: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    // 중복 확인
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      nickname: args.nickname,
      profileImage: args.profileImage,
      isActive: true,
      isAdmin: false,
      lastLoginAt: Date.now(),
    });

    return userId;
  },
});

/**
 * 사용자 정보 업데이트 (Clerk Webhook에서 호출)
 */
export const updateUser = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    nickname: v.optional(v.string()),
    profileImage: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const { clerkId, ...updates } = args;

    await ctx.db.patch(user._id, updates);

    return { success: true };
  },
});

/**
 * 사용자 삭제 (Clerk Webhook에서 호출)
 */
export const deleteUser = internalMutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx: MutationCtx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // 사용자 비활성화 (실제 삭제하지 않음)
    await ctx.db.patch(user._id, {
      isActive: false,
    });

    return { success: true };
  },
});

/**
 * 프로필 업데이트 (사용자가 직접 호출)
 */
export const updateProfile = mutation({
  args: {
    nickname: v.optional(v.string()),
    profileImage: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const user = await getCurrentUser(ctx);

    // 닉네임 중복 확인
    if (args.nickname) {
      const existingUser = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("nickname"), args.nickname))
        .first();

      if (existingUser && existingUser._id !== user._id) {
        throw new Error("이미 사용 중인 닉네임입니다");
      }
    }

    await ctx.db.patch(user._id, args);

    return { success: true };
  },
});

/**
 * 마지막 로그인 시간 업데이트
 */
export const updateLastLogin = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    await ctx.db.patch(user._id, {
      lastLoginAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * 사용자 통계 조회
 */
export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    // 내 장소 개수
    const userPlaces = await ctx.db
      .query("userPlaces")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    // 방문한 장소 개수
    const visitedPlaces = userPlaces.filter((up) => up.visited).length;

    // 리스트 개수
    const lists = await ctx.db
      .query("lists")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    // 리뷰 개수
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    return {
      totalPlaces: userPlaces.length,
      visitedPlaces,
      totalLists: lists.length,
      totalReviews: reviews.length,
    };
  },
});
