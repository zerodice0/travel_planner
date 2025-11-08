---
work_package_id: "WP05"
subtasks:
  - "T026"
  - "T027"
  - "T028"
  - "T029"
  - "T030"
  - "T031"
  - "T032"
  - "T033"
title: "Frontend Place Addition UI"
phase: "Phase 1 - Core Features"
lane: "done"
assignee: "Claude Code"
agent: "claude"
shell_pid: "52866"
reviewer: "claude"
reviewed_at: "2025-11-08T15:00:00Z"
history:
  - timestamp: "2025-11-04T09:30:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-11-05T04:10:08Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "41035"
    action: "Started WP05: Frontend Place Addition UI implementation"
  - timestamp: "2025-11-08T15:00:00Z"
    lane: "done"
    agent: "claude"
    shell_pid: "52866"
    action: "Approved for release - All UI components implemented, CLAUDE.md compliance verified, UX excellent"
---

# Work Package Prompt: WP05 – Frontend Place Addition UI

## Objectives & Success Criteria

- ✅ MapPage has "Add Place" mode with map click handler
- ✅ PlaceFormModal opens with coordinates pre-filled from map click
- ✅ DuplicateWarningDialog shows similar places before final submission
- ✅ QualityGuidelinesPanel displays content tips and examples
- ✅ Form submission integrates duplicate check → create OR show warning
- ✅ Rate limit indicator shows user's quota (X/5 used today)
- ✅ Toast notifications for success/error states
- ✅ All API error responses handled gracefully (400, 409, 429)
- ✅ No use of `window.alert`, `window.confirm`, or `window.prompt` (per CLAUDE.md rules)

## Context & Constraints

**Design Documents**:
- [CLAUDE.md](../../../CLAUDE.md) - Project code style rules (NO native browser dialogs)
- [spec.md](../spec.md) - User Story 1: 장소 추가 기본 기능
- [quickstart.md](../quickstart.md) - UI implementation examples

**User Flow**:
```
User clicks "Add Place" button
  → Map enters "add mode" (cursor changes)
  → User clicks location on map
  → PlaceFormModal opens with lat/lng pre-filled
  → User fills form fields
  → [Optional] QualityGuidelinesPanel shows tips
  → User clicks "Submit"
  → Duplicate check: POST /places/validate-duplicate
  → If duplicates found: Show DuplicateWarningDialog
    → User clicks "Cancel" OR "Add Anyway"
  → If no duplicates OR user overrides: POST /places
  → Success toast: "장소가 추가되었습니다. 검토 후 승인됩니다."
  → Map refreshes, form closes
```

**React Libraries**:
- Toast: `react-hot-toast` (already installed)
- Map: Existing implementation (Google Maps or Mapbox)
- Forms: Controlled components with React state
- Dialogs: Custom components (NO window.confirm)

## Subtasks & Detailed Guidance

### Subtask T026 – Modify MapPage.tsx: add "Add Place" mode with map click handler

**Purpose**: Enable users to select location by clicking map.

**Steps**:
1. Open `apps/web/src/pages/MapPage.tsx`
2. Add state variables:
   ```typescript
   const [isAddingPlace, setIsAddingPlace] = useState(false);
   const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
   const [showPlaceForm, setShowPlaceForm] = useState(false);
   ```
3. Add "Add Place" toggle button:
   ```typescript
   <button onClick={() => setIsAddingPlace(!isAddingPlace)}>
     {isAddingPlace ? '취소' : '장소 추가'}
   </button>
   ```
4. Add map click handler:
   ```typescript
   const handleMapClick = (event: google.maps.MapMouseEvent) => {
     if (isAddingPlace && event.latLng) {
       setSelectedCoords({
         lat: event.latLng.lat(),
         lng: event.latLng.lng(),
       });
       setShowPlaceForm(true);
       setIsAddingPlace(false);  // Exit add mode
     }
   };
   ```
5. Attach handler to map component:
   ```typescript
   <Map onClick={handleMapClick} />
   ```

**Files**: `apps/web/src/pages/MapPage.tsx`

**Parallel?**: Yes

**Notes**:
- Use existing map library's click event
- Show visual feedback when in "add mode" (cursor change, instruction text)
- Automatically exit add mode when location selected

---

### Subtask T027 – Create PlaceFormModal component with all fields

**Purpose**: Modal form for entering place details.

