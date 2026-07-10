# MOTH//LAMP

**Race the dark. Feed the lamp. Blast the haters.**

A mobile-first side-scrolling shooter built for release as a **standard web app** in the [Base App](https://base.app). You pilot a determined moth through a dangerous nighttime world toward a dying porch lamp — collecting glow, shredding fictional heckler-bugs, and defeating the Porchlight Tyrant before Lamp Life hits zero.

> Core gameplay is **fully playable without a wallet**. Optional Base Account linking never auto-prompts.

## Features

- 3–5 minute polished launch level: **Moonlit Backyard → Neon Alley → Final Porch Lamp → Boss**
- Smooth 8-direction flight, primary blaster, dash with i-frames
- 3-hit health, Lamp Life urgency timer, glow pickups, score + combo
- Enemy roster: Gnat Swarm, Mosquito Diver, Armored Beetle, Heckler Fly, Doom Wasp, Web Spinner, Lamp Leech
- Multi-phase **Porchlight Tyrant** boss with readable telegraphs
- Power-ups: Spread, Rapid, Glow Shield, Firefly Companion, Lamp Refill, Piercing Beam
- Pause / victory / game-over, fast restart, local high scores
- Interactive tutorial, difficulty + adaptive mode
- Desktop keyboard + mobile virtual stick (safe-area aware)
- Accessibility: reduced flash, screen-shake toggle, volume, high-contrast HUD, low-effects mode
- Optional Base profile (SIWE) — never required
- Procedural original pixel art + chiptune audio (no third-party game assets)

## Architecture

```
src/
  app/           React application shell
  game/
    scenes/      Phaser Boot + GameScene
    entities/    Player, enemies, bullets, boss
    systems/     Lamp, score, combat, powerups, storage, pooling
    data/        Balance, waves, palette, types
    effects/     Runtime pixel sprite factory
    audio/       Web Audio chiptune engine
  components/    HUD, touch controls, screens, canvas host
  base/          Optional wagmi / Base Account integration
  styles/        Mobile-first CSS + safe areas
  tests/         Vitest unit + Playwright e2e
```

- **React** owns menus, settings, Base UI, overlays
- **Phaser 3** owns rendering, physics, combat, audio cues, run state
- Balance lives in `src/game/data/*` for easy retuning and future levels

## Requirements

- Node.js 20+
- npm 10+

## Installation

```bash
cd moth-light
npm install
npm run generate:assets
```

## Local development

```bash
npm run dev
```

Open the printed local URL (default `http://localhost:5173`). Use browser device mode for mobile layouts.

## Testing

```bash
# Unit tests (logic)
npm run test:unit

# Typecheck
npm run typecheck

# Production build
npm run build

# Playwright (builds + previews automatically)
npx playwright install chromium   # first time
npm run test:e2e
```

## Production build

```bash
npm run build
npm run preview
```

Output is static files in `dist/` suitable for any HTTPS static host (Vercel, Netlify, Cloudflare Pages, S3+CloudFront, etc.).

## Deployment

1. Build `dist/`
2. Serve over **HTTPS** with SPA fallback to `index.html`
3. Set environment variables from `.env.example` at build time if needed
4. Confirm Content-Security-Policy headers if your host supports them (see `SECURITY.md`)
5. Register / update the app on [Base.dev](https://www.base.dev) (see `BASE_COMPLIANCE.md`)

### Suggested `vercel.json`

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

## Base testnet configuration

- Default chain for optional wallet: **Base Sepolia** (`VITE_USE_TESTNET=true`)
- RPC defaults: `https://sepolia.base.org`
- No smart contracts ship with this game
- Optional SIWE links a local profile only (no backend session server in this build)

## Base.dev registration steps

1. Deploy the HTTPS production URL
2. Open [Base.dev](https://www.base.dev) / Base Dashboard projects
3. Create a project and set **primary URL** to your deployment
4. Fill metadata (copy from `BASE_DEV_LISTING.md`): name, tagline, description, category, screenshots, icon
5. Note your **Builder Code** under Settings → Builder Codes
6. Optionally set `VITE_BUILDER_CODE` for attribution outside the Base App browser (Base App auto-appends for registered apps)
7. Complete any remaining dashboard verification steps shown in the UI

After **April 9, 2026**, the Base App treats apps as **standard web apps** — Farcaster manifests are not required.

## Environment variables

See `.env.example`.

| Variable | Purpose |
|----------|---------|
| `VITE_USE_TESTNET` | Prefer Base Sepolia (default true) |
| `VITE_BASE_SEPOLIA_RPC` | Custom Sepolia RPC |
| `VITE_BASE_RPC` | Custom mainnet RPC |
| `VITE_BUILDER_CODE` | Optional ERC-8021 attribution code |
| `VITE_WALLETCONNECT_PROJECT_ID` | Optional WC project id |

## Asset licensing

All runtime sprites and audio are **original** (procedural generation in-repo). See `ASSET_LICENSES.md`.

## Known limitations

- Single launch level (architecture ready for more)
- Optional SIWE is client-side local profile only (no remote leaderboard server)
- Chiptune is procedural Web Audio, not streamed tracker files
- Portrait play works but landscape is preferred
- No NFT / token / payment features (intentionally)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| No sound | Click/tap once — audio unlocks after user gesture |
| Blurry pixels | Ensure `pixelArt: true` (already set); avoid CSS blur filters on canvas |
| Black screen | Check console for WebGL errors; try another browser |
| Touch scroll while playing | `touch-action: none` is set; reopen if a parent style overrides |
| Wallet button errors | Expected in browsers without injected providers; gameplay unaffected |
| Build OOM | Increase Node memory: `NODE_OPTIONS=--max-old-space-size=4096 npm run build` |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production bundle |
| `npm run preview` | Serve `dist/` |
| `npm run test` | Vitest unit |
| `npm run test:e2e` | Playwright |
| `npm run generate:assets` | Icons / OG / splash PNGs |
| `npm run typecheck` | `tsc -b` |

## License

Original game content © project authors. Source provided for deployment of this title. Third-party libraries remain under their respective licenses (Phaser, React, wagmi, viem, etc.).
