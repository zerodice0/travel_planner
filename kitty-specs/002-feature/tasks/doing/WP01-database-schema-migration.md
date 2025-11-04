---
work_package_id: "WP01"
subtasks:
  - "T001"
  - "T002"
  - "T003"
  - "T004"
  - "T005"
  - "T006"
title: "Database Schema & Migration"
phase: "Phase 0 - Foundational Infrastructure"
lane: "doing"
assignee: "Claude Code"
agent: "claude"
shell_pid: "49661"
history:
  - timestamp: "2025-11-04T09:30:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-11-05T08:45:00Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "49661"
    action: "Started WP01: Database Schema & Migration implementation"
---

# Work Package Prompt: WP01 – Database Schema & Migration

## Objectives & Success Criteria

- ✅ Place.externalId is optional (allows NULL values)
- ✅ Place table has spatial composite index on (latitude, longitude)
- ✅ UserPlace table has index on createdAt for rate limiting queries
- ✅ PlaceModerationQueue table created with all required fields and relations
- ✅ User table has moderation relations (creator, reviewer)
- ✅ Prisma migration generates and applies successfully
- ✅ Prisma client regenerates with updated types
- ✅ Database schema matches specifications in data-model.md

## Context & Constraints

**Design Documents**:
- [data-model.md](../data-model.md) - Complete entity definitions and relationships
- [plan.md](../plan.md) - Technical architecture and database strategy
- [research.md](../research.md) - D1-optimized duplicate detection strategy

**Database Platform**: Cloudflare D1 (SQLite-based)
**ORM**: Prisma
**Migration Strategy**: Prisma migrate (dev + deploy)

**Constraints**:
- D1 is SQLite-based: no PostGIS, no native spatial functions
- Spatial indexing limited to composite indexes (no GiST/GIN)
- Must support both user-generated places (externalId = null) and Google Places (externalId = Google Place ID)

## Subtasks & Detailed Guidance

### Subtask T001 – Modify Place model: make externalId optional, add spatial index

**Purpose**: Enable user-generated places without external API dependency while maintaining backward compatibility with Google Places integration.

**Steps**:
1. Open `apps/backend/prisma/schema.prisma`
2. Locate the `Place` model
3. Change `externalId String @unique` to `externalId String? @unique`
   - The `?` makes it optional (nullable)
   - Keep `@unique` to prevent duplicate Google Place IDs
4. Add spatial index after the `@@index([externalId])` line:
   ```prisma
   @@index([latitude, longitude], name: "spatial_index")
   ```
5. Add relation for moderation queue:
   ```prisma
   moderationQueue PlaceModerationQueue?
   ```

**Files**: `apps/backend/prisma/schema.prisma`

**Parallel?**: No (single schema file, must be done sequentially with other schema changes)

**Notes**:
- Composite index on (latitude, longitude) enables fast bounding box queries
- Bounding box query pattern: `WHERE latitude BETWEEN X AND Y AND longitude BETWEEN A AND B`
- This approach is D1-optimized (no PostGIS required)

**Example**:
```prisma
model Place {
  id          String   @id @default(cuid())
  externalId  String?  @unique  // ← Changed from required to optional
  name        String
  address     String
  latitude    Float
  longitude   Float
  category    String?
  description String?
  phoneNumber String?
  website     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  userPlaces      UserPlace[]
  moderationQueue PlaceModerationQueue?  // ← New relation

  @@index([latitude, longitude], name: "spatial_index")  // ← New index
  @@index([externalId])
}
```

---

### Subtask T002 – Modify UserPlace model: add createdAt index for rate limiting

**Purpose**: Enable fast daily creation count queries for rate limiting (5/day for new users, 10/day for verified).

**Steps**:
1. In `apps/backend/prisma/schema.prisma`, locate the `UserPlace` model
2. Add index after existing indexes:
   ```prisma
   @@index([createdAt], name: "rate_limit_index")
   ```
3. This enables fast queries like: `SELECT COUNT(*) FROM UserPlace WHERE userId = ? AND createdAt >= ?`

**Files**: `apps/backend/prisma/schema.prisma`

**Parallel?**: No (same file as T001, must be sequential)

**Notes**:
- Index on createdAt enables O(log n) count queries instead of full table scans
- Rate limiting query: count places created by user since midnight UTC
- Query pattern in RateLimitGuard: `prisma.userPlace.count({ where: { userId, createdAt: { gte: today } } })`

**Example**:
```prisma
model UserPlace {
  // ... existing fields ...

  @@unique([userId, placeId])
  @@index([userId])
  @@index([createdAt], name: "rate_limit_index")  // ← New index
}
```

---

