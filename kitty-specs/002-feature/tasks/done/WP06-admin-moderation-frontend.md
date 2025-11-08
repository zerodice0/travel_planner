---
work_package_id: "WP06"
subtasks:
  - "T034"
  - "T035"
  - "T036"
  - "T037"
  - "T038"
  - "T039"
  - "T040"
  - "T041"
title: "Admin Moderation Frontend"
phase: "Phase 1 - Core Features"
lane: "done"
assignee: "Claude Code"
agent: "claude"
shell_pid: "54262"
reviewer: "claude"
reviewed_at: "2025-11-08T15:30:00Z"
history:
  - timestamp: "2025-11-04T09:30:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-11-05T12:15:00Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "69869"
    action: "Started WP06: Admin Moderation Frontend implementation"
  - timestamp: "2025-11-08T15:30:00Z"
    lane: "done"
    agent: "claude"
    shell_pid: "54262"
    action: "Approved for release - All admin UI components implemented, route guard verified, CLAUDE.md compliant"
---

# Work Package Prompt: WP06 – Admin Moderation Frontend

## Objectives & Success Criteria

- ✅ AdminModerationPage created and accessible at /admin/moderation
- ✅ ModerationQueueCard component displays place details and actions
- ✅ Status filter tabs (Pending, Approved, Rejected) work correctly
- ✅ Pagination controls (page, limit) navigate queue correctly
- ✅ Approve/reject buttons with confirmation dialogs (NO window.confirm)
- ✅ Review notes input for rejection (required)
- ✅ Route guard redirects non-admin users
- ✅ Loading, empty, and error states handled gracefully

## Context & Constraints

**Design Documents**:
- [CLAUDE.md](../../../CLAUDE.md) - Project code rules (NO native browser dialogs)
- [spec.md](../spec.md) - User Story 3: 검증 데이터 검토
- [quickstart.md](../quickstart.md) - Admin UI implementation examples

**Admin Workflow**:
```
Admin navigates to /admin/moderation
  → Route guard checks isAdmin (redirect if false)
  → Fetch GET /admin/moderation?status=pending
  → Display queue list with ModerationQueueCard components
  → Admin clicks "Approve" on a card
  → Confirmation dialog: "이 장소를 승인하시겠습니까?"
  → User confirms
  → PATCH /admin/moderation/:id { status: "approved" }
  → Success toast, refresh list
```

**UI Requirements**:
- Tabbed interface for status filtering
- Pagination with page numbers and item count
- Custom ConfirmDialog (NO window.confirm per CLAUDE.md)
- Place details: name, address, coords, category, creator info
- Action buttons: Approve (green), Reject (red)

## Subtasks & Detailed Guidance

### Subtask T034 – Create AdminModerationPage component

**Purpose**: Main admin moderation interface.

**Steps**:
1. Create file: `apps/web/src/pages/AdminModerationPage.tsx`
2. Implement page:
   ```typescript
   import { useState, useEffect } from 'react';
   import { useModerationQueue } from '../hooks/useModerationQueue';
   import { ModerationQueueCard } from '../components/ModerationQueueCard';
   import toast from 'react-hot-toast';

   export function AdminModerationPage() {
     const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
     const [page, setPage] = useState(1);
     const { queue, loading, error, loadQueue, reviewPlace } = useModerationQueue(status, page);

     useEffect(() => {
       loadQueue();
     }, [status, page]);

     const handleReview = async (id: string, newStatus: 'approved' | 'rejected', notes?: string) => {
       try {
         await reviewPlace(id, newStatus, notes);
         toast.success(newStatus === 'approved' ? '승인되었습니다' : '거부되었습니다');
         await loadQueue();  // Refresh list
       } catch (error) {
         toast.error('검토 처리 실패');
       }
     };

     return (
       <div className="admin-moderation-page">
         <h1>장소 검토</h1>

         {/* Status filter tabs */}
         <div className="status-tabs">
           {['pending', 'approved', 'rejected'].map(s => (
             <button
               key={s}
               onClick={() => { setStatus(s as any); setPage(1); }}
               className={status === s ? 'active' : ''}
             >
               {s === 'pending' ? '대기중' : s === 'approved' ? '승인됨' : '거부됨'}
             </button>
           ))}
         </div>

         {/* Queue list */}
         {loading && <div>로딩중...</div>}
         {error && <div>오류: {error}</div>}
         {!loading && queue.items.length === 0 && <div>검토할 장소가 없습니다.</div>}

         {queue.items.map(item => (
           <ModerationQueueCard
             key={item.id}
             item={item}
             onReview={handleReview}
           />
         ))}

         {/* Pagination */}
         {queue.pagination && (
           <div className="pagination">
             <button
               disabled={page === 1}
               onClick={() => setPage(page - 1)}
             >
               이전
             </button>
             <span>
               페이지 {queue.pagination.page} / {queue.pagination.totalPages}
             </span>
             <button
               disabled={page >= queue.pagination.totalPages}
               onClick={() => setPage(page + 1)}
             >
               다음
             </button>
           </div>
         )}
       </div>
     );
   }
   ```

