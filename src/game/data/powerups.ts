export type PowerUpKind =
  | 'spread'
  | 'rapid'
  | 'shield'
  | 'companion'
  | 'lampRefill'
  | 'pierce';

export interface PowerUpDef {
  kind: PowerUpKind;
  label: string;
  color: number;
  description: string;
  /** Instant effect (no timer) */
  instant?: boolean;
}

export const POWERUP_DEFS: Record<PowerUpKind, PowerUpDef> = {
  spread: {
    kind: 'spread',
    label: 'Spread Shot',
    color: 0x4fc3f7,
    description: 'Triple-angle light bolts.',
  },
  rapid: {
    kind: 'rapid',
    label: 'Rapid Fire',
    color: 0xff7043,
    description: 'Blaster goes brrrr.',
  },
  shield: {
    kind: 'shield',
    label: 'Glow Shield',
    color: 0x69f0ae,
    description: 'Absorbs one hit.',
  },
  companion: {
    kind: 'companion',
    label: 'Firefly Companion',
    color: 0xffee58,
    description: 'A tiny wingman that shoots along.',
  },
  lampRefill: {
    kind: 'lampRefill',
    label: 'Lamp-Life Refill',
    color: 0xfff59d,
    description: 'Emergency light for the porch lamp.',
    instant: true,
  },
  pierce: {
    kind: 'pierce',
    label: 'Piercing Beam',
    color: 0xea80fc,
    description: 'Shots pass through enemies.',
  },
};

/** Weighted drop table after enemy kills */
export const POWERUP_DROP_WEIGHTS: { kind: PowerUpKind; weight: number }[] = [
  { kind: 'spread', weight: 18 },
  { kind: 'rapid', weight: 18 },
  { kind: 'shield', weight: 14 },
  { kind: 'companion', weight: 12 },
  { kind: 'lampRefill', weight: 16 },
  { kind: 'pierce', weight: 12 },
];

export const POWERUP_DROP_CHANCE = 0.12;
