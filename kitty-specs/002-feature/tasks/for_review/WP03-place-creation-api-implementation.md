---
work_package_id: "WP03"
subtasks:
  - "T013"
  - "T014"
  - "T015"
  - "T016"
  - "T017"
  - "T018"
  - "T019"
title: "Place Creation API Implementation"
phase: "Phase 1 - Core Features"
lane: "for_review"
assignee: "Claude Code"
agent: "claude"
shell_pid: "49661"
history:
  - timestamp: "2025-11-04T09:30:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-11-05T10:05:00Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "49661"
    action: "Started WP03: Place Creation API Implementation"
  - timestamp: "2025-11-05T10:30:00Z"
    lane: "for_review"
    agent: "claude"
    shell_pid: "49661"
    action: "Completed WP03: All API endpoints implemented with full validation stack and error handling"
---

# Work Package Prompt: WP03 – Place Creation API Implementation

## Objectives & Success Criteria

- ✅ CreatePlaceDto accepts externalId as optional field
- ✅ PlacesController integrates RateLimitGuard and ProfanityFilterPipe
- ✅ POST /places endpoint creates Place + UserPlace + ModerationQueue entry
- ✅ POST /places/validate-duplicate endpoint returns duplicate candidates
- ✅ GET /places/rate-limit-status endpoint returns user's quota status
- ✅ All API responses match OpenAPI spec in contracts/places-api.yaml
- ✅ Comprehensive error handling with user-friendly messages
- ✅ Transaction safety: partial failures roll back correctly

## Context & Constraints

**Design Documents**:
- [contracts/places-api.yaml](../contracts/places-api.yaml) - Complete API specification
- [plan.md](../plan.md) - 5-layer validation flow and place creation sequence
- [quickstart.md](../quickstart.md) - Testing examples and curl commands

**API Endpoints**:
1. POST /places - Create place with full validation
2. POST /places/validate-duplicate - Pre-check for duplicates
3. GET /places/rate-limit-status - Get user's current quota

**Validation Flow**:
```
Request → DTO Validation → RateLimitGuard → ProfanityFilterPipe → Controller → Service (duplicate check) → Database (Place + UserPlace + Queue)
```

**Response Standards**:
- Success: 201 Created with place data + moderationStatus
- Validation Error: 400 Bad Request
- Duplicate: 409 Conflict with duplicate list
- Rate Limit: 429 Too Many Requests with quota info
- Unauthorized: 401 (if auth fails)

## Subtasks & Detailed Guidance

### Subtask T013 – Update CreatePlaceDto: make externalId optional

**Purpose**: Support both user-generated places (no externalId) and Google Places integration (with externalId).

**Steps**:
1. Open `apps/backend/src/places/dto/create-place.dto.ts`
2. Make externalId optional:
   ```typescript
   import { IsString, IsOptional, MinLength, MaxLength, IsNumber, IsUrl, Min, Max } from 'class-validator';

   export class CreatePlaceDto {
     @IsOptional()
     @IsString()
     externalId?: string;  // ← Optional for user-generated places

     @IsString()
     @MinLength(2)
     @MaxLength(100)
     name: string;

     @IsString()
     @MinLength(5)
     @MaxLength(200)
     address: string;

     @IsNumber()
     @Min(-90)
     @Max(90)
     latitude: number;

     @IsNumber()
     @Min(-180)
     @Max(180)
     longitude: number;

     @IsOptional()
     @IsString()
     @MaxLength(50)
     category?: string;

     @IsOptional()
     @IsString()
     @MaxLength(1000)
     description?: string;

     @IsOptional()
     @IsString()
     @MaxLength(20)
     phoneNumber?: string;

     @IsOptional()
     @IsUrl()
     @MaxLength(200)
     website?: string;
   }
   ```

**Files**: `apps/backend/src/places/dto/create-place.dto.ts`

**Parallel?**: Yes

**Notes**:
- `@IsOptional()` allows field to be undefined or null
- Keep validation rules on optional fields (validate if provided)
- Matches OpenAPI CreatePlaceRequest schema in contracts/places-api.yaml

---

### Subtask T014 – Modify PlacesController: add validation decorators

**Purpose**: Integrate RateLimitGuard and ProfanityFilterPipe into controller.

**Steps**:
1. Open `apps/backend/src/places/places.controller.ts`
2. Import dependencies:
   ```typescript
   import { Controller, Post, Body, UseGuards, UsePipes, Get, Request } from '@nestjs/common';
   import { RateLimitGuard } from '../common/guards/rate-limit.guard';
   import { ProfanityFilterPipe } from '../common/pipes/profanity-filter.pipe';
   ```
3. Apply decorators to create endpoint:
   ```typescript
   @Post()
   @UseGuards(RateLimitGuard)
   @UsePipes(ProfanityFilterPipe)
   async create(@Request() req, @Body() createPlaceDto: CreatePlaceDto) {
     return this.placesService.create(req.user.id, createPlaceDto);
   }
   ```

