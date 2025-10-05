# 디자인 시스템 PRD

## 1. 개요

일관된 사용자 경험을 위한 디자인 시스템 정의

## 2. 색상 팔레트

### 2.1 Primary (브랜드 색상)
```css
--color-primary: #4A90E2;      /* 메인 */
--color-primary-light: #7AB0EC; /* 밝은 */
--color-primary-dark: #2E5C8A;  /* 어두운 */
```

### 2.2 Secondary
```css
--color-secondary: #50C878;     /* 성공/방문 */
--color-secondary-light: #7FDA9A;
--color-secondary-dark: #3A9A5C;
```

### 2.3 Neutral
```css
--color-gray-50: #F9FAFB;
--color-gray-100: #F3F4F6;
--color-gray-200: #E5E7EB;
--color-gray-300: #D1D5DB;
--color-gray-400: #9CA3AF;
--color-gray-500: #6B7280;
--color-gray-600: #4B5563;
--color-gray-700: #374151;
--color-gray-800: #1F2937;
--color-gray-900: #111827;
```

### 2.4 Semantic
```css
--color-success: #10B981;  /* 성공 */
--color-warning: #F59E0B;  /* 경고 */
--color-error: #EF4444;    /* 에러 */
--color-info: #3B82F6;     /* 정보 */
```

### 2.5 다크 모드
```css
@media (prefers-color-scheme: dark) {
  --color-bg: #111827;
  --color-text: #F9FAFB;
  --color-border: #374151;
}
```

## 3. 타이포그래피

### 3.1 폰트 패밀리
```css
--font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
--font-mono: 'Courier New', monospace;
```

### 3.2 폰트 크기
```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

### 3.3 폰트 웨이트
```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 3.4 라인 높이
```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

## 4. 간격 (Spacing)

```css
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-3: 0.75rem;  /* 12px */
--spacing-4: 1rem;     /* 16px */
--spacing-5: 1.25rem;  /* 20px */
--spacing-6: 1.5rem;   /* 24px */
--spacing-8: 2rem;     /* 32px */
--spacing-10: 2.5rem;  /* 40px */
--spacing-12: 3rem;    /* 48px */
--spacing-16: 4rem;    /* 64px */
```

## 5. Border Radius

```css
--radius-sm: 0.125rem;  /* 2px */
--radius-md: 0.375rem;  /* 6px */
--radius-lg: 0.5rem;    /* 8px */
--radius-xl: 0.75rem;   /* 12px */
--radius-2xl: 1rem;     /* 16px */
--radius-full: 9999px;  /* 원형 */
```

## 6. 그림자 (Shadow)

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

## 7. 컴포넌트

### 7.1 버튼
```tsx
// Primary Button
<button className="
  px-4 py-2
  bg-primary text-white
  rounded-lg
  font-medium
  hover:bg-primary-dark
  active:scale-95
  transition-all
">
  버튼
</button>

// Secondary Button
<button className="
  px-4 py-2
  bg-gray-200 text-gray-800
  rounded-lg
  font-medium
  hover:bg-gray-300
">
  버튼
</button>
```

### 7.2 입력 필드
```tsx
<input className="
  w-full px-4 py-2
  border border-gray-300
  rounded-lg
  focus:border-primary focus:ring-2 focus:ring-primary/20
  outline-none
  transition-all
" />
```

### 7.3 카드
```tsx
<div className="
  p-4
  bg-white
  border border-gray-200
  rounded-xl
  shadow-sm
  hover:shadow-md
  transition-shadow
">
  카드 내용
</div>
```

## 8. 아이콘

- **라이브러리**: Heroicons, Lucide Icons
- **크기**: 16px, 20px, 24px, 32px
- **색상**: 텍스트 색상 상속

## 9. 애니메이션

### 9.1 Transition
```css
--transition-fast: 150ms ease;
--transition-base: 250ms ease;
--transition-slow: 350ms ease;
```

### 9.2 공통 애니메이션
```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide Up */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

## 10. 반응형 브레이크포인트

```css
/* Mobile First */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

## 11. Tailwind 설정

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4A90E2',
          light: '#7AB0EC',
          dark: '#2E5C8A'
        },
        secondary: {
          DEFAULT: '#50C878',
          light: '#7FDA9A',
          dark: '#3A9A5C'
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      }
    }
  }
};
```

## 12. 디자인 토큰 활용

```typescript
// design-tokens.ts
export const designTokens = {
  colors: {
    primary: '#4A90E2',
    secondary: '#50C878',
    // ...
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    // ...
  },
  typography: {
    h1: {
      fontSize: '36px',
      fontWeight: 700,
      lineHeight: 1.25
    }
  }
};
```
