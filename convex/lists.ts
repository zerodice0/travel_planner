/**
 * Lists API - Convex Queries & Mutations
 *
 * 여행 리스트 관리 API입니다.
 * 리스트 CRUD 및 리스트 항목 관리를 제공합니다.
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
 * 내 리스트 목록 조회
 */
export const myLists = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    const user = await getCurrentUser(ctx);

    const lists = await ctx.db
      .query("lists")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    // 각 리스트의 장소 개수 포함
    const listsWithCount = await Promise.all(
      lists.map(async (list) => {
        const items = await ctx.db
          .query("listItems")
          .withIndex("by_listId", (q) => q.eq("listId", list._id))
          .collect();

        return {
          ...list,
          itemCount: items.length,
        };
      })
    );

    return listsWithCount;
  },
});

/**
 * 리스트 상세 조회 (리스트 정보만)
 */
export const getList = query({
  args: { listId: v.id("lists") },
  handler: async (ctx: QueryCtx, args) => {
    const user = await getCurrentUser(ctx);
    const list = await ctx.db.get(args.listId);

    if (!list) {
      throw new Error("List not found");
    }

    // 공개 리스트가 아니면 본인만 조회 가능
    if (!list.isPublic && list.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    return list;
  },
});

/**
 * 리스트와 포함된 장소 목록 조회
 *
 * 리스트 정보와 함께 장소 목록을 반환합니다.
 * order 기준으로 정렬됩니다.
 */
export const getListWithPlaces = query({
  args: { listId: v.id("lists") },
  handler: async (ctx: QueryCtx, args) => {
    const user = await getCurrentUser(ctx);
    const list = await ctx.db.get(args.listId);

    if (!list) {
      throw new Error("List not found");
    }

    // 공개 리스트가 아니면 본인만 조회 가능
    if (!list.isPublic && list.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const items = await ctx.db
      .query("listItems")
      .withIndex("by_listId_order", (q) => q.eq("listId", args.listId))
      .collect();

    // 장소 정보 조인
    const placesWithDetails = await Promise.all(
      items.map(async (item) => {
        const userPlace = await ctx.db.get(item.userPlaceId);
        const place = userPlace ? await ctx.db.get(userPlace.placeId) : null;

        return {
          item,
          userPlace,
          place,
        };
      })
    );

    return {
      list,
      places: placesWithDetails,
    };
  },
});

/**
 * 공개 리스트 목록 조회
 *
 * 모든 사용자가 조회 가능한 공개 리스트 목록을 반환합니다.
 */
export const publicLists = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx: QueryCtx, args) => {
    const lists = await ctx.db
      .query("lists")
      .withIndex("by_isPublic", (q) => q.eq("isPublic", true))
      .collect();

    const limit = args.limit ?? 20;
    const limitedLists = lists.slice(0, limit);

    // 각 리스트의 장소 개수 및 생성자 정보 포함
    const listsWithDetails = await Promise.all(
      limitedLists.map(async (list) => {
        const items = await ctx.db
          .query("listItems")
          .withIndex("by_listId", (q) => q.eq("listId", list._id))
          .collect();

        const creator = await ctx.db.get(list.userId);

        return {
          ...list,
          itemCount: items.length,
          creator: creator
            ? {
                nickname: creator.nickname,
                profileImage: creator.profileImage,
              }
            : null,
        };
      })
    );

    return listsWithDetails;
  },
});

// ==================== Mutations (데이터 변경) ====================

/**
 * 리스트 생성
 */
export const createList = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const user = await getCurrentUser(ctx);

    const listId = await ctx.db.insert("lists", {
      userId: user._id,
      name: args.name,
      description: args.description,
      isPublic: args.isPublic ?? false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return listId;
  },
});

/**
 * 리스트 업데이트
 */
