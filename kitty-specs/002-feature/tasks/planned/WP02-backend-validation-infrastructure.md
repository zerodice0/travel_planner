---
work_package_id: "WP02"
subtasks:
  - "T007"
  - "T008"
  - "T009"
  - "T010"
  - "T011"
  - "T012"
title: "Backend Validation Infrastructure"
phase: "Phase 0 - Foundational Infrastructure"
lane: "planned"
assignee: ""
agent: ""
shell_pid: ""
history:
  - timestamp: "2025-11-04T09:30:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
---

# Work Package Prompt: WP02 – Backend Validation Infrastructure

## Objectives & Success Criteria

- ✅ Dependencies installed: `geolib@3.3.4`, `fastest-levenshtein@1.0.16`
- ✅ ProfanityFilterPipe created and filters inappropriate content
- ✅ RateLimitGuard created and enforces daily creation limits (5/10 per user)
- ✅ Duplicate detection implemented: bounding box + Haversine (≤100m) + Levenshtein (≥80%)
- ✅ PlacesService has `detectDuplicates()` method returning candidate places with distance/similarity scores
- ✅ Utility functions for distance and similarity calculations work correctly
- ✅ All validation layers integrate seamlessly with NestJS request pipeline

## Context & Constraints

**Design Documents**:
- [research.md](../research.md) - Validation architecture decisions (Guard/Pipe/Service hybrid)
- [data-model.md](../data-model.md) - Database schema for rate limiting queries
- [plan.md](../plan.md) - 5-layer validation system architecture

**Validation Architecture**:
1. DTO Validation (existing: class-validator)
2. Rate Limiting (new: RateLimitGuard)
3. Profanity Filter (new: ProfanityFilterPipe)
4. Duplicate Detection (new: PlacesService method)
5. Moderation Queue (implemented in WP03)

**Dependencies**:
- `geolib`: Haversine distance calculation
- `fastest-levenshtein`: String similarity calculation
- Profanity library: TBD (research in progress, implement placeholder first)

**Constraints**:
- D1 SQLite: No native spatial functions, use bounding box + application-level validation
- Rate limiting stored in D1 (not KV): Query UserPlace.createdAt for count

## Subtasks & Detailed Guidance

### Subtask T007 – Install dependencies: geolib@3.3.4, fastest-levenshtein@1.0.16

**Purpose**: Add libraries for geospatial distance and string similarity calculations.

**Steps**:
1. Navigate to backend directory:
   ```bash
   cd apps/backend
   ```
2. Install packages:
   ```bash
   pnpm add geolib@3.3.4 fastest-levenshtein@1.0.16
   ```
3. Verify installation:
   ```bash
   grep -E "(geolib|fastest-levenshtein)" package.json
   ```

**Files**: `apps/backend/package.json`

**Parallel?**: Yes (independent of other subtasks)

**Notes**:
- `geolib`: 3.3.4 is stable release with MIT license, 100k+ weekly downloads
- `fastest-levenshtein`: 1.0.16 is fastest implementation, MIT license, 500k+ weekly downloads
- Alternative for profanity: `bad-words`, `profanity-js` (research ongoing, implement placeholder first)

---

### Subtask T008 – Create ProfanityFilterPipe in profanity-filter.pipe.ts

**Purpose**: Layer 3 validation - Filter inappropriate content from place names and descriptions.

**Steps**:
1. Create file: `apps/backend/src/common/pipes/profanity-filter.pipe.ts`
2. Implement pipe with placeholder profanity check:
   ```typescript
   import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

   @Injectable()
   export class ProfanityFilterPipe implements PipeTransform {
     transform(value: any) {
       if (value && typeof value === 'object') {
         // Check name field
         if (value.name && this.containsProfanity(value.name)) {
           throw new BadRequestException('Place name contains inappropriate content');
         }

         // Check description field
         if (value.description && this.containsProfanity(value.description)) {
           throw new BadRequestException('Description contains inappropriate content');
         }
       }
       return value;
     }

     private containsProfanity(text: string): boolean {
       // TODO: Implement after choosing profanity library
       // Placeholder: basic keyword check
       const badWords = ['inappropriate1', 'inappropriate2']; // Replace with real library
       const lowerText = text.toLowerCase();
       return badWords.some(word => lowerText.includes(word));
     }
   }
   ```

**Files**: `apps/backend/src/common/pipes/profanity-filter.pipe.ts`

**Parallel?**: Yes (independent file)

**Notes**:
- Pipe executes after DTO validation, before controller method
- Must support both Korean and English content
- Phase 1: Placeholder implementation (basic keyword list)
- Phase 2: Integrate proper profanity library (bad-words, profanity-js, or custom list)
- Error message must be user-friendly (no technical jargon)

