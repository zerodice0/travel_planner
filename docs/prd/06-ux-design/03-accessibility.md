# 접근성 PRD

## 1. 개요

WCAG 2.1 AA 준수 접근성 가이드라인

## 2. WCAG 2.1 AA 준수 사항

### 2.1 지각 가능성 (Perceivable)

#### 텍스트 대안
- 모든 이미지에 `alt` 속성
- 아이콘에 `aria-label`
- 장식용 이미지는 `alt=""` 또는 `role="presentation"`

```tsx
// Good
<img src={place.image} alt={place.name} />
<button aria-label="장소 추가">
  <PlusIcon />
</button>

// Bad
<img src={place.image} />
<button><PlusIcon /></button>
```

#### 색상 대비
- 텍스트: 최소 4.5:1
- 큰 텍스트 (18pt+): 최소 3:1
- UI 컴포넌트: 최소 3:1

```css
/* Good */
.text {
  color: #111827; /* 검정 */
  background: #FFFFFF; /* 흰색 */
  /* 대비율: 16.1:1 */
}

/* Bad */
.text {
  color: #999999; /* 회색 */
  background: #FFFFFF; /* 흰색 */
  /* 대비율: 2.8:1 (불충분) */
}
```

#### 적응 가능한 콘텐츠
- 의미 있는 HTML 시맨틱 태그
- 표현과 구조 분리

```tsx
// Good
<header>
  <nav>
    <ul>
      <li><a href="/">홈</a></li>
    </ul>
  </nav>
</header>

// Bad
<div>
  <div>
    <div>
      <div onClick={...}>홈</div>
    </div>
  </div>
</div>
```

### 2.2 운용 가능성 (Operable)

#### 키보드 접근
- 모든 기능 키보드 접근 가능
- Tab 순서 논리적
- 포커스 인디케이터 명확

```tsx
// 포커스 스타일
<button className="
  focus:outline-none
  focus:ring-2
  focus:ring-primary
  focus:ring-offset-2
">
  버튼
</button>
```

#### Tab 순서
```tsx
<form>
  <input tabIndex={1} />
  <input tabIndex={2} />
  <button tabIndex={3}>제출</button>
</form>
```

#### 충분한 시간
- 자동 새로고침 없음 (또는 사용자 제어)
- 타임아웃 경고
- 일시정지/정지 옵션

#### 발작 방지
- 깜빡임 금지 (초당 3회 이상)
- 자동 재생 애니메이션 제어

#### 탐색 가능
- 명확한 헤딩 구조 (h1 > h2 > h3)
- Skip to content 링크
- 랜드마크 역할 사용

```tsx
<a href="#main-content" className="sr-only focus:not-sr-only">
  본문으로 건너뛰기
</a>

<main id="main-content">
  {/* 메인 콘텐츠 */}
</main>
```

### 2.3 이해 가능성 (Understandable)

#### 읽기 쉬움
- 명확한 언어 사용
- 전문 용어 최소화
- 약어 설명

```tsx
<abbr title="Uniform Resource Locator">URL</abbr>
```

#### 예측 가능
- 일관된 네비게이션
- 예측 가능한 동작
- 확인 없는 컨텍스트 변경 금지

#### 입력 지원
- 명확한 레이블
- 에러 메시지 구체적
- 에러 수정 제안

```tsx
<label htmlFor="email">이메일</label>
<input
  id="email"
  type="email"
  aria-invalid={!!error}
  aria-describedby={error ? 'email-error' : undefined}
/>
{error && (
  <p id="email-error" role="alert">
    올바른 이메일 형식이 아닙니다
  </p>
)}
```

### 2.4 견고성 (Robust)

#### 호환성
- 유효한 HTML
- ARIA 속성 올바른 사용

```tsx
// Good
<button aria-pressed={isActive}>
  {isActive ? '활성' : '비활성'}
</button>

// Bad
<div aria-pressed={isActive}>
  버튼
</div>
```

## 3. ARIA 속성

### 3.1 역할 (Roles)
```tsx
<div role="navigation">내비게이션</div>
<div role="main">메인 콘텐츠</div>
<div role="complementary">부가 정보</div>
<div role="contentinfo">푸터</div>
```

### 3.2 상태 (States)
```tsx
<button aria-pressed={isPressed}>토글</button>
<input aria-invalid={hasError} />
<div aria-hidden={isHidden}>숨겨진 콘텐츠</div>
<div aria-expanded={isExpanded}>펼쳐짐</div>
```

### 3.3 속성 (Properties)
```tsx
<button aria-label="닫기">×</button>
<input aria-labelledby="label-id" />
<div aria-describedby="desc-id">콘텐츠</div>
<button aria-haspopup="true">메뉴</button>
```

## 4. 스크린 리더 지원

### 4.1 실시간 영역 (Live Regions)
```tsx
// 알림 메시지
<div role="alert" aria-live="assertive">
  장소가 추가되었습니다
</div>

// 상태 변경
<div role="status" aria-live="polite">
  3개 장소가 검색되었습니다
</div>
```

### 4.2 숨김 콘텐츠
```tsx
// 시각적으로만 숨김 (스크린 리더는 읽음)
<span className="sr-only">
  3개의 미방문 장소
</span>

// 완전히 숨김
<div aria-hidden="true">
  장식용 콘텐츠
</div>
```

## 5. 키보드 네비게이션

### 5.1 주요 단축키
- `Tab`: 다음 요소
- `Shift + Tab`: 이전 요소
- `Enter` / `Space`: 활성화
- `Esc`: 모달 닫기
- `Arrow Keys`: 리스트 이동

### 5.2 커스텀 단축키
```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ctrl/Cmd + K: 검색
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

## 6. 포커스 관리

### 6.1 포커스 트랩 (모달)
```tsx
function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    firstElement?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTab);
    return () => modal.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      {children}
    </div>
  );
}
```

## 7. 터치 타겟

### 7.1 최소 크기
- 터치 타겟: 최소 44x44 pt (iOS), 48x48 dp (Android)
- 간격: 최소 8pt/dp

```tsx
<button className="
  min-w-[44px]
  min-h-[44px]
  p-3
">
  아이콘
</button>
```

## 8. 테스트

### 8.1 자동 테스트
```bash
# axe-core
npm install --save-dev @axe-core/react

# 테스트
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('접근성 위반 없음', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### 8.2 수동 테스트
- 키보드만으로 탐색
- 스크린 리더 (NVDA, JAWS, VoiceOver)
- 고대비 모드
- 확대/축소 (200%)

## 9. 접근성 체크리스트

- [ ] 모든 이미지에 대체 텍스트
- [ ] 색상 대비 4.5:1 이상
- [ ] 키보드 접근 가능
- [ ] 포커스 인디케이터 명확
- [ ] 명확한 헤딩 구조
- [ ] 폼 레이블 제공
- [ ] 에러 메시지 구체적
- [ ] ARIA 속성 적절히 사용
- [ ] 스크린 리더 테스트 통과
- [ ] 터치 타겟 44x44 이상

## 10. 참고 자료

- WCAG 2.1 가이드라인: https://www.w3.org/WAI/WCAG21/quickref/
- ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
- axe DevTools: https://www.deque.com/axe/devtools/
