/**
 * Convex Database Schema for Travel Planner
 *
 * 기존 Prisma 스키마를 Convex로 마이그레이션한 스키마입니다.
 * Clerk 인증 시스템과 통합되어 있습니다.
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  /**
   * Users 테이블
   *
   * Clerk와 통합된 사용자 정보를 저장합니다.
   * - clerkId: Clerk에서 제공하는 고유 사용자 ID
   * - email: 사용자 이메일 (Clerk에서 동기화)
   * - nickname: 사용자 닉네임
   * - profileImage: 프로필 이미지 URL (Clerk에서 동기화 가능)
   */
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

  /**
   * Places 테이블 (공개 장소)
   *
   * 모든 사용자가 공유하는 기본 장소 정보입니다.
   * Google Places API 호출 최소화를 위한 캐싱 메커니즘으로 사용됩니다.
   *
   * - externalId: Google Place ID (중복 방지)
   * - isPublic: 공개 여부 (기본값: true)
   */
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
    .index("by_category", ["category"])
    .index("by_isPublic", ["isPublic"])
    // 위치 기반 검색을 위한 복합 인덱스
    .index("by_location", ["latitude", "longitude"]),

  /**
   * UserPlaces 테이블 (내 장소)
   *
   * 사용자별 개인화된 장소 정보를 저장합니다.
   * - customName: 사용자가 지정한 커스텀 이름
   * - labels: 장소에 붙인 라벨/태그 배열
   * - visited: 방문 여부
   * - rating: 사용자 평점 (1-5)
   * - photos: 사용자가 업로드한 사진 URL 배열 (Convex Storage)
   */
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
    .index("by_userId_placeId", ["userId", "placeId"])
    .index("by_visited", ["visited"])
    .index("by_userId_visited", ["userId", "visited"]),

  /**
   * Lists 테이블 (여행 리스트)
   *
   * 사용자가 생성한 여행 리스트를 저장합니다.
   * - isPublic: 리스트 공개 여부
   */
  lists: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    iconType: v.string(),
    iconValue: v.string(),
    colorTheme: v.optional(v.string()),
    isPublic: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_isPublic", ["isPublic"])
    .index("by_userId_isPublic", ["userId", "isPublic"]),

  /**
   * ListItems 테이블 (리스트 항목)
   *
   * 리스트에 포함된 장소들을 저장합니다.
   * - order: 리스트 내 순서 (float64로 재정렬 지원)
   */
  listItems: defineTable({
    listId: v.id("lists"),
    userPlaceId: v.id("userPlaces"),
    order: v.float64(),
    addedAt: v.number(),
  })
    .index("by_listId", ["listId"])
    .index("by_listId_order", ["listId", "order"])
    .index("by_userPlaceId", ["userPlaceId"]),

  /**
   * Categories 테이블 (카테고리)
   *
   * 사용자 커스텀 카테고리를 저장합니다.
   * - color: 카테고리 색상 (hex code)
   * - icon: 카테고리 아이콘 (emoji 또는 icon name)
   */
  categories: defineTable({
    userId: v.id("users"),
    name: v.string(),
    color: v.string(),
    icon: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_name", ["userId", "name"]),

  /**
   * Reviews 테이블 (리뷰)
   *
   * 장소에 대한 사용자 리뷰를 저장합니다.
   * - isModerated: 관리자 검토 완료 여부
   * - reviewedBy: 검토한 관리자 ID
   */
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
    .index("by_userId", ["userId"])
    .index("by_isModerated", ["isModerated"])
    .index("by_placeId_isModerated", ["placeId", "isModerated"]),

  /**
   * Reports 테이블 (신고)
   *
   * 부적절한 콘텐츠 신고를 저장합니다.
   * - targetType: 신고 대상 타입 ("review", "place", "user")
   * - targetId: 신고 대상 ID
   * - status: 신고 상태 ("pending", "reviewed", "resolved", "rejected")
   */
  reports: defineTable({
    userId: v.id("users"),
    targetType: v.string(),
    targetId: v.string(),
    reason: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_targetType_targetId", ["targetType", "targetId"]),

  /**
   * Notifications 테이블 (알림)
   *
   * 사용자 알림을 저장합니다.
   * - type: 알림 타입 ("review_approved", "review_rejected", "new_follower", etc.)
   * - link: 알림 클릭 시 이동할 링크
   */
  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    isRead: v.boolean(),
    link: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_isRead", ["userId", "isRead"])
    .index("by_createdAt", ["createdAt"]),

  /**
   * PlaceModerationQueue 테이블 (장소 검토 큐)
   *
   * 사용자가 추가한 장소의 검토 상태를 관리합니다.
   * - status: "pending", "approved", "rejected"
   */
  placeModerationQueue: defineTable({
    placeId: v.id("places"),
    userId: v.id("users"),
    status: v.string(),
    reviewerId: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    reviewNotes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_placeId", ["placeId"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),
});
