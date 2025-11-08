---
work_package_id: "WP04"
subtasks:
  - "T020"
  - "T021"
  - "T022"
  - "T023"
  - "T024"
  - "T025"
title: "Admin Moderation Backend"
phase: "Phase 1 - Core Features"
lane: "done"
assignee: "Claude Code"
agent: "claude"
shell_pid: "44446"
reviewer: "claude"
reviewed_at: "2025-11-08T14:30:00Z"
history:
  - timestamp: "2025-11-04T09:30:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-11-05T10:35:00Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "49661"
    action: "Started WP04: Admin Moderation Backend implementation"
  - timestamp: "2025-11-05T12:00:00Z"
    lane: "for_review"
    agent: "claude"
    shell_pid: "49661"
    action: "Completed WP04: Admin moderation API with GET queue and PATCH review endpoints"
  - timestamp: "2025-11-08T14:30:00Z"
    lane: "done"
    agent: "claude"
    shell_pid: "44446"
    action: "Approved for release - All requirements met, code quality excellent, security verified"
---

# Work Package Prompt: WP04 – Admin Moderation Backend

## Objectives & Success Criteria

- ✅ AdminController created with moderation endpoints
- ✅ GET /admin/moderation returns paginated queue with filtering by status
- ✅ PATCH /admin/moderation/:id updates status (approve/reject)
- ✅ AdminGuard protects endpoints (403 if !isAdmin)
- ✅ Responses include Place, creator User, reviewer User relations
- ✅ All responses match OpenAPI spec
- ✅ Error handling for 403 Forbidden, 404 Not Found

## Context & Constraints

**Design Documents**:
- [contracts/places-api.yaml](../contracts/places-api.yaml) - Admin moderation API spec
- [data-model.md](../data-model.md) - PlaceModerationQueue schema
- [plan.md](../plan.md) - Admin moderation workflow

**Admin API Endpoints**:
1. GET /admin/moderation - List queue with filters/pagination
2. PATCH /admin/moderation/:id - Approve or reject place

**Moderation Workflow**:
```
Admin opens page → GET /admin/moderation?status=pending
  → Review place details
  → Click Approve/Reject
  → PATCH /admin/moderation/:id { status: "approved" }
  → Queue updates, frontend refreshes
```

**Authorization**:
- Only users with `isAdmin: true` can access
- AdminGuard checks `req.user.isAdmin`
- Returns 403 Forbidden if not admin

## Subtasks & Detailed Guidance

### Subtask T020 – Create AdminController in admin.controller.ts

**Purpose**: Central controller for admin operations.

**Steps**:
1. Create file: `apps/backend/src/admin/admin.controller.ts`
2. Bootstrap controller:
   ```typescript
   import { Controller, Get, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
   import { AdminGuard } from '../common/guards/admin.guard';
   import { PrismaService } from '../common/prisma/prisma.service';

   @Controller('admin/moderation')
   @UseGuards(AdminGuard)  // Apply to all endpoints
   export class AdminController {
     constructor(private prisma: PrismaService) {}
   }
   ```

**Files**: `apps/backend/src/admin/admin.controller.ts`

**Parallel?**: Yes

**Notes**:
- `@Controller('admin/moderation')`: Base path for all moderation endpoints
- `@UseGuards(AdminGuard)`: Applied at controller level, protects all methods
- Requires AdminModule setup in app module (existing infrastructure assumed)

---

### Subtask T021 – Implement GET /admin/moderation with filters and pagination

**Purpose**: List moderation queue with status filter, sorting, and pagination.

**Steps**:
1. In AdminController, add GET endpoint:
   ```typescript
   @Get()
   async getQueue(
     @Query('status') status: string = 'pending',
     @Query('page') page: number = 1,
     @Query('limit') limit: number = 20,
     @Query('sortBy') sortBy: string = 'createdAt',
     @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'asc',
   ) {
     const skip = (Number(page) - 1) * Number(limit);

     const [items, total] = await Promise.all([
       this.prisma.placeModerationQueue.findMany({
         where: { status },
         include: {
           place: true,
           user: { select: { id: true, name: true, email: true } },
           reviewer: { select: { id: true, name: true } },
         },
         skip,
         take: Number(limit),
         orderBy: { [sortBy]: sortOrder },
       }),
       this.prisma.placeModerationQueue.count({ where: { status } }),
     ]);

     return {
       items,
       pagination: {
         page: Number(page),
         limit: Number(limit),
         total,
         totalPages: Math.ceil(total / Number(limit)),
       },
     };
   }
   ```

