import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from '#src/App';
import { ConvexClerkProvider } from '#src/providers/ConvexClerkProvider';
import { initializePostHog } from '#lib/analytics';
import { setupGlobalErrorHandling } from '#lib/logger';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error('Missing Clerk Publishable Key');
}

// TODO: Phase 1에서 Convex 패키지 설치 후 주석 해제
// const convexUrl = import.meta.env.VITE_CONVEX_URL;
// if (!convexUrl) {
//   throw new Error('Missing Convex URL');
// }

// PostHog 초기화
initializePostHog();

// 전역 에러 핸들링 설정
setupGlobalErrorHandling();

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ConvexClerkProvider clerkPublishableKey={clerkPubKey}>
      <App />
    </ConvexClerkProvider>
  </React.StrictMode>,
);