### Subtask T003 – Create PlaceModerationQueue model with status, reviewer relations

**Purpose**: Track all user-generated places requiring admin review; maintain audit trail of approvals/rejections.

**Steps**:
1. In `apps/backend/prisma/schema.prisma`, add new model after `UserPlace`:
   ```prisma
   model PlaceModerationQueue {
     id          String   @id @default(cuid())
     placeId     String   @unique
     userId      String
     status      String   @default("pending")
     reviewerId  String?
     reviewedAt  DateTime?
     reviewNotes String?
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt

     place    Place @relation(fields: [placeId], references: [id], onDelete: Cascade)
     user     User  @relation(fields: [userId], references: [id], onDelete: Cascade, name: "creator")
     reviewer User? @relation(fields: [reviewerId], references: [id], onDelete: SetNull, name: "reviewer")

     @@index([status])
     @@index([createdAt])
   }
   ```

**Files**: `apps/backend/prisma/schema.prisma`

**Parallel?**: No (same file, must be sequential)

**Notes**:
- `placeId` is unique: each place can only have one queue entry
- `status` enum: "pending", "approved", "rejected" (enforced at application level, not database)
- `userId`: Creator of the place
- `reviewerId`: Admin who reviewed (nullable for pending places)
- `reviewNotes`: Required when rejecting, optional when approving
- Relations use `name` parameter to distinguish creator vs reviewer User relations
- `onDelete: Cascade`: Delete queue entry when place is deleted
- `onDelete: SetNull`: Keep queue entry if reviewer user is deleted

**Business Rules**:
- All user-generated places (externalId = null) automatically enter queue with status "pending"
- Places remain visible to users even in "pending" status
- Only admins can approve/reject
- Approved/rejected places stay in queue for audit trail

---

### Subtask T004 – Update User model: add moderation relations (creator, reviewer)

**Purpose**: Enable bidirectional relations between User and PlaceModerationQueue.

**Steps**:
1. In `apps/backend/prisma/schema.prisma`, locate the `User` model
2. Add these relations:
   ```prisma
   createdPlaces   PlaceModerationQueue[] @relation("creator")
   reviewedPlaces  PlaceModerationQueue[] @relation("reviewer")
   ```

**Files**: `apps/backend/prisma/schema.prisma`

**Parallel?**: No (same file, must be sequential)

**Notes**:
- `@relation("creator")` matches the `name: "creator"` in PlaceModerationQueue.user relation
- `@relation("reviewer")` matches the `name: "reviewer"` in PlaceModerationQueue.reviewer relation
- Enables queries like: "Get all places created by this user" or "Get all places reviewed by this admin"

**Example**:
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  isAdmin   Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  userPlaces      UserPlace[]
  createdPlaces   PlaceModerationQueue[] @relation("creator")   // ← New
  reviewedPlaces  PlaceModerationQueue[] @relation("reviewer")  // ← New
}
```

---

### Subtask T005 – Generate Prisma migration with all schema changes

**Purpose**: Create migration SQL that applies all schema changes atomically.

**Steps**:
1. Ensure all T001-T004 changes are saved in `schema.prisma`
2. Run from `apps/backend/` directory:
   ```bash
   npx prisma migrate dev --name add_place_validation_system
   ```
3. Prisma will:
   - Detect schema changes
   - Generate SQL migration file
   - Apply migration to local database
   - Regenerate Prisma client
4. Review generated migration file in `apps/backend/prisma/migrations/[timestamp]_add_place_validation_system/migration.sql`

**Files**:
- Input: `apps/backend/prisma/schema.prisma`
- Output: `apps/backend/prisma/migrations/[timestamp]_add_place_validation_system/migration.sql`

**Parallel?**: No (depends on T001-T004 completion)

**Notes**:
- Migration name: `add_place_validation_system` (descriptive, lowercase with underscores)
- Prisma will prompt to apply migration - select "Yes"
- Generated SQL will include: ALTER TABLE, CREATE TABLE, CREATE INDEX statements
- Prisma client auto-regenerates with new types (Place, UserPlace, PlaceModerationQueue)

**Expected Migration Contents**:
```sql
-- AlterTable Place: make externalId optional
ALTER TABLE Place ALTER COLUMN externalId DROP NOT NULL;

-- CreateIndex Place: spatial index
CREATE INDEX place_spatial_index ON Place(latitude, longitude);

-- CreateIndex UserPlace: rate limit index
CREATE INDEX userplace_rate_limit_index ON UserPlace(createdAt);