**Profanity Library Research** (for Phase 2):
- **bad-words**: 60k+ downloads, multilingual support, customizable word list
- **profanity-js**: Lightweight, Korean support via custom word list
- **Custom Solution**: Maintain curated word list for Korean + English

---

### Subtask T009 – Create RateLimitGuard in rate-limit.guard.ts

**Purpose**: Layer 2 validation - Enforce daily creation limits (5 for new users, 10 for verified users).

**Steps**:
1. Create file: `apps/backend/src/common/guards/rate-limit.guard.ts`
2. Implement guard:
   ```typescript
   import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
   import { PrismaService } from '../prisma/prisma.service';

   @Injectable()
   export class RateLimitGuard implements CanActivate {
     constructor(private prisma: PrismaService) {}

     async canActivate(context: ExecutionContext): boolean {
       const request = context.switchToHttp().getRequest();
       const userId = request.user?.id;

       if (!userId) {
         return true;  // Let auth guard handle this
       }

       // Get today's date range (UTC)
       const today = new Date();
       today.setUTCHours(0, 0, 0, 0);

       // Count places created today
       const count = await this.prisma.userPlace.count({
         where: {
           userId,
           createdAt: {
             gte: today,
           },
         },
       });

       // Determine limit based on user status
       const user = await this.prisma.user.findUnique({ where: { id: userId } });
       const limit = user?.isVerified ? 10 : 5;

       if (count >= limit) {
         throw new HttpException(
           {
             statusCode: HttpStatus.TOO_MANY_REQUESTS,
             message: `Daily place creation limit exceeded (${count}/${limit} used)`,
             limit,
             used: count,
             resetsAt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
             error: 'Too Many Requests',
           },
           HttpStatus.TOO_MANY_REQUESTS,
         );
       }

       return true;
     }
   }
   ```

**Files**: `apps/backend/src/common/guards/rate-limit.guard.ts`

**Parallel?**: Yes (independent file)

**Notes**:
- Guard executes before pipes and controller method
- Uses indexed query on UserPlace.createdAt (from WP01)
- Rate limit resets at midnight UTC
- Response includes helpful metadata: limit, used count, reset time
- Phase 1: D1-based counting (acceptable performance)
- Phase 2: Consider KV caching for high-scale scenarios

**Performance**:
- Query cost: O(log n) due to createdAt index
- Expected query time: 1-3ms for typical dataset
- Acceptable for Phase 1 traffic levels

---

### Subtask T010 – Implement duplicate detection in PlacesService

**Purpose**: Layer 4 validation - Detect duplicate places using D1-optimized bounding box + application-level validation.

**Steps**:
1. Open `apps/backend/src/places/places.service.ts`
2. Import dependencies:
   ```typescript
   import { getDistance } from 'geolib';
   import { distance as levenshteinDistance } from 'fastest-levenshtein';
   ```
3. Add service will be modified in T011 to include detectDuplicates method

**Files**: `apps/backend/src/places/places.service.ts`

**Parallel?**: No (base service modification, required before T011)

**Notes**:
- Two-phase detection: SQL bounding box → Application validation
- Bounding box: ±0.001 degrees (approximately 100m)
- Haversine threshold: ≤100m distance
- Levenshtein threshold: ≥80% similarity
- Returns array of candidates with distance/similarity scores

---

### Subtask T011 – Add detectDuplicates() private method in PlacesService

**Purpose**: Implement the core duplicate detection algorithm.

**Steps**:
1. In `apps/backend/src/places/places.service.ts`, add method:
   ```typescript
   private async detectDuplicates(name: string, lat: number, lng: number) {
     // Phase 1: Bounding box query (D1 SQL)
     const candidates = await this.prisma.place.findMany({
       where: {
         latitude: {
           gte: lat - 0.001,
           lte: lat + 0.001,
         },
         longitude: {
           gte: lng - 0.001,
           lte: lng + 0.001,
         },
       },
     });

     // Phase 2: Application-level validation (Haversine + Levenshtein)
     const duplicates = candidates.filter(place => {
       // Distance check (Haversine)
       const distanceMeters = getDistance(
         { lat, lng },
         { lat: place.latitude, lng: place.longitude },
       );

       // Similarity check (Levenshtein)
       const maxLength = Math.max(name.length, place.name.length);
       const similarity = 1 - (levenshteinDistance(name, place.name) / maxLength);

       return distanceMeters <= 100 && similarity >= 0.8;
     }).map(place => ({
       ...place,
       distance: getDistance({ lat, lng }, { lat: place.latitude, lng: place.longitude }),
       similarity: 1 - (levenshteinDistance(name, place.name) / Math.max(name.length, place.name.length)),
     }));

     return duplicates;
   }
   ```

