/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL for validating the OAuth credential. */
  readonly VITE_VALIDATE_CREDENTIAL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
  