**Files**: `apps/backend/src/places/places.controller.ts`

**Parallel?**: Yes

**Notes**:
- `@UseGuards(RateLimitGuard)`: Executes before controller method
- `@UsePipes(ProfanityFilterPipe)`: Executes after guards, before method
- `@Body()`: Automatically applies DTO validation (class-validator)
- Execution order: Guards → Pipes → Controller method

---

### Subtask T015 – Implement PlacesService.create(): full validation and creation flow

**Purpose**: Orchestrate Place, UserPlace, and ModerationQueue creation with duplicate checking.

**Steps**:
1. Open `apps/backend/src/places/places.service.ts`
2. Implement create method:
   ```typescript
   async create(userId: string, createPlaceDto: CreatePlaceDto) {
     // 1. Check for duplicates
     const duplicates = await this.detectDuplicates(
       createPlaceDto.name,
       createPlaceDto.latitude,
       createPlaceDto.longitude,
     );

     if (duplicates.length > 0) {
       throw new ConflictException({
         message: 'Duplicate place detected',
         duplicates: duplicates.map(p => ({
           id: p.id,
           name: p.name,
           address: p.address,
           distance: p.distance,
           similarity: p.similarity,
         })),
       });
     }

     // 2. Create Place (transaction for atomic operation)
     const result = await this.prisma.$transaction(async (tx) => {
       const place = await tx.place.create({
         data: {
           name: createPlaceDto.name,
           address: createPlaceDto.address,
           latitude: createPlaceDto.latitude,
           longitude: createPlaceDto.longitude,
           category: createPlaceDto.category,
           description: createPlaceDto.description,
           phoneNumber: createPlaceDto.phoneNumber,
           website: createPlaceDto.website,
           externalId: createPlaceDto.externalId,  // null for user-generated
         },
       });

       // 3. Create UserPlace
       const userPlace = await tx.userPlace.create({
         data: {
           userId,
           placeId: place.id,
         },
         include: {
           place: true,
         },
       });

       // 4. Add to moderation queue
       await tx.placeModerationQueue.create({
         data: {
           placeId: place.id,
           userId,
           status: 'pending',
         },
       });

       return userPlace;
     });

     return {
       ...result,
       moderationStatus: 'pending',
     };
   }
   ```

**Files**: `apps/backend/src/places/places.service.ts`

**Parallel?**: No (core logic, depends on T013-T014)

**Notes**:
- Use Prisma `$transaction` for atomic operations (all or nothing)
- If duplicate found, throw ConflictException with detailed duplicate info
- Return UserPlace with moderationStatus field for frontend display
- Transaction ensures partial failures don't leave orphaned records

---

### Subtask T016 – Add POST /places endpoint with full validation stack

**Purpose**: Main place creation endpoint with complete validation chain.

**Steps**:
1. In `apps/backend/src/places/places.controller.ts`, ensure POST /places endpoint exists (from T014)
2. Add proper error handling:
   ```typescript
   @Post()
   @UseGuards(RateLimitGuard)
   @UsePipes(ProfanityFilterPipe)
   async create(@Request() req, @Body() createPlaceDto: CreatePlaceDto) {
     try {
       return await this.placesService.create(req.user.id, createPlaceDto);
     } catch (error) {
       if (error instanceof ConflictException) {
         throw error;  // Re-throw 409 Conflict
       }
       throw new InternalServerErrorException('Failed to create place');
     }
   }
   ```

**Files**: `apps/backend/src/places/places.controller.ts`

**Parallel?**: Yes (can work on endpoints simultaneously)

**Notes**:
- Returns 201 Created on success (NestJS default for POST)
- Returns 400 Bad Request for validation errors (DTO validation)
- Returns 409 Conflict for duplicates (thrown by service)
- Returns 429 Too Many Requests (thrown by RateLimitGuard)
- Error responses match OpenAPI spec

---

### Subtask T017 – Add POST /places/validate-duplicate endpoint

**Purpose**: Frontend pre-check for duplicates before submitting full form.

**Steps**:
1. In `apps/backend/src/places/places.controller.ts`, add endpoint:
   ```typescript
   @Post('validate-duplicate')
   async validateDuplicate(@Body() dto: { name: string; latitude: number; longitude: number }) {
     const duplicates = await this.placesService['detectDuplicates'](dto.name, dto.latitude, dto.longitude);
     return {
       hasDuplicates: duplicates.length > 0,
       duplicates,
     };
   }
   ```

**Files**: `apps/backend/src/places/places.controller.ts`

**Parallel?**: Yes

**Notes**:
- No authentication required (public endpoint for UX improvement)
- Returns duplicate candidates with distance/similarity scores
- Frontend uses this to show warning dialog before final submission

