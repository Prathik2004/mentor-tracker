/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the deployed backend origin (no /api path), e.g. https://backend.onrender.com */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
