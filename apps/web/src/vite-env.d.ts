/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_CONVEX_URL: string;
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
  readonly VITE_RECAPTCHA_SITE_KEY: string;
  readonly VITE_KAKAO_MAP_KEY: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_GOOGLE_MAP_ID: string;
  readonly VITE_POSTHOG_KEY: string;
  readonly VITE_POSTHOG_HOST: string;
  readonly VITE_AXIOM_TOKEN: string;
  readonly VITE_AXIOM_DATASET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
