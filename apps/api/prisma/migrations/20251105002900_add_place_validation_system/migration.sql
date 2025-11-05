-- CreateIndex: Add spatial index to places table for bounding box queries
CREATE INDEX "places_spatial_index" ON "places"("latitude", "longitude");

-- CreateIndex: Add createdAt index to user_places table for rate limiting
CREATE INDEX "user_places_rate_limit_index" ON "user_places"("created_at");

-- CreateTable: Create PlaceModerationQueue table
CREATE TABLE "place_moderation_queue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "place_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewer_id" TEXT,
    "reviewed_at" DATETIME,
    "review_notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "place_moderation_queue_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "place_moderation_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "place_moderation_queue_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex: Add indexes to PlaceModerationQueue table
CREATE UNIQUE INDEX "place_moderation_queue_place_id_key" ON "place_moderation_queue"("place_id");
CREATE INDEX "place_moderation_queue_status_idx" ON "place_moderation_queue"("status");
CREATE INDEX "place_moderation_queue_created_at_idx" ON "place_moderation_queue"("created_at");