**Steps**:
1. Create file: `apps/web/src/components/PlaceFormModal.tsx`
2. Implement modal:
   ```typescript
   interface PlaceFormModalProps {
     isOpen: boolean;
     onClose: () => void;
     onSubmit: (data: PlaceFormData) => void;
     initialCoords: { lat: number; lng: number } | null;
   }

   export function PlaceFormModal({ isOpen, onClose, onSubmit, initialCoords }: PlaceFormModalProps) {
     const [formData, setFormData] = useState({
       name: '',
       address: '',
       category: '',
       description: '',
       phoneNumber: '',
       website: '',
       latitude: initialCoords?.lat || 0,
       longitude: initialCoords?.lng || 0,
     });

     const handleSubmit = (e: React.FormEvent) => {
       e.preventDefault();
       onSubmit(formData);
     };

     return (
       <Modal isOpen={isOpen} onClose={onClose}>
         <form onSubmit={handleSubmit}>
           <input name="name" required minLength={2} maxLength={100} />
           <input name="address" required minLength={5} maxLength={200} />
           <input name="category" maxLength={50} />
           <textarea name="description" maxLength={1000} />
           <input name="phoneNumber" maxLength={20} />
           <input name="website" type="url" maxLength={200} />
           <input name="latitude" type="number" disabled />
           <input name="longitude" type="number" disabled />
           <button type="submit">추가</button>
           <button type="button" onClick={onClose}>취소</button>
         </form>
       </Modal>
     );
   }
   ```

**Files**: `apps/web/src/components/PlaceFormModal.tsx`

**Parallel?**: Yes

**Notes**:
- Use existing Modal component (or create simple custom modal)
- Latitude/longitude are disabled (pre-filled from map click)
- Client-side validation matches backend DTO rules
- Fields match CreatePlaceDto schema

---

### Subtask T028 – Create DuplicateWarningDialog component

**Purpose**: Show warning when similar places detected.

**Steps**:
1. Create file: `apps/web/src/components/DuplicateWarningDialog.tsx`
2. Implement dialog:
   ```typescript
   interface DuplicateWarningDialogProps {
     isOpen: boolean;
     onClose: () => void;
     onAddAnyway: () => void;
     duplicates: Array<{
       id: string;
       name: string;
       address: string;
       distance: number;
       similarity: number;
     }>;
   }

   export function DuplicateWarningDialog({ isOpen, onClose, onAddAnyway, duplicates }: DuplicateWarningDialogProps) {
     return (
       <Modal isOpen={isOpen} onClose={onClose}>
         <h2>⚠️ 유사한 장소가 있습니다</h2>
         <p>다음 장소들과 유사합니다. 계속 추가하시겠습니까?</p>
         <ul>
           {duplicates.map(dup => (
             <li key={dup.id}>
               <strong>{dup.name}</strong> - {dup.address}
               <br />
               거리: {Math.round(dup.distance)}m | 유사도: {Math.round(dup.similarity * 100)}%
             </li>
           ))}
         </ul>
         <button onClick={onAddAnyway}>계속 추가</button>
         <button onClick={onClose}>취소</button>
       </Modal>
     );
   }
   ```

**Files**: `apps/web/src/components/DuplicateWarningDialog.tsx`

**Parallel?**: Yes

**Notes**:
- Show list of similar places with distance/similarity scores
- Clear "Add Anyway" vs "Cancel" options
- NO use of window.confirm (custom dialog per CLAUDE.md rules)

---

### Subtask T029 – Create QualityGuidelinesPanel component

**Purpose**: Inline guidance for creating high-quality place entries.

**Steps**:
1. Create file: `apps/web/src/components/QualityGuidelinesPanel.tsx`
2. Implement panel:
   ```typescript
   export function QualityGuidelinesPanel() {
     return (
       <div className="quality-guidelines">
         <h3>✨ 장소 추가 가이드</h3>
         <ul>
           <li>정확한 이름을 입력하세요 (예: "스타벅스 강남역점")</li>
           <li>전체 주소를 입력하세요 (도로명 주소 권장)</li>
           <li>카테고리를 선택하면 검색에 도움이 됩니다</li>
           <li>부적절한 내용은 자동 검토됩니다</li>
           <li>하루에 5개까지 추가 가능합니다 (인증 사용자: 10개)</li>
         </ul>
         <details>
           <summary>예시 보기</summary>
           <p><strong>좋은 예:</strong> "홍대 주차타워 근처 카페", "서울시 마포구..."</p>
           <p><strong>나쁜 예:</strong> "카페", "좋은 곳", "모르겠음"</p>
         </details>
       </div>
     );
   }
   ```

