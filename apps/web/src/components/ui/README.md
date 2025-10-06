# UI Components

Reusable UI components for the Travel Planner application, built with React, TypeScript, and Tailwind CSS.

## Components

### Input Component

A flexible input component with support for text, email, and password types.

#### Features
- Text, email, and password input types
- Error state with validation messages
- Password visibility toggle with eye icon
- Label support
- Full width option
- ARIA attributes for accessibility
- Focus states with primary color ring

#### Usage

```tsx
import { Input } from './components/ui';

// Basic text input
<Input
  type="text"
  label="이름"
  placeholder="이름을 입력하세요"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>

// Email input with error
<Input
  type="email"
  label="이메일"
  placeholder="example@email.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error="올바른 이메일 형식이 아닙니다."
  fullWidth
/>

// Password input with visibility toggle
<Input
  type="password"
  label="비밀번호"
  placeholder="비밀번호를 입력하세요"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  fullWidth
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| type | `'text' \| 'email' \| 'password'` | `'text'` | Input type |
| label | `string` | - | Optional label text |
| error | `string` | - | Error message to display |
| fullWidth | `boolean` | `false` | Make input full width |
| className | `string` | `''` | Additional CSS classes |
| ...rest | `InputHTMLAttributes` | - | All standard input attributes |

### Button Component

A versatile button component with multiple variants and states.

#### Features
- Primary and secondary variants
- Loading state with spinner
- Disabled state
- Full width option
- Scale animation on click
- Accessible with proper ARIA attributes

#### Usage

```tsx
import { Button } from './components/ui';

// Primary button
<Button variant="primary" onClick={handleSubmit}>
  로그인
</Button>

// Secondary button
<Button variant="secondary" onClick={handleCancel}>
  취소
</Button>

// Loading state
<Button variant="primary" loading={isLoading} fullWidth>
  처리 중...
</Button>

// Disabled button
<Button variant="primary" disabled>
  비활성화됨
</Button>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `'primary' \| 'secondary'` | `'primary'` | Button style variant |
| loading | `boolean` | `false` | Show loading spinner |
| fullWidth | `boolean` | `false` | Make button full width |
| disabled | `boolean` | `false` | Disable button |
| className | `string` | `''` | Additional CSS classes |
| ...rest | `ButtonHTMLAttributes` | - | All standard button attributes |

### Checkbox Component

A custom styled checkbox component with label support.

#### Features
- Custom styling with primary color
- Label support
- Checked/unchecked states
- Accessible with proper ARIA attributes
- Cursor pointer on hover

#### Usage

```tsx
import { Checkbox } from './components/ui';

// Basic checkbox
<Checkbox
  checked={isChecked}
  onChange={(e) => setIsChecked(e.target.checked)}
/>

// Checkbox with label
<Checkbox
  label="로그인 상태 유지"
  checked={rememberMe}
  onChange={(e) => setRememberMe(e.target.checked)}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | - | Optional label text |
| className | `string` | `''` | Additional CSS classes |
| ...rest | `InputHTMLAttributes` | - | All standard checkbox input attributes |

## Design Tokens

### Colors

- **Primary**: `#4A90E2` - Used for primary buttons, focus states, and checkboxes
- **Primary Hover**: `#2E5C8A` - Darker shade for hover states
- **Error**: `#EF4444` - Used for error states and messages
- **Gray**: Standard Tailwind gray scale for borders and text

### Spacing

- **Padding**: `px-4 py-2` (16px horizontal, 8px vertical)
- **Border Radius**: `rounded-lg` (8px)
- **Focus Ring**: `ring-2` with 20% opacity

### Transitions

- **Duration**: `200ms` for all transitions
- **Timing**: Default ease function
- **Scale**: `active:scale-95` for button press feedback

## Accessibility

All components follow WCAG 2.1 AA standards:

- Proper ARIA attributes (`aria-label`, `aria-invalid`, `aria-describedby`)
- Keyboard navigation support
- Focus indicators with high contrast
- Screen reader friendly
- Semantic HTML elements
- Proper label associations

## Example

See `LoginForm.example.tsx` for a complete example of using all components together in a login form.

## Type Safety

All components are fully typed with TypeScript:

- No `any` types used
- Props extend native HTML element attributes
- Proper ref forwarding with `forwardRef`
- Exported interfaces for prop types

## Browser Support

These components support all modern browsers:

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)
