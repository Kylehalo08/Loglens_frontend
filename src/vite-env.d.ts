/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_INGEST_BASE_URL?: string;
  readonly VITE_API_PROXY_TARGET?: string;
  readonly VITE_INGEST_PROXY_TARGET?: string;
  readonly VITE_AI_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.css" {
  const content: string;
  export default content;
}
