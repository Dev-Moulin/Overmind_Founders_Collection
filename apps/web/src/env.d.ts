/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WALLETCONNECT_PROJECT_ID: string;
  readonly VITE_PINATA_API_KEY: string;
  readonly VITE_PINATA_SECRET_KEY: string;
  readonly VITE_API_URL: string;
  readonly VITE_CHAIN_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
