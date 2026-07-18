import type { SectionId } from './balance';

export type EnemyKind =
  | 'gnat'
  | 'mosquito'
  | 'beetle'
  | 'heckler'
  | 'doomWasp'
  | 'webSpinner'
  | 'lampLeech'
  | 'boss';

export interface EnemyDef {
  kind: EnemyKind;
  displayName: string;
  hp: number;
  speed: number;
  score: number;
  hitboxRadius: number;
  contactDamage: number;
  color: number;
  accent: number;
  /** Brief telegraph before attack (ms) */
  telegraphMs: number;
  description: string;
}

export const ENEMY_DEFS: Record<EnemyKind, EnemyDef> = {
  gnat: {
    kind: 'gnat',
    displayName: 'Gnat Swarmling',
    hp: 1,
    speed: 55,
    score: 80,
    hitboxRadius: 5,
    contactDamage: 1,
    color: 0x8bc34a,
    accent: 0xcddc39,
    telegraphMs: 0,
    description: 'Weak formation flyer. Pop them for combo fuel.',
  },
  mosquito: {
    kind: 'mosquito',
    displayName: 'Mosquito Diver',
    hp: 2,
    speed: 90,
    score: 140,
    hitboxRadius: 6,
    contactDamage: 1,
    color: 0xe91e63,
    accent: 0xff80ab,
    telegraphMs: 350,
    description: 'Telegraphs a dive, then streaks toward you.',
  },
  beetle: {
    kind: 'beetle',
    displayName: 'Armored Beetle',
    hp: 5,
    speed: 35,
    score: 220,
    hitboxRadius: 9,
    contactDamage: 1,
    color: 0x5d4037,
    accent: 0xbcaaa4,
    telegraphMs: 0,
    description: 'Tanky shell. Needs sustained fire.',
  },
  heckler: {
    kind: 'heckler',
    displayName: 'Heckler Fly',
    hp: 3,
    speed: 40,
    score: 180,
    hitboxRadius: 7,
    contactDamage: 1,
    color: 0x7e57c2,
    accent: 0xfff176,
    telegraphMs: 400,
    description: 'Fires hostile speech-bubble projectiles. Pure fiction energy.',
  },
  doomWasp: {
    kind: 'doomWasp',
    displayName: 'Doom Wasp',
    hp: 3,
    speed: 70,
    score: 200,
    hitboxRadius: 6,
    contactDamage: 1,
    color: 0xff9800,
    accent: 0xffeb3b,
    telegraphMs: 300,
    description: 'Aggressive ranged stinger shots in fan patterns.',
  },
  webSpinner: {
    kind: 'webSpinner',
    displayName: 'Web Spinner',
    hp: 4,
    speed: 30,
    score: 210,
    hitboxRadius: 8,
    contactDamage: 1,
    color: 0x90a4ae,
    accent: 0xeceff1,
    telegraphMs: 500,
    description: 'Spawns temporary sticky webs that slow movement.',
  },
  lampLeech: {
    kind: 'lampLeech',
    displayName: 'Lamp Leech',
    hp: 4,
    speed: 45,
    score: 250,
    hitboxRadius: 7,
    contactDamage: 1,
    color: 0x4a148c,
    accent: 0xea80fc,
    telegraphMs: 0,
    description: 'Drains Lamp Life until destroyed. Priority target!',
  },
  boss: {
    kind: 'boss',
    displayName: 'Porchlight Tyrant',
    hp: 120,
    speed: 40,
    score: 5000,
    hitboxRadius: 22,
    contactDamage: 1,
    color: 0x1a237e,
    accent: 0xffd54f,
    telegraphMs: 600,
    description: 'Three-phase lamp guardian. Readable, mean, fair.',
  },
};

export interface WaveEvent {
  /** Seconds into the level */
  t: number;
  section: SectionId;
  kind: EnemyKind;
  count: number;
  /** Vertical formation offset pattern */
  pattern?: 'line' | 'v' | 'scatter' | 'top' | 'bottom';
  /** Delay between spawns in the same event (ms) */
  spacingMs?: number;
}

