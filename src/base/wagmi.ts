import { http, createConfig, createStorage } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { baseAccount, injected } from 'wagmi/connectors';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined;

/**
 * Wagmi config for optional Base Account features.
 * Gameplay never requires a connection.
 * Default chain for development: Base Sepolia.
 */
export const wagmiConfig = createConfig({
  chains: [baseSepolia, base],
  connectors: [
    injected(),
    baseAccount({
      appName: 'MOTH//LAMP',
      appLogoUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/icons/icon-192.png`,
    }),
  ],
  storage: createStorage({ storage: localStorage }),
  transports: {
    [baseSepolia.id]: http(import.meta.env.VITE_BASE_SEPOLIA_RPC ?? 'https://sepolia.base.org'),
    [base.id]: http(import.meta.env.VITE_BASE_RPC ?? 'https://mainnet.base.org'),
  },
});

export const USE_TESTNET = (import.meta.env.VITE_USE_TESTNET ?? 'true') !== 'false';

export const BUILDER_CODE = (import.meta.env.VITE_BUILDER_CODE as string | undefined) ?? '';

// Silence unused in production builds when WalletConnect id not set
void projectId;
