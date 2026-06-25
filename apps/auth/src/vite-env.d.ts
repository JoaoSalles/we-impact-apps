/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Google OAuth 2.0 public client id for the client-side PKCE flow. */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
