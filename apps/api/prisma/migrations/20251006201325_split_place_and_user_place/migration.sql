-- Step 1: Create user_places table
CREATE TABLE "user_places" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "place_id" UUID NOT NULL,
    "custom_category" VARCHAR(50),
    "labels" TEXT[] NOT NULL DEFAULT '{}',
    "visited" BOOLEAN NOT NULL DEFAULT false,
    "visited_at" TIMESTAMP(3),
    "visit_note" TEXT,
    "rating" SMALLINT,
    "estimated_cost" INTEGER,
    "photos" TEXT[] NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_places_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create temporary backup of places table for data migration
CREATE TEMP TABLE places_backup AS SELECT * FROM places;

-- Step 3: Insert data into user_places from old places table
INSERT INTO user_places (
    id,
    user_id,
    place_id,
    custom_category,
    labels,
    visited,
    visited_at,
    visit_note,
    rating,
    estimated_cost,
    photos,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid() as id,
    user_id,
    id as place_id,
    custom_category,
    COALESCE(labels, '{}') as labels,
    COALESCE(visited, false) as visited,
    visited_at,
    visit_note,
    rating,
    estimated_cost,
    COALESCE(photos, '{}') as photos,
    created_at,
    updated_at
FROM places_backup;

-- Step 4: Create temporary mapping table for place_lists migration
CREATE TEMP TABLE user_place_mapping AS
SELECT
    pb.id as old_place_id,
    pb.user_id,
    up.id as user_place_id
FROM places_backup pb
JOIN user_places up ON pb.id = up.place_id AND pb.user_id = up.user_id;

-- Step 5: Add user_place_id column to place_lists
ALTER TABLE "place_lists" ADD COLUMN "user_place_id" UUID;

-- Step 6: Populate user_place_id in place_lists
UPDATE place_lists pl
SET user_place_id = upm.user_place_id
FROM user_place_mapping upm
WHERE pl.place_id = upm.old_place_id;

-- Step 7: Drop old constraints and indexes from place_lists
DROP INDEX IF EXISTS "place_lists_place_id_list_id_key";
DROP INDEX IF EXISTS "place_lists_place_id_idx";

-- Step 8: Drop place_id column from place_lists
ALTER TABLE "place_lists" DROP COLUMN "place_id";

-- Step 9: Make user_place_id NOT NULL
ALTER TABLE "place_lists" ALTER COLUMN "user_place_id" SET NOT NULL;

-- Step 10: Drop old constraints and indexes from places
DROP INDEX IF EXISTS "places_user_id_idx";
DROP INDEX IF EXISTS "places_visited_idx";

-- Step 11: Remove personalized columns from places table
ALTER TABLE "places" DROP COLUMN "user_id";
ALTER TABLE "places" DROP COLUMN "custom_category";
ALTER TABLE "places" DROP COLUMN "labels";
ALTER TABLE "places" DROP COLUMN "visited";
ALTER TABLE "places" DROP COLUMN "visited_at";
ALTER TABLE "places" DROP COLUMN "visit_note";
ALTER TABLE "places" DROP COLUMN "rating";
ALTER TABLE "places" DROP COLUMN "estimated_cost";
ALTER TABLE "places" DROP COLUMN "photos";

-- Step 12: Add unique constraint to external_id
CREATE UNIQUE INDEX "places_external_id_key" ON "places"("external_id") WHERE "external_id" IS NOT NULL;

-- Step 13: Create indexes for external_id
CREATE INDEX "places_external_id_idx" ON "places"("external_id");

-- Step 14: Create indexes for user_places
CREATE UNIQUE INDEX "user_places_user_id_place_id_key" ON "user_places"("user_id", "place_id");
CREATE INDEX "user_places_user_id_idx" ON "user_places"("user_id");
CREATE INDEX "user_places_place_id_idx" ON "user_places"("place_id");
CREATE INDEX "user_places_visited_idx" ON "user_places"("visited");

-- Step 15: Create unique constraint for place_lists
CREATE UNIQUE INDEX "place_lists_user_place_id_list_id_key" ON "place_lists"("user_place_id", "list_id");
CREATE INDEX "place_lists_user_place_id_idx" ON "place_lists"("user_place_id");

-- Step 16: Add foreign key constraints
ALTER TABLE "user_places" ADD CONSTRAINT "user_places_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_places" ADD CONSTRAINT "user_places_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "place_lists" ADD CONSTRAINT "place_lists_user_place_id_fkey" FOREIGN KEY ("user_place_id") REFERENCES "user_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
