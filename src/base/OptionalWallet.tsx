import { useCallback, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { createSiweMessage, generateSiweNonce } from 'viem/siwe';
import { baseSepolia } from 'wagmi/chains';
import { loadProfile, saveProfile } from '../game/systems/storage';
import { USE_TESTNET } from './wagmi';

/**
 * Optional profile linking via Base Account / SIWE.
 * Never auto-prompts. Purpose is always shown before connect/sign.
 */
export function OptionalWallet() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { connectAsync, connectors, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState(() => loadProfile());

  const chainId = USE_TESTNET ? baseSepolia.id : 8453;

  const handleConnect = useCallback(async () => {
    setError(null);
    setStatus(null);
    setBusy(true);
    try {
      const preferred =
        connectors.find((c) => c.id === 'baseAccount') ?? connectors[0];
      if (!preferred) throw new Error('No wallet connector available in this browser.');
      await connectAsync({ connector: preferred });
      setStatus('Wallet connected. Sign-in is still optional.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Connection rejected or failed.';
      setError(msg.includes('User rejected') || msg.includes('denied') ? 'Connection cancelled.' : msg);
    } finally {
      setBusy(false);
    }
  }, [connectAsync, connectors]);

  const handleSiwe = useCallback(async () => {
    if (!address) {
      setError('Connect a wallet first.');
      return;
    }
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const nonce = generateSiweNonce();
      const message = createSiweMessage({
        address,
        chainId,
        domain: window.location.host,
        nonce,
        uri: window.location.origin,
        version: '1',
        statement:
          'MOTH//LAMP optional profile link. This signature proves wallet ownership. No transaction. No fees. Gameplay is never gated.',
      });
      const signature = await signMessageAsync({ message });
      // Client-side profile only (no backend in this build). Store link locally.
      const next = {
        ...loadProfile(),
        displayName: `${address.slice(0, 6)}…${address.slice(-4)}`,
        address,
        linkedAt: new Date().toISOString(),
      };
      saveProfile(next);
      setProfile(next);
      setStatus(`Profile linked locally. Signature length ${signature.length}. No funds moved.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Signature failed.';
      setError(
        msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('denied')
          ? 'Signature cancelled. You can keep playing without linking.'
          : msg,
      );
    } finally {
      setBusy(false);
    }
  }, [address, chainId, signMessageAsync]);

  const handleDisconnect = () => {
    disconnect();
    setStatus('Wallet disconnected. Local scores remain on this device.');
  };

  if (isReconnecting) {
    return <p className="muted">Checking wallet session…</p>;
  }

  return (
    <div className="stack profile-card">
      <div>
        <strong>Base profile</strong>
        <span className="optional-badge">OPTIONAL</span>
      </div>
      <p className="muted">
        The entire game works without a wallet. Linking is only for a local identity label on
        high scores. No payments, NFTs, tokens, or onchain claims in this build.
      </p>

      <p className="muted">
        Local profile: <strong>{profile.displayName}</strong>
        <br />
        Runs {profile.runs} · Wins {profile.wins} · Best {profile.bestScore}
      </p>

      {!isConnected ? (
        <button
          type="button"
          className="btn"
          disabled={busy || isConnecting}
          onClick={() => void handleConnect()}
        >
          {busy || isConnecting ? 'Connecting…' : 'Connect Base / wallet (optional)'}
        </button>
      ) : (
        <>
          <p className="muted">
            Connected: <code>{address}</code>
          </p>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void handleSiwe()}>
            {busy ? 'Waiting for signature…' : 'Sign in to link profile (SIWE)'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={handleDisconnect}>
            Disconnect
          </button>
        </>
      )}

      {status && <p className="muted">{status}</p>}
      {error && <p className="error-text">{error}</p>}
      {connectError && <p className="error-text">{connectError.message}</p>}
    </div>
  );
}
