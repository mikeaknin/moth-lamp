# BASE_COMPLIANCE.md

**Documentation checked:** 2026-07-09  

## Official pages consulted

| Page | URL |
|------|-----|
| Build an app on Base | https://docs.base.org/apps/ |
| Apps index / llms index | https://docs.base.org/llms.txt |
| Migrate to a Standard Web App | https://docs.base.org/apps/guides/migrate-to-standard-web-app |
| Base Account overview | https://docs.base.org/base-account/ |
| Authenticate users (SIWE) | https://docs.base.org/base-account/guides/authenticate-users |
| Sign in with Base (wagmi) | https://docs.base.org/base-account/framework-integrations/wagmi/sign-in-with-base |
| Builder Codes for app developers | https://docs.base.org/apps/builder-codes/app-developers |
| Base Builder Codes overview | https://docs.base.org/apps/builder-codes/builder-codes |
| Base.dev / dashboard | https://www.base.dev/ → redirects to https://dashboard.base.org/ |
| Notifications (optional) | https://docs.base.org/apps/technical-guides/base-notifications |

## Requirements discovered (current)

1. **Standard web app model**  
   After **April 9, 2026**, the Base App treats all apps as standard web apps regardless of Farcaster manifests. No Farcaster mini-app SDK methods are required or invoked.

2. **Recommended stack for wallet/auth**  
   wagmi + viem + React Query + `@base-org/account` (Base Account connector). Authentication where needed: **Sign-In with Ethereum (SIWE)**.

3. **Deprecated in Base App**  
   Farcaster SDK methods (`signIn`, `ready`, `addMiniApp`, `composeCast`, FID context, etc.) — **not used** in this project.

4. **Registration**  
   Create a project on **Base.dev / Base Dashboard**, complete app metadata: name, icon, tagline, description, screenshots, category, **primary URL**, and **builder code**.

5. **Builder Codes**  
   Inside the Base App browser, registered apps get automatic attribution. Outside Base App, integrate `dataSuffix` (ERC-8021 via `ox`) when sending onchain txs. This game sends **no required transactions**.

6. **Notifications** (optional)  
   Wallet-address notifications via Base Dashboard API — not required for a pure client game.

7. **Manifest**  
   Official migration guide: **no Farcaster manifest required** for standard web apps.

## How this project satisfies requirements

| Requirement | Implementation |
|-------------|----------------|
| Standard web app | Vite SPA, mobile-friendly, HTTPS deployable |
| No Farcaster SDK | Not depended on |
| Optional wallet | wagmi + `baseAccount` + injected; profile screen only |
| No auto wallet prompt | Connect only on user click in Profile |
| SIWE pattern | Optional SIWE message with clear statement |
| Playable without wallet | Default path never touches wallet APIs for gameplay |
| Metadata ready | `BASE_DEV_LISTING.md`, icons, screenshots placeholders |
| Builder code | Env `VITE_BUILDER_CODE` documented; no txs required |
| Privacy / Terms | In-app pages + `PRIVACY.md` / `TERMS.md` |
| Testnet | Base Sepolia default for optional wallet |

## Remaining manual registration steps

1. Deploy `dist/` to an HTTPS origin you control.  
2. Sign in to [Base.dev / dashboard.base.org](https://dashboard.base.org/).  
3. Create project → set primary URL.  
4. Upload icon (192/512), screenshots, paste listing copy from `BASE_DEV_LISTING.md`.  
5. Copy Builder Code into `.env` if you later add onchain txs outside Base App.  
6. Complete any in-dashboard review/verification checklists presented by Base (UI-driven; not fully enumerated in public docs).  
7. Smoke-test inside the Base App in-app browser on a physical phone.

## Unresolved / ambiguous items

- Exact Base.dev form field names and review SLAs are **dashboard UI** details and may change; follow the live dashboard.  
- Whether future “app verification” badges require additional legal docs is not fully specified beyond providing privacy/terms URLs — placeholders provided.  
- `www.base.dev` redirects to `dashboard.base.org`; both referenced in docs interchangeably.  
- No public requirement found for a specific `/.well-known` app manifest for standard web apps post–April 9, 2026.

## Conflicts noted

None material. Migration guide is treated as authoritative for Base App distribution after April 9, 2026. Older third-party “Base miniapp / Farcaster frame” tutorials are **ignored**.

## Pre-submission checklist

- [ ] Production build succeeds (`npm run build`)  
- [ ] Site served over HTTPS  
- [ ] Title, Play, Settings, Privacy, Terms reachable  
- [ ] Game playable without wallet  
- [ ] No wallet modal on cold load  
- [ ] Icons + screenshots uploaded  
- [ ] Privacy & Terms URLs set on Base.dev  
- [ ] Category + keywords filled  
- [ ] Builder Code noted  
- [ ] Tested in Base App mobile browser  
- [ ] Content is fiction-only, no copyrighted assets  
- [ ] No token/NFT/pay-to-win claims  

**Status:** Engineering compliance complete; **human** Base.dev registration remains.
