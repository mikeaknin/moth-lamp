/**
 * Central balance / tuning data for MOTH//LAMP.
 * Keep numbers here so designers can retune without hunting through systems.
 */

export const GAME = {
  title: 'MOTH//LAMP',
  tagline: 'Race the dark. Feed the lamp. Blast the haters.',
  width: 320,
  height: 180,
  targetFps: 60,
} as const;

export type DifficultyId = 'easy' | 'normal' | 'hard' | 'adaptive';

export interface DifficultyProfile {
  id: DifficultyId;
  label: string;
  description: string;
  lampDrainPerSec: number;
  enemyHpMult: number;
  enemyDamageMult: number;
  enemySpeedMult: number;
  spawnRateMult: number;
  scoreMult: number;
  glowRestoreMult: number;
  playerHitIFramesMs: number;
}

export const DIFFICULTIES: Record<DifficultyId, DifficultyProfile> = {
  easy: {
    id: 'easy',
    label: 'Firefly',
    description: 'Slower drain, softer enemies. Learn the patterns.',
    lampDrainPerSec: 0.55,
    enemyHpMult: 0.75,
    enemyDamageMult: 0.85,
    enemySpeedMult: 0.85,
    spawnRateMult: 0.8,
    scoreMult: 0.75,
    glowRestoreMult: 1.25,
    playerHitIFramesMs: 1400,
  },
  normal: {
    id: 'normal',
    label: 'Moth',
    description: 'The intended challenge. Fair, spicy, readable.',
    lampDrainPerSec: 0.85,
    enemyHpMult: 1,
    enemyDamageMult: 1,
    enemySpeedMult: 1,
    spawnRateMult: 1,
    scoreMult: 1,
    glowRestoreMult: 1,
    playerHitIFramesMs: 1100,
  },
  hard: {
    id: 'hard',
    label: 'Lamplight',
    description: 'Aggressive patterns. For moths with something to prove.',
    lampDrainPerSec: 1.15,
    enemyHpMult: 1.25,
    enemyDamageMult: 1.15,
    enemySpeedMult: 1.15,
    spawnRateMult: 1.2,
    scoreMult: 1.4,
    glowRestoreMult: 0.9,
    playerHitIFramesMs: 900,
  },
  adaptive: {
    id: 'adaptive',
    label: 'Adaptive',
    description: 'Starts gentle, tightens when you thrive, eases when you struggle.',
    lampDrainPerSec: 0.8,
    enemyHpMult: 1,
    enemyDamageMult: 1,
    enemySpeedMult: 1,
    spawnRateMult: 1,
    scoreMult: 1.1,
    glowRestoreMult: 1,
    playerHitIFramesMs: 1100,
  },
};

export const PLAYER = {
  maxHp: 3,
  /** Peak cruise speed (px/s) — easy to zip around the screen */
  speed: 138,
  /** How quickly the moth builds speed toward input */
  accel: 980,
  /** Air drag when holding a direction (higher = snappier stop of overshoot) */
  drag: 6.2,
  /** Stronger coasting friction when input released — still a soft glide */
  releaseDrag: 4.4,
  /** Tiny hover bob amplitude (px) while mostly still */
  hoverBobAmp: 1.6,
  hoverBobHz: 2.4,
  /** Visual lean while banking (degrees) */
  bankAngle: 14,
  /** Sprite display size (logical pixels) */
  spriteSize: 32,
  dashSpeed: 290,
  dashDurationMs: 180,
  dashCooldownMs: 780,
  dashIFramesMs: 240,
  fireCooldownMs: 150,
  bulletSpeed: 240,
  bulletDamage: 1,
  hitboxRadius: 5,
  startX: 52,
  startY: 90,
  boundsPadding: 10,
  /** Stick / keyboard response curve (<1 = more sensitive near center) */
  inputCurve: 0.72,
  stickDeadzone: 0.06,
} as const;

export const LAMP = {
  maxLife: 100,
  /** Soft floor for glow restore so pickups never fully top off late-game pressure */
  maxRestoreFromPickup: 14,
  warningThreshold: 30,
  criticalThreshold: 15,
  leechDrainPerSec: 4.5,
} as const;

export const SCORE = {
  baseEnemy: 100,
  bossHit: 25,
  bossKill: 5000,
  glowPickup: 50,
  powerupPickup: 75,
  comboWindowMs: 1800,
  maxCombo: 20,
  comboScoreStep: 0.15,
  survivalTickScore: 2,
  survivalTickMs: 1000,
  noDamageBonus: 1500,
  lampRemainingBonusPerPoint: 20,
} as const;

export const POWERUPS = {
  durationMs: {
    spread: 8000,
    rapid: 7000,
    shield: 6000,
    companion: 10000,
    pierce: 7500,
  },
  lampRefillAmount: 18,
  rapidFireCooldownMs: 70,
  companionFireCooldownMs: 280,
} as const;

export const SCROLL = {
  baseSpeed: 42,
  alleySpeed: 48,
  porchSpeed: 52,
  bossSpeed: 0,
} as const;

/** Approximate section timings for a 3–5 minute run */
export const SECTIONS = {
  backyard: { start: 0, end: 70, name: 'Moonlit Backyard', id: 'backyard' as const },
  alley: { start: 70, end: 150, name: 'Neon Alley', id: 'alley' as const },
  porch: { start: 150, end: 210, name: 'The Final Porch Lamp', id: 'porch' as const },
  boss: { start: 210, end: 9999, name: 'The Lamp Guardian', id: 'boss' as const },
};

export type SectionId = 'backyard' | 'alley' | 'porch' | 'boss';

export const MEDALS = {
  S: { minScore: 28000, lampMin: 40, label: 'S — Super Nova' },
  A: { minScore: 18000, lampMin: 25, label: 'A — Bright Wing' },
  B: { minScore: 10000, lampMin: 10, label: 'B — Warm Glow' },
  C: { minScore: 0, lampMin: 0, label: 'C — Made It' },
} as const;

export function getMedal(score: number, lampRemaining: number): keyof typeof MEDALS {
  if (score >= MEDALS.S.minScore && lampRemaining >= MEDALS.S.lampMin) return 'S';
  if (score >= MEDALS.A.minScore && lampRemaining >= MEDALS.A.lampMin) return 'A';
  if (score >= MEDALS.B.minScore && lampRemaining >= MEDALS.B.lampMin) return 'B';
  return 'C';
}