---

### Subtask T018 – Add GET /places/rate-limit-status endpoint

**Purpose**: Provide user feedback on remaining quota.

**Steps**:
1. In `apps/backend/src/places/places.controller.ts`, add endpoint:
   ```typescript
   @Get('rate-limit-status')
   async getRateLimitStatus(@Request() req) {
     const today = new Date();
     today.setUTCHours(0, 0, 0, 0);

     const count = await this.prisma.userPlace.count({
       where: {
         userId: req.user.id,
         createdAt: { gte: today },
       },
     });

     const user = await this.prisma.user.findUnique({ where: { id: req.user.id } });
     const limit = user?.isVerified ? 10 : 5;

     return {
       limit,
       used: count,
       remaining: Math.max(0, limit - count),
       resetsAt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
     };
   }
   ```

**Files**: `apps/backend/src/places/places.controller.ts`

**Parallel?**: Yes

**Notes**:
- Requires authentication (uses req.user.id)
- Returns current quota status for UI display
- Frontend can show "X/5 places added today" message

---

### Subtask T019 – Add comprehensive error handling and user-friendly messages

**Purpose**: Ensure all error cases provide clear, actionable feedback to users.

**Steps**:
1. Review all error paths in PlacesController and PlacesService
2. Ensure error messages follow patterns:
   - 400: "Field X is invalid because Y"
   - 409: "Duplicate place detected" + list of similar places
   - 429: "Daily limit exceeded (X/Y used)" + reset time
3. Add global exception filter if needed (optional for Phase 1)

**Files**: `apps/backend/src/places/places.controller.ts`, `apps/backend/src/places/places.service.ts`

**Parallel?**: No (depends on T016-T018)

**Notes**:
- Never expose stack traces to users
- Error format matches OpenAPI spec error schemas
- Include actionable information (e.g., reset time for rate limits)

---

## Risks & Mitigations

**Risk 1: Transaction Failures Leave Inconsistent State**
- **Impact**: Place created but UserPlace or Queue entry missing
- **Mitigation**: Prisma `$transaction` ensures atomicity; all or nothing
- **Recovery**: Monitor transaction rollbacks; retry on transient failures

**Risk 2: Duplicate Detection Race Condition**
- **Impact**: Two users create same place simultaneously, both pass duplicate check
- **Mitigation**: Acceptable for Phase 1; database unique constraint on (name, lat, lng) in Phase 2
- **Frequency**: Rare (requires millisecond-level concurrency for same place)

**Risk 3: API Response Doesn't Match OpenAPI Spec**
- **Impact**: Frontend fails to parse responses
- **Mitigation**: Validate responses against OpenAPI schema; manual testing
- **Detection**: TypeScript types + integration tests

## Definition of Done Checklist

- [ ] All T013-T019 subtasks completed
- [ ] CreatePlaceDto supports optional externalId
- [ ] PlacesController integrates Guard + Pipe decorators
- [ ] PlacesService.create() implements full flow (duplicate check + atomic creation)
- [ ] All three endpoints implemented: POST /places, POST /places/validate-duplicate, GET /places/rate-limit-status
- [ ] Error handling comprehensive and user-friendly
- [ ] API responses match OpenAPI spec
- [ ] TypeScript compilation passes: `pnpm typecheck`
- [ ] Lint passes: `pnpm lint --max-warnings 0`
- [ ] Manual testing: Create place, duplicate detection works, rate limit enforced

## Review Guidance

**Key Acceptance Checkpoints**:
1. **Validation Flow**: Verify Guard → Pipe → Controller → Service order
2. **Transaction Safety**: Check atomic Place + UserPlace + Queue creation
3. **Error Handling**: Ensure all error responses are user-friendly
4. **API Compliance**: Validate responses match OpenAPI spec

**Testing Commands**:
```bash
# Create place (success)
curl -X POST http://localhost:4000/api/places \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Restaurant",
    "address": "123 Test St",
    "latitude": 37.5665,
    "longitude": 126.9780,
    "category": "restaurant"
  }'

# Validate duplicate (should find if above succeeds)
curl -X POST http://localhost:4000/api/places/validate-duplicate \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Restaurant","latitude":37.5665,"longitude":126.9780}'

# Check rate limit status
curl -X GET http://localhost:4000/api/places/rate-limit-status \
  -H "Authorization: Bearer <token>"

# Test rate limit (create 6 places, 6th should fail with 429)
for i in {1..6}; do
  curl -X POST http://localhost:4000/api/places \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Test Place $i\",\"address\":\"$i Test St\",\"latitude\":37.5,\"longitude\":127.0}"
done
```

**Questions for Reviewer**:
- Does transaction cover all database operations atomically?
- Are error messages clear and actionable for end users?
- Do API responses match OpenAPI spec exactly?

## Activity Log

- 2025-11-04T09:30:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
