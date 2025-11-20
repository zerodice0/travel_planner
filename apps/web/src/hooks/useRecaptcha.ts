import { useEffect, useState } from 'react';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export function useRecaptcha() {
  const [isLoaded, setIsLoaded] = useState(!!window.grecaptcha);
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    if (!siteKey) {
      console.warn('reCAPTCHA site key is not configured');
      return;
    }

    // 이미 로드되어 있으면 스킵
    if (window.grecaptcha) {
      return;
    }

    // reCAPTCHA 스크립트 동적 로드
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      window.grecaptcha.ready(() => {
        setIsLoaded(true);
      });
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup: 스크립트 제거
      document.head.removeChild(script);
    };
  }, [siteKey]);

  const executeRecaptcha = async (action: string): Promise<string | null> => {
    if (!siteKey) {
      console.warn('reCAPTCHA is not configured, skipping verification');
      return null;
    }

    if (!isLoaded || !window.grecaptcha) {
      console.error('reCAPTCHA is not loaded yet');
      return null;
    }

    try {
      const token = await window.grecaptcha.execute(siteKey, { action });
      return token;
    } catch (error) {
      console.error('reCAPTCHA execution failed:', error);
      return null;
    }
  };

  return { isLoaded, executeRecaptcha };
}
