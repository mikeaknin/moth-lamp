# SECURITY.md

## Principles

- No client-side secrets or private keys  
- No automatic wallet prompts  
- No unlimited token approvals (no spend features)  
- Optional SIWE only after explicit user action with a clear statement  
- Local-only scores by default (no remote score API to spoof yet)

## Implemented safeguards

| Area | Detail |
|------|--------|
| Secrets | Only public `VITE_*` config; no server keys in repo |
| XSS | React text rendering; no `dangerouslySetInnerHTML` |
| Wallet | Optional module; rejection handled gracefully |
| CSP | Suggested headers below for host configuration |
| Dependencies | Pin major libs; run `npm audit` before release |
| Storage | localStorage JSON parse guarded with fallbacks |

## Suggested Content-Security-Policy (deploy host)

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'self' https://sepolia.base.org https://mainnet.base.org https://*.base.org https://*.coinbase.com wss: https:;
media-src 'self' blob:;
worker-src 'self' blob:;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

Tune `connect-src` for your RPC / wallet endpoints.

## If adding a remote leaderboard later

- Validate scores server-side (never trust client score alone)  
- Rate-limit submissions per IP / address  
- Prefer signed sessions after SIWE with server-issued nonces  
- Reject impossible scores (time vs. max theoretical)

## Smart contracts

**None** in this release. If introduced later:

1. Minimal surface  
2. Testnet first  
3. External audit for mainnet value  
4. Clear user-facing transaction previews  

## Reporting

Replace with a real security contact before public launch: `security@example.com`