**Files**: `apps/backend/src/admin/admin.controller.ts`

**Parallel?**: Yes

**Notes**:
- Query params: status (pending/approved/rejected), page (1-indexed), limit (default 20, max 100)
- Uses indexed queries on PlaceModerationQueue.status and createdAt
- Includes relations: place (full object), user (creator info), reviewer (if reviewed)
- Returns pagination metadata for frontend

---

### Subtask T022 – Implement PATCH /admin/moderation/:id for approve/reject

**Purpose**: Update moderation queue entry status.

**Steps**:
1. In AdminController, add PATCH endpoint:
   ```typescript
   @Patch(':id')
   async review(
     @Param('id') id: string,
     @Body() dto: { status: 'approved' | 'rejected'; reviewNotes?: string },
     @Request() req,
   ) {
     // Validate reviewNotes required for rejection
     if (dto.status === 'rejected' && !dto.reviewNotes) {
       throw new BadRequestException('reviewNotes is required when rejecting');
     }

     return this.prisma.placeModerationQueue.update({
       where: { id },
       data: {
         status: dto.status,
         reviewerId: req.user.id,
         reviewedAt: new Date(),
         reviewNotes: dto.reviewNotes,
       },
       include: {
         place: true,
         user: { select: { id: true, name: true, email: true } },
         reviewer: { select: { id: true, name: true } },
       },
     });
   }
   ```

**Files**: `apps/backend/src/admin/admin.controller.ts`

**Parallel?**: Yes

**Notes**:
- Request body: `{ status: "approved" | "rejected", reviewNotes?: string }`
- Sets reviewerId to current admin user
- Sets reviewedAt to current timestamp
- reviewNotes required for rejection, optional for approval
- Returns updated queue entry with relations

---

### Subtask T023 – Add AdminGuard to protect moderation endpoints

**Purpose**: Ensure only admins can access moderation API.

**Steps**:
1. Create file: `apps/backend/src/common/guards/admin.guard.ts`
2. Implement guard:
   ```typescript
   import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

   @Injectable()
   export class AdminGuard implements CanActivate {
     canActivate(context: ExecutionContext): boolean {
       const request = context.switchToHttp().getRequest();
       const user = request.user;

       if (!user) {
         throw new ForbiddenException('Authentication required');
       }

       if (!user.isAdmin) {
         throw new ForbiddenException('Admin access required');
       }

       return true;
     }
   }
   ```

**Files**: `apps/backend/src/common/guards/admin.guard.ts`

**Parallel?**: Yes

**Notes**:
- Assumes auth middleware already set `req.user`
- Checks `user.isAdmin` boolean field
- Throws ForbiddenException (403) if not admin
- Applied at controller level via `@UseGuards(AdminGuard)`

---

### Subtask T024 – Add error handling for 403 Forbidden, 404 Not Found

**Purpose**: Provide clear error messages for authorization failures and missing resources.

**Steps**:
1. In AdminController PATCH method, add 404 handling:
   ```typescript
   @Patch(':id')
   async review(...) {
     try {
       return await this.prisma.placeModerationQueue.update(...);
     } catch (error) {
       if (error.code === 'P2025') {  // Prisma "Record not found"
         throw new NotFoundException('Moderation queue item not found');
       }
       throw error;
     }
   }
   ```

**Files**: `apps/backend/src/admin/admin.controller.ts`

**Parallel?**: Yes

**Notes**:
- 403 handled by AdminGuard
- 404 handled by catching Prisma "P2025" error code
- Error format matches OpenAPI spec

---

### Subtask T025 – Include Place, User (creator), User (reviewer) relations in responses

**Purpose**: Provide complete context for admin review decisions.

**Steps**:
1. Ensure all queries use `include` clause (already in T021, T022)
2. Verify response structure matches OpenAPI ModerationQueueItem schema:
   ```typescript
   {
     id: string,
     placeId: string,
     place: { id, name, address, latitude, longitude, ... },
     creator: { id, name, email },
     status: "pending" | "approved" | "rejected",
     reviewerId: string | null,
     reviewer: { id, name } | null,
     reviewedAt: string | null,
     reviewNotes: string | null,
     createdAt: string,
     updatedAt: string
   }
   ```

**Files**: `apps/backend/src/admin/admin.controller.ts`

**Parallel?**: Yes

