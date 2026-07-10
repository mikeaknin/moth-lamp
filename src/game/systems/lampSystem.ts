import { LAMP } from '../data/balance';

/**
 * Lamp Life — the central urgency timer.
 * Pure logic extracted for unit testing.
 */
export class LampSystem {
  life: number;
  readonly maxLife: number;
  private leechCount = 0;
  private drainMult = 1;

  constructor(maxLife: number = LAMP.maxLife) {
    this.maxLife = maxLife;
    this.life = maxLife;
  }

  reset(): void {
    this.life = this.maxLife;
    this.leechCount = 0;
    this.drainMult = 1;
  }

  setDrainMultiplier(m: number): void {
    this.drainMult = Math.max(0.1, m);
  }

  addLeech(): void {
    this.leechCount += 1;
  }

  removeLeech(): void {
    this.leechCount = Math.max(0, this.leechCount - 1);
  }

  getLeechCount(): number {
    return this.leechCount;
  }

  /**
   * @param dtSec delta seconds
   * @param baseDrainPerSec difficulty base drain
   * @returns true if lamp is still lit
   */
  update(dtSec: number, baseDrainPerSec: number): boolean {
    const leech = this.leechCount * LAMP.leechDrainPerSec;
    const drain = (baseDrainPerSec * this.drainMult + leech) * dtSec;
    this.life = Math.max(0, this.life - drain);
    return this.life > 0;
  }

  /**
   * Restore lamp life with a hard cap per pickup.
   * @returns actual amount restored
   */
  restore(amount: number, restoreMult = 1): number {
    const capped = Math.min(LAMP.maxRestoreFromPickup, Math.max(0, amount) * restoreMult);
    const before = this.life;
    this.life = Math.min(this.maxLife, this.life + capped);
    return this.life - before;
  }

  /** Instant refill power-up — still respects a reasonable cap relative to max */
  refill(amount: number): number {
    const before = this.life;
    this.life = Math.min(this.maxLife, this.life + Math.max(0, amount));
    return this.life - before;
  }

  get ratio(): number {
    return this.life / this.maxLife;
  }

  get isWarning(): boolean {
    return this.life <= LAMP.warningThreshold && this.life > LAMP.criticalThreshold;
  }

  get isCritical(): boolean {
    return this.life <= LAMP.criticalThreshold;
  }

  get isDead(): boolean {
    return this.life <= 0;
  }
}

export function computeGlowRestore(base: number, mult: number): number {
  return Math.min(LAMP.maxRestoreFromPickup, Math.max(0, base) * mult);
}