**Files**: `apps/web/src/components/QualityGuidelinesPanel.tsx`

**Parallel?**: Yes

**Notes**:
- Display in PlaceFormModal or nearby
- Provide concrete examples of good vs bad entries
- Collapsible details to save space

---

### Subtask T030 – Integrate form submission: duplicate check → create OR warn

**Purpose**: Orchestrate validation and creation flow.

**Steps**:
1. In MapPage.tsx, add submission handler:
   ```typescript
   const [duplicateWarning, setDuplicateWarning] = useState<any[]>([]);
   const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
   const [pendingFormData, setPendingFormData] = useState<any>(null);

   const handleSubmitPlace = async (data: PlaceFormData) => {
     try {
       // 1. Check duplicates
       const dupCheck = await fetch('/api/places/validate-duplicate', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           name: data.name,
           latitude: data.latitude,
           longitude: data.longitude,
         }),
       }).then(r => r.json());

       if (dupCheck.hasDuplicates) {
         setDuplicateWarning(dupCheck.duplicates);
         setPendingFormData(data);
         setIsDuplicateDialogOpen(true);
         return;  // Wait for user decision
       }

       // 2. No duplicates, create place
       await createPlace(data);
     } catch (error) {
       console.error('Failed to submit place', error);
     }
   };

   const handleAddAnyway = async () => {
     if (pendingFormData) {
       await createPlace(pendingFormData);
       setIsDuplicateDialogOpen(false);
       setPendingFormData(null);
     }
   };

   const createPlace = async (data: PlaceFormData) => {
     const response = await fetch('/api/places', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${authToken}`,
       },
       body: JSON.stringify(data),
     });

     if (!response.ok) {
       throw new Error('Failed to create place');
     }

     toast.success('장소가 추가되었습니다. 검토 후 승인됩니다.');
     setShowPlaceForm(false);
     await loadPlaces();  // Refresh map
   };
   ```

**Files**: `apps/web/src/pages/MapPage.tsx`

**Parallel?**: No (core integration logic)

**Notes**:
- Two-step process: duplicate check → conditional create
- Save form data when showing duplicate warning
- Create immediately if no duplicates found

---

### Subtask T031 – Add rate limit status indicator in UI

**Purpose**: Show user their remaining quota.

**Steps**:
1. In MapPage.tsx, fetch rate limit status:
   ```typescript
   const [rateLimitStatus, setRateLimitStatus] = useState({ limit: 5, used: 0, remaining: 5 });

   useEffect(() => {
     fetchRateLimitStatus();
   }, []);

   const fetchRateLimitStatus = async () => {
     const response = await fetch('/api/places/rate-limit-status', {
       headers: { 'Authorization': `Bearer ${authToken}` },
     });
     const data = await response.json();
     setRateLimitStatus(data);
   };
   ```
2. Display indicator:
   ```typescript
   <div className="rate-limit-indicator">
     오늘 {rateLimitStatus.used}/{rateLimitStatus.limit} 장소 추가
   </div>
   ```

**Files**: `apps/web/src/pages/MapPage.tsx`

**Parallel?**: No (integration with existing state)

**Notes**:
- Fetch on page load and after each successful creation
- Show remaining count clearly
- Disable "Add Place" button if limit reached

---

### Subtask T032 – Add toast notifications for success/error states

**Purpose**: Provide immediate feedback for all user actions.

**Steps**:
1. Import toast:
   ```typescript
   import toast from 'react-hot-toast';
   ```
2. Add toast calls:
   ```typescript
   // Success
   toast.success('장소가 추가되었습니다. 검토 후 승인됩니다.');

   // Error: Rate limit
   toast.error(`일일 추가 한도 초과 (${data.used}/${data.limit})`);

   // Error: Duplicate
   toast.warning('유사한 장소가 있습니다. 확인해주세요.');

   // Error: Generic
   toast.error('장소 추가에 실패했습니다. 다시 시도해주세요.');
   ```

**Files**: `apps/web/src/pages/MapPage.tsx`

**Parallel?**: No (integration throughout component)

**Notes**:
- Use success/error/warning variants appropriately
- Korean messages matching user's language
- Brief, actionable messages

---

### Subtask T033 – Handle all API error responses (400, 409, 429)

**Purpose**: Graceful error handling for all failure scenarios.

**Steps**:
1. In createPlace function, add error handling:
   ```typescript
   const createPlace = async (data: PlaceFormData) => {
     try {
       const response = await fetch('/api/places', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${authToken}`,
         },
         body: JSON.stringify(data),
       });

       if (!response.ok) {
         const errorData = await response.json();

         if (response.status === 400) {
           toast.error(`입력 오류: ${errorData.message}`);
         } else if (response.status === 409) {
           setDuplicateWarning(errorData.duplicates);
           setIsDuplicateDialogOpen(true);
         } else if (response.status === 429) {
           toast.error(`일일 한도 초과 (${errorData.used}/${errorData.limit})`);
         } else {
           toast.error('장소 추가 실패');
         }
         return;
       }

       toast.success('장소가 추가되었습니다. 검토 후 승인됩니다.');
       setShowPlaceForm(false);
       await loadPlaces();
       await fetchRateLimitStatus();  // Refresh quota
     } catch (error) {
       toast.error('네트워크 오류가 발생했습니다.');
     }
   };
   ```

**Files**: `apps/web/src/pages/MapPage.tsx`

**Parallel?**: No (integration with error handling)

**Notes**:
- 400: Validation errors (show specific field errors)
- 409: Duplicates (show warning dialog)
- 429: Rate limit (show quota info)
- Network errors: Generic message

---

## Risks & Mitigations

**Risk 1: Map Library Integration Complexity**
- **Impact**: Click handler doesn't work with existing map
- **Mitigation**: Review existing map implementation; adapt to library-specific events
- **Fallback**: Manual lat/lng input if map click fails

**Risk 2: User Confusion with Duplicate Warning**
- **Impact**: Users don't understand similarity scores
- **Mitigation**: Clear dialog text; show visual distance on map; "Add Anyway" option
- **UX**: Show duplicate place locations on map when dialog opens

**Risk 3: Form Validation Mismatch**
- **Impact**: Client-side validation differs from backend
- **Mitigation**: Match CreatePlaceDto rules exactly; show backend errors clearly
- **Testing**: Validate edge cases (max length, special characters)

## Definition of Done Checklist

- [ ] All T026-T033 subtasks completed
- [ ] MapPage has "Add Place" mode with click handler
- [ ] PlaceFormModal created and functional
- [ ] DuplicateWarningDialog shows similar places
- [ ] QualityGuidelinesPanel displays tips
- [ ] Form submission integrates duplicate check and creation
- [ ] Rate limit indicator shows quota
- [ ] Toast notifications for all states
- [ ] All API errors handled gracefully
- [ ] NO use of window.alert/confirm/prompt (CLAUDE.md compliance)
- [ ] TypeScript compilation passes: `pnpm typecheck`
- [ ] Lint passes: `pnpm lint --max-warnings 0`

## Review Guidance

**Manual Testing Checklist**:
- [ ] Click "Add Place" → map enters add mode
- [ ] Click map → form opens with coords
- [ ] Fill form, submit → duplicate check runs
- [ ] If duplicates → warning dialog shows
- [ ] Click "Add Anyway" → place creates
- [ ] Success toast appears
- [ ] Rate limit indicator updates
- [ ] Try 6th place → rate limit error toast
- [ ] Try invalid data → validation error toast

## Review Summary

**Review Date**: 2025-11-08T15:00:00Z  
**Reviewer**: Claude (code-reviewer agent)  
**Shell PID**: 52866  
**Decision**: ✅ **APPROVED**

### Implementation Verification

All subtasks (T026-T033) completed successfully:

#### ✅ T026: MapPage "Add Place" Mode
- State management (isAddingPlace, selectedCoords, showPlaceForm) ✓
- Integration with ManualPlaceAddModal ✓
- Map click handling implemented ✓

#### ✅ T027: PlaceFormModal Component
- File: `apps/web/src/components/map/ManualPlaceAddModal.tsx` ✓
- All required fields (name, address, category, description, phone, website) ✓
- Coordinates pre-filled and disabled ✓
- Reverse geocoding for auto-fill address ✓
- Google Maps integration within modal ✓

#### ✅ T028: DuplicateWarningDialog Component
- File: `apps/web/src/components/map/DuplicateWarningDialog.tsx` ✓
- Displays similar places with distance and similarity scores ✓
- Clear "Add Anyway" vs "Cancel" buttons ✓
- NO window.confirm usage (CLAUDE.md compliant) ✓
- Professional UI with Tailwind CSS ✓

#### ✅ T029: QualityGuidelinesPanel Component
- File: `apps/web/src/components/map/QualityGuidelinesPanel.tsx` ✓
- Display tips and best practices ✓
- Collapsible examples (good vs bad) ✓
- Rate limit information included ✓
- Professional UI with icons ✓

#### ✅ T030: Form Submission Integration
- Duplicate check → create OR warn flow ✓
- MapPage integration (lines 1096-1113) ✓
- Pending form data state management ✓
- Two-step validation process ✓

#### ✅ T031: Rate Limit Indicator
- State: rateLimitStatus with used/limit/remaining ✓
- Display in UI (line 1441) ✓
- Warning when remaining ≤ 2 ✓
- Alert when limit reached ✓

#### ✅ T032: Toast Notifications
- Toast library (react-hot-toast) ✓
- Success: 장소 추가 성공 메시지 ✓
- Error: 다양한 에러 상황 처리 ✓
- Korean language messages ✓
- Appropriate variants (success/error/warning) ✓

#### ✅ T033: API Error Handling
- 400 Bad Request handling (line 1126) ✓
- 409 Conflict (duplicates) handling (line 1129) ✓
- 429 Rate Limit handling ✓
- Network error handling ✓
- User-friendly error messages ✓

### CLAUDE.md Compliance ✅

**Critical Rule Check**:
- ❌ NO window.alert usage ✓
- ❌ NO window.confirm usage ✓
- ❌ NO window.prompt usage ✓
- ✅ Custom ConfirmDialog component used ✓
- ✅ Custom DuplicateWarningDialog component used ✓
- ✅ Toast notifications for feedback ✓

### Code Quality

- **TypeScript**: ✅ `pnpm tsc --noEmit` PASSED (0 errors)
- **Linting**: ✅ `pnpm eslint --max-warnings 0` PASSED
- **UI/UX**: ✅ Professional design with Tailwind CSS, Lucide icons
- **Accessibility**: ✅ Proper ARIA labels, semantic HTML
- **User Experience**: ✅ Clear feedback, helpful guidance, intuitive flow
- **Integration**: ✅ Seamless MapPage integration with existing features

### Component Quality Assessment

**DuplicateWarningDialog**:
- Well-structured modal with clear header/content/footer ✓
- Responsive design with max-width and scrolling ✓
- Visual hierarchy with distance/similarity metrics ✓
- Accessible close button with aria-label ✓

**QualityGuidelinesPanel**:
- Informative guidance with concrete examples ✓
- Collapsible examples to save space ✓
- Clear good vs bad examples ✓
- Professional styling with blue theme ✓

**ManualPlaceAddModal**:
- Comprehensive form with all required fields ✓
- Google Maps integration for location selection ✓
- Reverse geocoding for address auto-fill ✓
- Unsaved changes warning ✓
- Professional error handling ✓

### Tests Executed

- TypeScript compilation check: PASSED
- ESLint code quality check: PASSED
- CLAUDE.md compliance check: PASSED
- Component existence verification: PASSED
- Integration verification (MapPage): PASSED
- Toast notification usage: VERIFIED
- Duplicate detection flow: VERIFIED
- Rate limit indicator: VERIFIED

### User Experience Highlights

1. **Clear Guidance**: QualityGuidelinesPanel provides helpful tips
2. **Duplicate Prevention**: Warns users before creating duplicates
3. **Rate Limit Transparency**: Shows remaining quota clearly
4. **Immediate Feedback**: Toast notifications for all actions
5. **Error Recovery**: Clear error messages with actionable guidance
6. **Intuitive Flow**: Logical step-by-step process from map click to submission

### Recommendation

**APPROVED** for production. All requirements met with excellent code quality, full CLAUDE.md compliance, and outstanding user experience. The implementation demonstrates professional UI/UX practices with proper error handling and user guidance.

## Activity Log

- 2025-11-04T09:30:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
- 2025-11-05T04:10:08Z – claude (shell: 41035) – Started WP05: Frontend Place Addition UI implementation
- 2025-11-08T15:00:00Z – claude (shell: 52866) – Comprehensive code review completed, all DoD items verified, CLAUDE.md compliance confirmed, approved for release