**Files**: `apps/backend/src/places/places.service.ts`

**Parallel?**: No (depends on T010)

**Notes**:
- **Bounding Box**: ±0.001 degrees ≈ 111m at equator (conservative buffer)
- **Haversine Formula**: Precise great-circle distance calculation (meters)
- **Levenshtein Distance**: Edit distance for string similarity
- **Similarity Calculation**: `1 - (editDistance / maxLength)` gives percentage (0-1)
- **Thresholds**: 100m distance AND 80% similarity (both must pass)
- **Return Format**: Array of places with computed `distance` and `similarity` fields

**Algorithm Complexity**:
- Bounding box query: O(log n) with index
- Candidate set size: ~10-100 places in urban areas
- Application validation: O(k) where k = candidate count
- Total: O(log n + k) ≈ 1-15ms typical

---

### Subtask T012 – Add utility functions for distance/similarity calculations

**Purpose**: Ensure distance and similarity calculations are reusable and testable.

**Steps**:
1. Consider extracting utility functions if reused elsewhere (optional for Phase 1)
2. For Phase 1, inline calculations in detectDuplicates are sufficient
3. Document calculation formulas in code comments

**Files**: `apps/backend/src/places/places.service.ts`

**Parallel?**: No (depends on T011)

**Notes**:
- Phase 1: Inline implementation is acceptable (single use case)
- Phase 2: Extract to `src/common/utils/geo.utils.ts` if used elsewhere
- Libraries handle complexity: `geolib` and `fastest-levenshtein` are battle-tested

**Testing Strategy** (manual for Phase 1):
- Test with known coordinates (e.g., 100m apart)
- Test with similar names (e.g., "Restaurant" vs "Restaurante")
- Verify bounding box returns expected candidates

---

## Risks & Mitigations

**Risk 1: Profanity Filter False Positives**
- **Impact**: Valid place names rejected
- **Mitigation**: Placeholder implementation in Phase 1; refine in Phase 2; provide manual override for admins
- **Detection**: Monitor rejection rate; collect user feedback

**Risk 2: Duplicate Detection False Positives**
- **Impact**: Legitimate nearby places flagged as duplicates
- **Mitigation**: Tunable thresholds (80% similarity, 100m distance); show warning but allow override
- **Example**: "Starbucks - 1st Floor" vs "Starbucks - 2nd Floor" (same building, different locations)

**Risk 3: Rate Limiting Race Conditions**
- **Impact**: User creates 6th place due to concurrent requests
- **Mitigation**: Acceptable for Phase 1; database transaction in Phase 2; KV-based locking if needed
- **Frequency**: Rare (requires millisecond-level concurrency by same user)

**Risk 4: Performance Degradation at Scale**
- **Impact**: Bounding box query slow with 100k+ places
- **Mitigation**: Monitoring; upgrade to PostGIS if needed; KV caching for hot spots
- **Threshold**: If Place table exceeds 100,000 rows, re-evaluate strategy

## Definition of Done Checklist

- [ ] All T007-T012 subtasks completed
- [ ] Dependencies installed and verified in package.json
- [ ] ProfanityFilterPipe created with placeholder implementation
- [ ] RateLimitGuard created and enforces limits correctly
- [ ] PlacesService has detectDuplicates() method
- [ ] Duplicate detection returns correct candidates with scores
- [ ] TypeScript compilation passes: `pnpm typecheck`
- [ ] No lint warnings: `pnpm lint --max-warnings 0`
- [ ] Manual testing: Rate limit blocks 6th request, duplicate detection finds similar places

## Review Guidance

**Key Acceptance Checkpoints**:
1. **Validation Architecture**: Verify Guard → Pipe → Service layer separation
2. **Algorithm Correctness**: Check bounding box calculation, Haversine/Levenshtein usage
3. **Error Handling**: Ensure user-friendly error messages (no stack traces)
4. **Performance**: Validate bounding box query uses spatial index

**Testing Commands**:
```bash
# TypeScript check
pnpm typecheck

# Lint check
pnpm lint --max-warnings 0

# Manual test: Rate limit (create 6 places)
curl -X POST http://localhost:4000/api/places \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","address":"Test St","latitude":37.5,"longitude":127.0}'

# Manual test: Duplicate detection
curl -X POST http://localhost:4000/api/places/validate-duplicate \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Restaurant","latitude":37.5665,"longitude":126.9780}'
```

**Questions for Reviewer**:
- Are validation layers applied in correct order?
- Are error messages clear and actionable for users?
- Are thresholds (80% similarity, 100m distance, 5/10 rate limit) reasonable?

## Activity Log

- 2025-11-04T09:30:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
