# ASSET_LICENSES.md

## Original project assets

| Asset class | Source | License |
|-------------|--------|---------|
| Pixel sprites (moth, enemies, boss, bullets, UI) | Hand-authored 16-bit PNG sheets via `scripts/generate-sprites.mjs` → `public/assets/sprites/`; runtime fallback in `SpriteFactory.ts` | Original for this project |
| Background tiles / neon / fence / lamp | Same factory | Original |
| Icons, OG image, splash, screenshot placeholders | `scripts/generate-assets.mjs` | Original |
| Music & SFX | Procedural Web Audio in `src/game/audio/AudioEngine.ts` | Original melodies/timbres — not copies of commercial OSTs |
| Game name MOTH//LAMP, enemy names, copy | Project writing | Original |

## Third-party libraries (not game content)

Shipped under their own OSS licenses via npm:

- Phaser 3  
- React / React DOM  
- Vite  
- wagmi / viem / @tanstack/react-query / @base-org/account  
- Vitest / Playwright (dev)

## Not used

- No ripped commercial game sprites  
- No copyrighted music transcriptions  
- No trademarked character likenesses  
- No real-person imagery  

## Attribution note

If you replace procedural art with hand-drawn sheets, document the artist and license here before redistribution.