**Files**: `apps/web/src/pages/AdminModerationPage.tsx`

**Parallel?**: Yes

**Notes**:
- State management: status, page, queue data
- Uses custom hook `useModerationQueue` for API calls (created in T035)
- Pagination controls at bottom
- Loading/empty/error states handled

---

### Subtask T035 – Create ModerationQueueCard component

**Purpose**: Display individual queue item with approve/reject actions.

**Steps**:
1. Create file: `apps/web/src/components/ModerationQueueCard.tsx`
2. Implement card:
   ```typescript
   import { useState } from 'react';
   import { ConfirmDialog } from './ConfirmDialog';

   interface ModerationQueueCardProps {
     item: {
       id: string;
       place: {
         id: string;
         name: string;
         address: string;
         latitude: number;
         longitude: number;
         category?: string;
         description?: string;
       };
       creator: {
         id: string;
         name: string;
         email: string;
       };
       createdAt: string;
       status: string;
     };
     onReview: (id: string, status: 'approved' | 'rejected', notes?: string) => void;
   }

   export function ModerationQueueCard({ item, onReview }: ModerationQueueCardProps) {
     const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
     const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
     const [rejectNotes, setRejectNotes] = useState('');

     return (
       <div className="moderation-queue-card">
         <h3>{item.place.name}</h3>
         <p>{item.place.address}</p>
         <p>좌표: {item.place.latitude}, {item.place.longitude}</p>
         {item.place.category && <p>카테고리: {item.place.category}</p>}
         {item.place.description && <p>설명: {item.place.description}</p>}
         <p>제출자: {item.creator.name} ({item.creator.email})</p>
         <p>제출일: {new Date(item.createdAt).toLocaleDateString()}</p>

         {item.status === 'pending' && (
           <div className="actions">
             <button
               className="approve-button"
               onClick={() => setIsApproveDialogOpen(true)}
             >
               승인
             </button>
             <button
               className="reject-button"
               onClick={() => setIsRejectDialogOpen(true)}
             >
               거부
             </button>
           </div>
         )}

         {/* Approve confirmation */}
         <ConfirmDialog
           isOpen={isApproveDialogOpen}
           onClose={() => setIsApproveDialogOpen(false)}
           onConfirm={() => {
             onReview(item.id, 'approved');
             setIsApproveDialogOpen(false);
           }}
           title="장소 승인"
           message={`"${item.place.name}"을(를) 승인하시겠습니까?`}
           confirmText="승인"
           variant="success"
         />

         {/* Reject confirmation */}
         <ConfirmDialog
           isOpen={isRejectDialogOpen}
           onClose={() => setIsRejectDialogOpen(false)}
           onConfirm={() => {
             if (rejectNotes.trim()) {
               onReview(item.id, 'rejected', rejectNotes);
               setIsRejectDialogOpen(false);
               setRejectNotes('');
             }
           }}
           title="장소 거부"
           message={`"${item.place.name}"을(를) 거부하시겠습니까?`}
           confirmText="거부"
           variant="danger"
           customContent={
             <textarea
               placeholder="거부 사유 (필수)"
               value={rejectNotes}
               onChange={(e) => setRejectNotes(e.target.value)}
               required
             />
           }
         />
       </div>
     );
   }
   ```

**Files**: `apps/web/src/components/ModerationQueueCard.tsx`

**Parallel?**: Yes

**Notes**:
- Display all place details and creator info
- Use ConfirmDialog component (existing or create simple version)
- Reject requires notes (textarea in dialog)
- NO window.confirm usage per CLAUDE.md

---

### Subtask T036 – Implement status filter tabs

**Purpose**: Filter queue by pending/approved/rejected status.

