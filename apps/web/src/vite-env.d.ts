interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  readonly VITE_AUTH_HINT_COOKIE_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
