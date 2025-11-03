-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_place_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "rating" INTEGER,
    "photos" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "report_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "reviews_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reviews_user_place_id_fkey" FOREIGN KEY ("user_place_id") REFERENCES "user_places" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_reviews" ("content", "created_at", "id", "is_public", "like_count", "photos", "place_id", "rating", "report_count", "updated_at", "user_id", "user_place_id") SELECT "content", "created_at", "id", "is_public", "like_count", "photos", "place_id", "rating", "report_count", "updated_at", "user_id", "user_place_id" FROM "reviews";
DROP TABLE "reviews";
ALTER TABLE "new_reviews" RENAME TO "reviews";
CREATE INDEX "reviews_place_id_is_public_idx" ON "reviews"("place_id", "is_public");
CREATE INDEX "reviews_user_id_idx" ON "reviews"("user_id");
CREATE INDEX "reviews_user_place_id_idx" ON "reviews"("user_place_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