export const updateList = mutation({
  args: {
    listId: v.id("lists"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const user = await getCurrentUser(ctx);
    const list = await ctx.db.get(args.listId);

    if (!list) {
      throw new Error("List not found");
    }

    if (list.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const { listId, ...updates } = args;

    await ctx.db.patch(listId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * 리스트 삭제
 *
 * 리스트와 함께 리스트 항목도 모두 삭제됩니다 (Cascade).
 */
export const deleteList = mutation({
  args: { listId: v.id("lists") },
  handler: async (ctx: MutationCtx, args) => {
    const user = await getCurrentUser(ctx);
    const list = await ctx.db.get(args.listId);

    if (!list) {
      throw new Error("List not found");
    }

    if (list.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // 리스트 항목 삭제
    const items = await ctx.db
      .query("listItems")
      .withIndex("by_listId", (q) => q.eq("listId", args.listId))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    // 리스트 삭제
    await ctx.db.delete(args.listId);

    return { success: true };
  },
});

/**
 * 리스트에 장소 추가
 */
export const addPlaceToList = mutation({
  args: {
    listId: v.id("lists"),
    userPlaceId: v.id("userPlaces"),
  },
  handler: async (ctx: MutationCtx, args) => {
    const user = await getCurrentUser(ctx);
    const list = await ctx.db.get(args.listId);

    if (!list) {
      throw new Error("List not found");
    }

    if (list.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // UserPlace 소유 확인
    const userPlace = await ctx.db.get(args.userPlaceId);
    if (!userPlace) {
      throw new Error("UserPlace not found");
    }

    if (userPlace.userId !== user._id) {
      throw new Error("Unauthorized - UserPlace does not belong to you");
    }

    // 중복 확인
    const existing = await ctx.db
      .query("listItems")
      .withIndex("by_listId", (q) => q.eq("listId", args.listId))
      .collect();

    const alreadyExists = existing.some(
      (item) => item.userPlaceId === args.userPlaceId
    );

    if (alreadyExists) {
      throw new Error("이미 리스트에 추가된 장소입니다");
    }

    // 최대 order 값 찾기
    const maxOrder = existing.reduce((max, item) => Math.max(max, item.order), 0);

    const itemId = await ctx.db.insert("listItems", {
      listId: args.listId,
      userPlaceId: args.userPlaceId,
      order: maxOrder + 1,
      addedAt: Date.now(),
    });

    return itemId;
  },
});

/**
 * 리스트에서 장소 제거
 */
export const removePlaceFromList = mutation({
  args: {
    listItemId: v.id("listItems"),
  },
  handler: async (ctx: MutationCtx, args) => {
    const user = await getCurrentUser(ctx);
    const listItem = await ctx.db.get(args.listItemId);

    if (!listItem) {
      throw new Error("ListItem not found");
    }

    const list = await ctx.db.get(listItem.listId);
    if (!list) {
      throw new Error("List not found");
    }

    if (list.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.listItemId);

    return { success: true };
  },
});

/**
 * 리스트 항목 순서 변경
 *
 * 드래그 앤 드롭으로 순서를 변경할 때 사용합니다.
 */
export const reorderListItems = mutation({
  args: {
    listId: v.id("lists"),
    itemOrders: v.array(
      v.object({
        itemId: v.id("listItems"),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx: MutationCtx, args) => {
    const user = await getCurrentUser(ctx);
    const list = await ctx.db.get(args.listId);

    if (!list) {
      throw new Error("List not found");
    }

    if (list.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // 각 항목의 순서 업데이트
    for (const { itemId, order } of args.itemOrders) {
      await ctx.db.patch(itemId, { order });
    }

    return { success: true };
  },
});

/**
 * 리스트 공개/비공개 토글
 */
export const toggleListVisibility = mutation({
  args: {
    listId: v.id("lists"),
  },
  handler: async (ctx: MutationCtx, args) => {
    const user = await getCurrentUser(ctx);
    const list = await ctx.db.get(args.listId);

    if (!list) {
      throw new Error("List not found");
    }

    if (list.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.listId, {
      isPublic: !list.isPublic,
      updatedAt: Date.now(),
    });

    return { isPublic: !list.isPublic };
  },
});
