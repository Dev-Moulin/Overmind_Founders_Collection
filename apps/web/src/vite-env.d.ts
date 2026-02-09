/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_WALLETCONNECT_PROJECT_ID: string;
  }
}

export {};
