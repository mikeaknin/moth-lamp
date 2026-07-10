# MOTH//LAMP — Game Design Document

## Title selection

Working title **MOTH//LAMP** retained.

Alternatives considered:

1. **Lumen Moth** — clear but softer
2. **Glowbound** — punchy, less literal
3. **Porch Run** — cute, less stylish

**Selected: MOTH//LAMP** — distinctive, stylish, readable in Base.dev listings, matches the central lamp tension.

## Fantasy & tone

Energetic, funny, stylish, slightly chaotic, self-aware. Fiction-only enemies (Heckler Flies, Doom Wasps, etc.). No real people, politics, or protected-group stereotypes.

## Core loop

1. Auto-scroll through night world  
2. Dodge / shoot / dash  
3. Collect glow to slow the lamp’s death  
4. Escalate through three sections  
5. Defeat Porchlight Tyrant  
6. Rank medal from score + lamp remaining  

## Win / lose

| Outcome | Condition |
|---------|-----------|
| Victory | Boss defeated with HP > 0 and Lamp Life > 0 |
| Game over (HP) | Player HP reaches 0 |
| Game over (Lamp) | Lamp Life reaches 0 |

## Level flow (~3.5–4.5 min typical)

| Section | Time (s) | Feel |
|---------|----------|------|
| Moonlit Backyard | 0–70 | Generous intro, teach patterns |
| Neon Alley | 70–150 | Neon hazards, denser ranged |
| Final Porch | 150–210 | Priority leeches, pressure |
| Boss | 210+ | Three readable phases |

## Player

- Max HP: 3  
- Dash: 160ms, 900ms CD, brief invuln  
- Primary shot + power-up variants  
- Hit i-frames on damage  

## Lamp Life

- Starts at 100  
- Drains continuously (difficulty-scaled)  
- Lamp Leeches add extra drain while alive  
- Glow restore capped per pickup (`maxRestoreFromPickup`) so skill still matters  

## Enemies (fiction)

See `src/game/data/enemies.ts` for stats and telegraphs.

## Boss — Porchlight Tyrant

1. **Flicker** — single aimed shots, modest movement  
2. **Buzzkill** — fan patterns, wider orbit  
3. **Blackout** — spiral rings, fastest cadence  

All phases telegraph with tint before firing. Contact damage is avoidable by positioning; no unavoidable full-screen hits.

## Difficulty

- Firefly (easy) / Moth (normal) / Lamplight (hard) / Adaptive  

## Future levels

`WAVE_TIMELINE` + `SECTIONS` + scene data separation allow additional level packs without rewriting combat systems.

## UX pillars

- Objective understandable in <10 seconds  
- Fair telegraphs  
- Fast restart  
- Mobile-first controls with ≥44–52px targets  