**Steps**:
1. In AdminModerationPage (T034), status tabs already implemented
2. Ensure state management:
   ```typescript
   const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

   // When status changes, reset to page 1
   const handleStatusChange = (newStatus) => {
     setStatus(newStatus);
     setPage(1);
   };
   ```
3. Style active tab for visual feedback

**Files**: `apps/web/src/pages/AdminModerationPage.tsx`

**Parallel?**: Yes

**Notes**:
- Three tabs: Pending (default), Approved, Rejected
- Active tab highlighted
- Changing status resets pagination to page 1

---

### Subtask T037 – Implement pagination controls

**Purpose**: Navigate through large moderation queue.

**Steps**:
1. In AdminModerationPage (T034), pagination already implemented
2. Add item count display:
   ```typescript
   <div className="pagination-info">
     총 {queue.pagination.total}개 항목
     (페이지당 {queue.pagination.limit}개)
   </div>
   ```
3. Ensure prev/next buttons disabled appropriately

**Files**: `apps/web/src/pages/AdminModerationPage.tsx`

**Parallel?**: Yes

**Notes**:
- Default: 20 items per page
- Show total count and current page
- Disable prev on page 1, disable next on last page

---

### Subtask T038 – Add approve/reject action buttons with confirmation

**Purpose**: Execute moderation actions with user confirmation.

**Steps**:
1. In ModerationQueueCard (T035), action buttons already implemented
2. Ensure ConfirmDialog component exists or create:
   ```typescript
   // apps/web/src/components/ConfirmDialog.tsx
   export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText, variant, customContent }) {
     return (
       <Modal isOpen={isOpen} onClose={onClose}>
         <h2>{title}</h2>
         <p>{message}</p>
         {customContent}
         <div className="dialog-actions">
           <button onClick={onConfirm} className={`btn-${variant}`}>
             {confirmText}
           </button>
           <button onClick={onClose} className="btn-cancel">
             취소
           </button>
         </div>
       </Modal>
     );
   }
   ```

**Files**: `apps/web/src/components/ModerationQueueCard.tsx`, `apps/web/src/components/ConfirmDialog.tsx`

**Parallel?**: Yes

**Notes**:
- Approve: Simple confirmation
- Reject: Includes textarea for notes (required)
- Variant: "success" (green) for approve, "danger" (red) for reject

---

### Subtask T039 – Add review notes input for rejection

**Purpose**: Require admin to provide reason for rejection.

**Steps**:
1. In ModerationQueueCard reject dialog (T035), textarea already implemented
2. Validate notes not empty:
   ```typescript
   const handleRejectConfirm = () => {
     if (!rejectNotes.trim()) {
       toast.error('거부 사유를 입력해주세요');
       return;
     }
     onReview(item.id, 'rejected', rejectNotes);
     setIsRejectDialogOpen(false);
     setRejectNotes('');
   };
   ```

**Files**: `apps/web/src/components/ModerationQueueCard.tsx`

**Parallel?**: Yes

**Notes**:
- Required for reject action
- Clear placeholder text
- Validate before submitting
- Reset after successful rejection

---

### Subtask T040 – Add route guard for admin-only access

**Purpose**: Prevent non-admin users from accessing moderation page.

**Steps**:
1. Create/update route configuration:
   ```typescript
   // apps/web/src/routes.tsx (or routing config)
   import { useAuth } from './hooks/useAuth';
   import { Navigate } from 'react-router-dom';

   function AdminRoute({ children }) {
     const { user } = useAuth();

     if (!user) {
       return <Navigate to="/login" />;
     }

     if (!user.isAdmin) {
       toast.error('관리자 권한이 필요합니다');
       return <Navigate to="/" />;
     }

     return children;
   }

   // Usage
   <Route path="/admin/moderation" element={
     <AdminRoute>
       <AdminModerationPage />
     </AdminRoute>
   } />
   ```

**Files**: Routing configuration file (e.g., `apps/web/src/routes.tsx`)

**Parallel?**: Yes

**Notes**:
- Check user.isAdmin before rendering page
- Redirect to home if not admin
- Show error toast explaining permission issue

---

### Subtask T041 – Add loading/empty/error states

**Purpose**: Provide feedback for all UI states.

