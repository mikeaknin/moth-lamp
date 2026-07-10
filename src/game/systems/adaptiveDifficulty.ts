import type { DifficultyId, DifficultyProfile } from '../data/balance';
import { DIFFICULTIES } from '../data/balance';

/**
 * Adaptive difficulty gently scales spawn/drain based on recent performance.
 */
export class AdaptiveDifficulty {
  private damageRecent = 0;
  private killsRecent = 0;
  private windowSec = 0;
  private bias = 0; // -1 ease … +1 harden
  readonly base: DifficultyProfile;
  readonly mode: DifficultyId;

  constructor(mode: DifficultyId) {
    this.mode = mode;
    this.base = { ...DIFFICULTIES[mode === 'adaptive' ? 'normal' : mode] };
  }

  onDamage(): void {
    this.damageRecent += 1;
  }

  onKill(): void {
    this.killsRecent += 1;
  }

  update(dtSec: number): void {
    if (this.mode !== 'adaptive') return;
    this.windowSec += dtSec;
    if (this.windowSec < 12) return;
    this.windowSec = 0;

    if (this.damageRecent >= 2) {
      this.bias = Math.max(-0.35, this.bias - 0.12);
    } else if (this.killsRecent >= 8 && this.damageRecent === 0) {
      this.bias = Math.min(0.35, this.bias + 0.1);
    } else if (this.killsRecent <= 2) {
      this.bias = Math.max(-0.2, this.bias - 0.05);
    }

    this.damageRecent = 0;
    this.killsRecent = 0;
  }

  get profile(): DifficultyProfile {
    if (this.mode !== 'adaptive') return this.base;
    const b = this.bias;
    return {
      ...this.base,
      lampDrainPerSec: this.base.lampDrainPerSec * (1 + b * 0.25),
      enemyHpMult: this.base.enemyHpMult * (1 + b * 0.2),
      enemySpeedMult: this.base.enemySpeedMult * (1 + b * 0.15),
      spawnRateMult: this.base.spawnRateMult * (1 + b * 0.2),
      glowRestoreMult: this.base.glowRestoreMult * (1 - b * 0.1),
    };
  }

  getBias(): number {
    return this.bias;
  }
}