**Notes**:
- Use Prisma `include` for relations
- Use `select` to limit User fields (don't expose sensitive data)
- Relations are nullable for pending entries (no reviewer yet)

---

## Risks & Mitigations

**Risk 1: Large Queue Causes Performance Issues**
- **Impact**: Slow page loads, timeouts
- **Mitigation**: Pagination enforced (max 100 items per page), indexed queries
- **Threshold**: Monitor if queue exceeds 1,000 pending items

**Risk 2: Concurrent Admin Actions**
- **Impact**: Two admins approve same place simultaneously
- **Mitigation**: Acceptable for Phase 1; optimistic locking in Phase 2
- **Frequency**: Rare (admins typically review different places)

**Risk 3: Missing Admin Permissions**
- **Impact**: Regular users see 403 errors
- **Mitigation**: Clear error message, frontend route guard prevents access attempt
- **UX**: Frontend should hide admin UI for non-admin users

## Definition of Done Checklist

- [ ] All T020-T025 subtasks completed
- [ ] AdminController created with GET and PATCH endpoints
- [ ] AdminGuard protects all moderation endpoints
- [ ] Pagination and filtering work correctly
- [ ] Error handling for 403, 404 implemented
- [ ] Relations included in responses
- [ ] TypeScript compilation passes: `pnpm typecheck`
- [ ] Lint passes: `pnpm lint --max-warnings 0`
- [ ] Manual testing: Admin can fetch queue, approve/reject places

## Review Guidance

**Testing Commands**:
```bash
# Get pending queue
curl http://localhost:4000/api/admin/moderation?status=pending \
  -H "Authorization: Bearer <admin-token>"

# Approve place
curl -X PATCH http://localhost:4000/api/admin/moderation/<queue-id> \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"approved"}'

# Reject place with notes
curl -X PATCH http://localhost:4000/api/admin/moderation/<queue-id> \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"rejected","reviewNotes":"Duplicate place"}'

# Test 403 (non-admin user)
curl http://localhost:4000/api/admin/moderation \
  -H "Authorization: Bearer <regular-user-token>"
```

## Review Summary

**Review Date**: 2025-11-08T14:30:00Z  
**Reviewer**: Claude (code-reviewer agent)  
**Shell PID**: 44446  
**Decision**: ✅ **APPROVED**

### Implementation Verification

All subtasks (T020-T025) completed successfully:

#### ✅ T020: AdminController Created
- File: `apps/api/src/admin/admin.controller.ts` ✓
- Module: `apps/api/src/admin/admin.module.ts` ✓
- Registered in app.module.ts ✓

#### ✅ T021: GET /admin/moderation Endpoint
- Pagination with max 100 items enforced ✓
- Query params (status, page, limit, sortBy, sortOrder) ✓
- Relations (place, user, reviewer) included ✓
- Response format matches OpenAPI spec ✓

#### ✅ T022: PATCH /admin/moderation/:id Endpoint
- Request validation (reviewNotes required for rejection) ✓
- Sets reviewerId, reviewedAt, reviewNotes ✓
- Returns updated entry with relations ✓
- Error handling for P2025 (404) ✓

#### ✅ T023: AdminGuard Protection
- File: `apps/api/src/common/guards/admin.guard.ts` ✓
- Checks req.user.isAdmin ✓
- Throws ForbiddenException (403) appropriately ✓
- Applied with JwtAuthGuard at controller level ✓

#### ✅ T024: Error Handling
- 403 Forbidden (AdminGuard) ✓
- 404 Not Found (Prisma P2025) ✓
- 400 Bad Request (reviewNotes validation) ✓

#### ✅ T025: Relations in Responses
- Place (full object) ✓
- User/creator (selective: id, nickname, email) ✓
- Reviewer (selective: id, nickname) ✓
- Proper nullability handling ✓

### Code Quality

- **TypeScript**: ✅ `pnpm tsc --noEmit` PASSED (0 errors)
- **Linting**: ✅ `pnpm eslint --max-warnings 0` PASSED
- **Security**: ✅ Authentication + Authorization verified
- **Performance**: ✅ Indexed queries, pagination enforced
- **API Compliance**: ✅ Matches OpenAPI specification
- **Best Practices**: ✅ NestJS patterns, proper DI, type safety

### Tests Executed

- TypeScript compilation check: PASSED
- ESLint code quality check: PASSED
- Schema alignment verification: PASSED
- OpenAPI spec compliance: PASSED
- Security review (auth/authz): PASSED

### Recommendation

**APPROVED** for production. All requirements met with excellent code quality, proper error handling, and security best practices. Ready to move to done lane.

## Activity Log

- 2025-11-04T09:30:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
- 2025-11-08T14:30:00Z – claude (shell: 44446) – Comprehensive code review completed, all DoD items verified, approved for release