**Steps**:
1. In AdminModerationPage (T034), states already handled
2. Create custom hook for data fetching:
   ```typescript
   // apps/web/src/hooks/useModerationQueue.ts
   import { useState } from 'react';

   export function useModerationQueue(status: string, page: number) {
     const [queue, setQueue] = useState({ items: [], pagination: null });
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);

     const loadQueue = async () => {
       setLoading(true);
       setError(null);
       try {
         const response = await fetch(
           `/api/admin/moderation?status=${status}&page=${page}&limit=20`,
           { headers: { 'Authorization': `Bearer ${authToken}` } }
         );
         if (!response.ok) throw new Error('Failed to load queue');
         const data = await response.json();
         setQueue(data);
       } catch (err) {
         setError(err.message);
       } finally {
         setLoading(false);
       }
     };

     const reviewPlace = async (id: string, status: string, notes?: string) => {
       const response = await fetch(`/api/admin/moderation/${id}`, {
         method: 'PATCH',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${authToken}`,
         },
         body: JSON.stringify({ status, reviewNotes: notes }),
       });
       if (!response.ok) throw new Error('Review failed');
       return response.json();
     };

     return { queue, loading, error, loadQueue, reviewPlace };
   }
   ```

**Files**: `apps/web/src/hooks/useModerationQueue.ts`

**Parallel?**: Yes

**Notes**:
- Loading: Show spinner or skeleton
- Empty: "검토할 장소가 없습니다"
- Error: Show error message with retry option

---

## Risks & Mitigations

**Risk 1: Large Queue Causes UI Slowdown**
- **Impact**: Slow rendering, poor UX
- **Mitigation**: Pagination enforced (max 20 items), consider virtualization in Phase 2
- **Threshold**: Monitor if queue exceeds 100 pending items

**Risk 2: Accidental Approve/Reject**
- **Impact**: Wrong moderation decision
- **Mitigation**: Confirmation dialogs, show full place details, undo feature in Phase 2
- **UX**: Clear button labels, distinct colors (green/red)

**Risk 3: Non-Admin Access**
- **Impact**: Unauthorized users see 403 errors
- **Mitigation**: Route guard, frontend hides admin link for non-admins
- **Backend**: API also checks isAdmin (defense in depth)

## Definition of Done Checklist

- [ ] All T034-T041 subtasks completed
- [ ] AdminModerationPage created at /admin/moderation
- [ ] ModerationQueueCard displays place details and actions
- [ ] Status filter tabs work correctly
- [ ] Pagination controls navigate queue
- [ ] Approve/reject buttons with confirmation dialogs (NO window.confirm)
- [ ] Review notes required for rejection
- [ ] Route guard redirects non-admins
- [ ] Loading, empty, error states handled
- [ ] TypeScript compilation passes: `pnpm typecheck`
- [ ] Lint passes: `pnpm lint --max-warnings 0`

## Review Guidance

**Manual Testing Checklist**:
- [ ] Navigate to /admin/moderation as admin → page loads
- [ ] Navigate as non-admin → redirected to home
- [ ] Click Pending tab → shows pending places
- [ ] Click Approve → confirmation dialog → place approved
- [ ] Click Reject → dialog with notes → submit → place rejected
- [ ] Reject without notes → validation error
- [ ] Switch to Approved tab → shows approved places
- [ ] Switch to Rejected tab → shows rejected places
- [ ] Pagination: next/prev buttons work
- [ ] Empty state displays when no items
- [ ] Loading state displays during fetch

## Review Summary

**Review Date**: 2025-11-08T15:30:00Z  
**Reviewer**: Claude (code-reviewer agent)  
**Shell PID**: 54262  
**Decision**: ✅ **APPROVED**

### Implementation Verification

All subtasks (T034-T041) completed successfully:

#### ✅ T034: AdminModerationPage Component
- File: `apps/web/src/pages/AdminModerationPage.tsx` ✓
- Route: `/admin/moderation` configured in App.tsx ✓
- Status filter tabs (Pending, Approved, Rejected) ✓
- Pagination controls with prev/next buttons ✓
- Loading, empty, and error states ✓

#### ✅ T035: ModerationQueueCard Component
- File: `apps/web/src/components/admin/ModerationQueueCard.tsx` ✓
- Displays place details (name, address, coordinates, category, description) ✓
- Shows creator information (name, email) ✓
- Creation date display ✓
- Review information for approved/rejected items ✓

#### ✅ T036: Status Filter Tabs
- Three tabs: Pending (amber), Approved (green), Rejected (red) ✓
- Active tab highlighting with color coding ✓
- Item count display on active tab ✓
- Reset to page 1 when changing status ✓

#### ✅ T037: Pagination Controls
- Previous/Next buttons ✓
- Page counter (page X / totalPages) ✓
- Disabled state for boundaries ✓
- State management for page navigation ✓

#### ✅ T038: Approve/Reject Actions
- Approve button with ConfirmDialog ✓
- Reject button with ConfirmDialog ✓
- Review notes input for rejection (required) ✓
- NO window.confirm usage (CLAUDE.md compliant) ✓
- Loading states during processing ✓

#### ✅ T039: Route Guard (AdminRoute)
- File: `apps/web/src/components/AdminRoute.tsx` ✓
- Authentication check ✓
- Admin privilege check (user.isAdmin) ✓
- Redirect non-authenticated users to login ✓
- Redirect non-admin users to home with toast ✓
- Loading state during auth check ✓

#### ✅ T040: Loading States
- Loading spinner with animation ✓
- Loading message "검토 목록을 불러오는 중..." ✓
- Centered layout during loading ✓

#### ✅ T041: Empty and Error States
- Empty state message "검토할 장소가 없습니다." ✓
- Error display with error message ✓
- Conditional rendering based on data state ✓

### CLAUDE.md Compliance ✅

**Critical Rule Check**:
- ❌ NO window.alert usage ✓
- ❌ NO window.confirm usage ✓
- ❌ NO window.prompt usage ✓
- ✅ Custom ConfirmDialog component used ✓
- ✅ Toast notifications for feedback ✓

### Code Quality

- **TypeScript**: ✅ `pnpm tsc --noEmit` PASSED (0 errors)
- **Linting**: ✅ `pnpm eslint --max-warnings 0` PASSED
- **UI/UX**: ✅ Professional admin interface with clear status indicators
- **Accessibility**: ✅ Proper semantic HTML and ARIA attributes
- **Security**: ✅ Route guard prevents unauthorized access
- **Integration**: ✅ Properly configured in App.tsx routing

### Component Quality Assessment

**AdminModerationPage**:
- Clean component structure with hooks ✓
- Proper state management (status, page) ✓
- Effect hook for data loading ✓
- Professional header with Shield icon ✓
- Responsive design with max-width container ✓

**ModerationQueueCard**:
- Comprehensive place information display ✓
- Clear visual hierarchy ✓
- Status badges with color coding ✓
- Creator and review metadata ✓
- Professional styling with Tailwind CSS ✓

**AdminRoute**:
- Robust authentication and authorization checks ✓
- Proper loading state handling ✓
- User-friendly redirect behavior ✓
- Toast notification for access denial ✓
- LoginDialog integration for unauthenticated users ✓

### Tests Executed

- TypeScript compilation check: PASSED
- ESLint code quality check: PASSED
- CLAUDE.md compliance check: PASSED
- Component existence verification: PASSED
- Route configuration verification: PASSED
- Route guard implementation: VERIFIED
- ConfirmDialog usage (no window.confirm): VERIFIED

### User Experience Highlights

1. **Clear Navigation**: Tab-based filtering makes it easy to switch between statuses
2. **Visual Feedback**: Color-coded status badges and tabs
3. **Information Completeness**: All relevant place and creator details displayed
4. **Action Confirmation**: ConfirmDialog prevents accidental approvals/rejections
5. **Access Control**: Route guard provides clear feedback for unauthorized access
6. **Loading States**: Professional loading indicators during data fetch
7. **Error Handling**: Graceful error display with helpful messages

### Security Highlights

1. **Authentication Required**: Route guard checks authentication first
2. **Authorization Enforced**: Admin privilege check prevents non-admin access
3. **Proper Redirects**: Non-admin users redirected with error message
4. **No Sensitive Data Exposure**: Only necessary user info displayed
5. **Toast Notifications**: Clear error messages without exposing system details

### Recommendation

**APPROVED** for production. All requirements met with excellent code quality, full CLAUDE.md compliance, robust security through route guarding, and professional admin UI. The implementation provides a complete, user-friendly moderation interface for admin users.

## Activity Log

- 2025-11-04T09:30:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
- 2025-11-05T04:29:45Z – claude (shell: 69869) – Started implementation
- 2025-11-05T04:35:00Z – claude (shell: 69869) – Completed all subtasks (T034-T041)
- 2025-11-05T04:34:48Z – claude (shell: 69869) – Ready for review - all subtasks completed
- 2025-11-08T15:30:00Z – claude (shell: 54262) – Comprehensive code review completed, all DoD items verified, CLAUDE.md compliance confirmed, route guard verified, approved for release