-- CreateTable PlaceModerationQueue
CREATE TABLE PlaceModerationQueue (
  id TEXT PRIMARY KEY,
  placeId TEXT UNIQUE NOT NULL,
  userId TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  reviewerId TEXT,
  reviewedAt DATETIME,
  reviewNotes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (placeId) REFERENCES Place(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewerId) REFERENCES User(id) ON DELETE SET NULL
);

CREATE INDEX moderation_status_index ON PlaceModerationQueue(status);
CREATE INDEX moderation_created_index ON PlaceModerationQueue(createdAt);
```

---

### Subtask T006 – Validate migration applies cleanly to D1 database

**Purpose**: Ensure migration is D1-compatible and applies without errors.

**Steps**:
1. Check migration status:
   ```bash
   npx prisma migrate status
   ```
   Expected output: "Database schema is up to date!"

2. Verify Prisma client regenerated:
   ```bash
   ls -la node_modules/.prisma/client/
   ```
   Should see recently modified files

3. Test rollback capability:
   ```bash
   npx prisma migrate reset
   ```
   Then re-apply:
   ```bash
   npx prisma migrate deploy
   ```

4. Verify database schema matches expectations:
   ```bash
   npx prisma db pull
   ```
   Should report no changes (schema matches database)

5. For production D1 deployment (when ready):
   ```bash
   wrangler d1 migrations apply <database-name>
   ```

**Files**: Database (D1)

**Parallel?**: No (depends on T005 completion)

**Notes**:
- `migrate reset`: Drops database, re-applies all migrations (use with caution)
- `migrate deploy`: Production migration command (no prompts, CI-safe)
- `db pull`: Introspects database, updates schema.prisma (should be no-op after successful migration)
- D1 migrations via wrangler: Required for Cloudflare Workers production deployment

**Validation Checklist**:
- [ ] Place.externalId accepts NULL values
- [ ] Place table has index on (latitude, longitude)
- [ ] UserPlace table has index on createdAt
- [ ] PlaceModerationQueue table exists with all fields
- [ ] Foreign key constraints are enforced
- [ ] Indexes are created correctly
- [ ] Prisma client types include new/updated models
- [ ] No TypeScript compilation errors in project

---

## Risks & Mitigations

**Risk 1: D1 Migration Fails in Production**
- **Symptoms**: wrangler command fails, database schema mismatch
- **Mitigation**: Test migrations locally first; have rollback plan; use `prisma migrate status` to verify
- **Rollback**: `npx prisma migrate reset` (development) or manual SQL rollback (production)

**Risk 2: Index Performance Degradation**
- **Symptoms**: Slow duplicate detection queries, slow rate limit checks
- **Mitigation**: Monitor query performance; validate bounding box queries return <100 candidates
- **Threshold**: If Place table exceeds 100,000 rows, consider advanced spatial indexing strategies

**Risk 3: Foreign Key Constraint Violations**
- **Symptoms**: Cannot delete Place/User with related records
- **Mitigation**: Cascade deletes configured correctly; test deletion workflows
- **Validation**: Delete test place, verify UserPlace and PlaceModerationQueue entries also deleted

## Definition of Done Checklist

- [ ] All T001-T006 subtasks completed
- [ ] `schema.prisma` includes all changes (Place optional externalId, indexes, PlaceModerationQueue model, User relations)
- [ ] Migration generated and applied: `add_place_validation_system` migration exists
- [ ] Prisma client regenerated: `@prisma/client` includes updated types
- [ ] Database schema validated: `prisma db pull` reports no changes
- [ ] TypeScript compilation passes: `pnpm typecheck` in `apps/backend`
- [ ] Migration can be rolled back and re-applied successfully
- [ ] Documentation updated: data-model.md matches implemented schema (already accurate)

## Review Guidance

**Key Acceptance Checkpoints**:
1. **Schema File Review**: Verify `schema.prisma` changes match data-model.md specifications
2. **Migration SQL Review**: Check generated SQL for correctness (ALTER TABLE, CREATE TABLE, CREATE INDEX)
3. **Index Strategy**: Confirm spatial_index and rate_limit_index are created
4. **Relation Integrity**: Verify Foreign Key constraints and cascade/set-null behaviors
5. **Type Safety**: Ensure Prisma client types reflect optional externalId and new models

**Testing Commands**:
```bash
# Verify migration applied
npx prisma migrate status

# Check Prisma client types
npx prisma generate

# Validate schema matches database
npx prisma db pull

# Run TypeScript check
pnpm typecheck
```

**Questions for Reviewer**:
- Do all indexes align with query patterns (bounding box, rate limiting)?
- Are foreign key cascade behaviors correct for business rules?
- Is the schema change backward compatible with existing data?

## Activity Log

- 2025-11-04T09:30:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
