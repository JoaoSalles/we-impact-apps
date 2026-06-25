/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Override the auth Module Federation remoteEntry URL (defaults to :4201). */
  readonly VITE_AUTH_REMOTE_ENTRY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