/** Hand-authored wave timeline for the launch level (~3.5–4.5 min). */
export const WAVE_TIMELINE: WaveEvent[] = [
  // —— Moonlit Backyard (generous intro) ——
  { t: 2, section: 'backyard', kind: 'gnat', count: 3, pattern: 'line', spacingMs: 200 },
  { t: 6, section: 'backyard', kind: 'gnat', count: 4, pattern: 'v', spacingMs: 150 },
  { t: 12, section: 'backyard', kind: 'mosquito', count: 1 },
  { t: 16, section: 'backyard', kind: 'gnat', count: 5, pattern: 'scatter', spacingMs: 120 },
  { t: 22, section: 'backyard', kind: 'beetle', count: 1 },
  { t: 28, section: 'backyard', kind: 'mosquito', count: 2, pattern: 'line', spacingMs: 600 },
  { t: 34, section: 'backyard', kind: 'heckler', count: 1 },
  { t: 40, section: 'backyard', kind: 'gnat', count: 6, pattern: 'v', spacingMs: 100 },
  { t: 46, section: 'backyard', kind: 'beetle', count: 1 },
  { t: 50, section: 'backyard', kind: 'mosquito', count: 2, spacingMs: 400 },
  { t: 55, section: 'backyard', kind: 'lampLeech', count: 1 },
  { t: 60, section: 'backyard', kind: 'heckler', count: 1 },
  { t: 64, section: 'backyard', kind: 'gnat', count: 8, pattern: 'scatter', spacingMs: 80 },

  // —— Neon Alley ——
  { t: 72, section: 'alley', kind: 'doomWasp', count: 1 },
  { t: 76, section: 'alley', kind: 'gnat', count: 5, pattern: 'line', spacingMs: 100 },
  { t: 82, section: 'alley', kind: 'heckler', count: 2, spacingMs: 800 },
  { t: 88, section: 'alley', kind: 'webSpinner', count: 1 },
  { t: 94, section: 'alley', kind: 'mosquito', count: 3, spacingMs: 350 },
  { t: 100, section: 'alley', kind: 'doomWasp', count: 2, spacingMs: 700 },
  { t: 106, section: 'alley', kind: 'beetle', count: 2, spacingMs: 900 },
  { t: 112, section: 'alley', kind: 'lampLeech', count: 1 },
  { t: 118, section: 'alley', kind: 'heckler', count: 2, spacingMs: 500 },
  { t: 124, section: 'alley', kind: 'webSpinner', count: 1 },
  { t: 128, section: 'alley', kind: 'gnat', count: 10, pattern: 'v', spacingMs: 70 },
  { t: 134, section: 'alley', kind: 'doomWasp', count: 2, spacingMs: 400 },
  { t: 140, section: 'alley', kind: 'mosquito', count: 3, spacingMs: 300 },
  { t: 145, section: 'alley', kind: 'lampLeech', count: 1 },

  // —— Final Porch ——
  { t: 152, section: 'porch', kind: 'beetle', count: 2, spacingMs: 600 },
  { t: 158, section: 'porch', kind: 'doomWasp', count: 2, spacingMs: 500 },
  { t: 164, section: 'porch', kind: 'heckler', count: 2, spacingMs: 400 },
  { t: 170, section: 'porch', kind: 'webSpinner', count: 2, spacingMs: 800 },
  { t: 176, section: 'porch', kind: 'lampLeech', count: 2, spacingMs: 1000 },
  { t: 182, section: 'porch', kind: 'mosquito', count: 4, spacingMs: 250 },
  { t: 188, section: 'porch', kind: 'doomWasp', count: 3, spacingMs: 400 },
  { t: 194, section: 'porch', kind: 'gnat', count: 12, pattern: 'scatter', spacingMs: 60 },
  { t: 200, section: 'porch', kind: 'beetle', count: 2, spacingMs: 500 },
  { t: 205, section: 'porch', kind: 'lampLeech', count: 1 },

  // Boss at 210s is spawned by BossSystem, not wave timeline
];

export const HECKLER_BUBBLES = [
  'LOL',
  'NOPE',
  'SKILL?',
  'zzz',
  'RATIO',
  'CRINGE',
  'BOOO',
  'MID',
] as const;

export type BossId = 'briar' | 'neon' | 'tyrant';

export interface StageBossDef {
  id: BossId;
  /** Elapsed seconds when this boss appears (after prior stage waves) */
  t: number;
  displayName: string;
  banner: string;
  section: SectionId;
  /** True = defeating wins the run */
  final: boolean;
  hp: number;
  /** Texture prefix: boss_briar_0, boss_neon_0, boss_tyrant_0 */
  tex: string;
  score: number;
}

/**
 * Three real stage bosses — one at the end of each zone.
 * Not a continuous filler fight; discrete NES-style bosses.
 */
export const STAGE_BOSSES: StageBossDef[] = [
  {
    id: 'briar',
    t: 66,
    displayName: 'Briar Colossus',
    banner: 'BOSS 1 — BRIAR COLOSSUS',
    section: 'backyard',
    final: false,
    hp: 55,
    tex: 'boss_briar',
    score: 2000,
  },
  {
    id: 'neon',
    t: 148,
    displayName: 'Neon Overlord',
    banner: 'BOSS 2 — NEON OVERLORD',
    section: 'alley',
    final: false,
    hp: 80,
    tex: 'boss_neon',
    score: 3500,
  },
  {
    id: 'tyrant',
    t: 210,
    displayName: 'Porchlight Tyrant',
    banner: 'FINAL BOSS — PORCHLIGHT TYRANT',
    section: 'boss',
    final: true,
    hp: 130,
    tex: 'boss_tyrant',
    score: 5000,
  },
];

export const BOSS = {
  phases: [
    {
      id: 1,
      hpRatio: 1,
      name: 'Flicker',
      bulletIntervalMs: 820,
      pattern: 'single' as const,
      moveAmp: 30,
    },
    {
      id: 2,
      hpRatio: 0.66,
      name: 'Buzzkill',
      bulletIntervalMs: 600,
      pattern: 'fan' as const,
      moveAmp: 42,
    },
    {
      id: 3,
      hpRatio: 0.33,
      name: 'Blackout',
      bulletIntervalMs: 440,
      pattern: 'spiral' as const,
      moveAmp: 54,
    },
  ],
  introHoldMs: 1400,
  vulnerableAfterTelegraphMs: 380,
  hpBonus: 0,
};
