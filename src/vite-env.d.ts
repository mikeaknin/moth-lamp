/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_TESTNET?: string;
  readonly VITE_BASE_SEPOLIA_RPC?: string;
  readonly VITE_BASE_RPC?: string;
  readonly VITE_BUILDER_CODE?: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
