/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_APP_ENVIRONMENT: 'development' | 'staging' | 'production';
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_MIXPANEL_TOKEN?: string;
  readonly VITE_HOTJAR_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
