/**
 * File Upload API - Convex Mutations
 *
 * Convex File Storage를 사용한 파일 업로드 API입니다.
 * 이미지 업로드 및 URL 생성을 제공합니다.
 */

import { mutation, query } from "./_generated/server";
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

/**
 * 업로드 URL 생성
 *
 * 클라이언트에서 파일을 업로드할 수 있는 임시 URL을 생성합니다.
 * 이 URL은 제한된 시간 동안만 유효합니다.
 *
 * 사용 방법:
 * 1. generateUploadUrl() 호출하여 URL 받기
 * 2. 클라이언트에서 해당 URL로 파일 업로드
 * 3. 업로드 완료 후 storageId 받기
 * 4. savePhotoToPlace() 또는 savePhotoToReview()로 DB에 저장
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    // 인증 확인
    await getCurrentUser(ctx);

    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * 파일 URL 조회
 *
 * Storage ID로 파일의 공개 URL을 조회합니다.
 */
export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx: QueryCtx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    return url;
  },
});

/**
 * 내 장소에 사진 추가
 *
 * 업로드된 파일을 UserPlace의 photos 배열에 추가합니다.
 */
export const savePhotoToPlace = mutation({
  args: {
    userPlaceId: v.id("userPlaces"),
    storageId: v.id("_storage"),
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

    // 파일 URL 생성
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new Error("Failed to get file URL");
    }

    // photos 배열에 URL 추가
    await ctx.db.patch(args.userPlaceId, {
      photos: [...userPlace.photos, url],
      updatedAt: Date.now(),
    });

    return { success: true, url };
  },
});

/**
 * 내 장소에서 사진 삭제
 *
 * UserPlace의 photos 배열에서 사진을 제거합니다.
 * 실제 파일은 삭제하지 않습니다 (다른 곳에서 사용 중일 수 있음).
 */
export const removePhotoFromPlace = mutation({
  args: {
    userPlaceId: v.id("userPlaces"),
    photoUrl: v.string(),
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

    // photos 배열에서 URL 제거
    await ctx.db.patch(args.userPlaceId, {
      photos: userPlace.photos.filter((url) => url !== args.photoUrl),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * 리뷰에 사진 추가
 *
 * 업로드된 파일을 Review의 photos 배열에 추가합니다.
 */
export const savePhotoToReview = mutation({
  args: {
    reviewId: v.id("reviews"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx: MutationCtx, args) => {
    const user = await getCurrentUser(ctx);
    const review = await ctx.db.get(args.reviewId);

    if (!review) {
      throw new Error("Review not found");
    }

    if (review.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // 파일 URL 생성
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new Error("Failed to get file URL");
    }

    // photos 배열에 URL 추가
    await ctx.db.patch(args.reviewId, {
      photos: [...review.photos, url],
      updatedAt: Date.now(),
    });

    return { success: true, url };
  },
});

/**
 * 프로필 이미지 업데이트
 *
 * 사용자 프로필 이미지를 업데이트합니다.
 */
export const updateProfileImage = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx: MutationCtx, args) => {
    const user = await getCurrentUser(ctx);

    // 파일 URL 생성
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new Error("Failed to get file URL");
    }

    // 사용자 프로필 이미지 업데이트
    await ctx.db.patch(user._id, {
      profileImage: url,
    });

    return { success: true, url };
  },
});

/**
 * 파일 메타데이터 조회
 *
 * Storage ID로 파일의 메타데이터를 조회합니다.
 * (파일 크기, 타입, 업로드 시간 등)
 */
export const getFileMetadata = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx: QueryCtx, args) => {
    // Convex Storage는 기본적으로 메타데이터를 제공하지 않습니다.
    // URL만 조회 가능합니다.
    const url = await ctx.storage.getUrl(args.storageId);
    return {
      url,
      storageId: args.storageId,
    };
  },
});
