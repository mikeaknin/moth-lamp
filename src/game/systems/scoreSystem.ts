import { SCORE } from '../data/balance';

export class ScoreSystem {
  score = 0;
  combo = 0;
  maxCombo = 0;
  private lastKillAt = 0;
  private survivalAcc = 0;

  reset(): void {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.lastKillAt = 0;
    this.survivalAcc = 0;
  }

  private comboMultiplier(): number {
    return 1 + Math.min(this.combo, SCORE.maxCombo) * SCORE.comboScoreStep;
  }

  addRaw(points: number, scoreMult = 1): number {
    const gained = Math.round(points * scoreMult);
    this.score += gained;
    return gained;
  }

  onEnemyKill(baseScore: number, nowMs: number, scoreMult = 1): number {
    if (nowMs - this.lastKillAt <= SCORE.comboWindowMs) {
      this.combo = Math.min(SCORE.maxCombo, this.combo + 1);
    } else {
      this.combo = 1;
    }
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.lastKillAt = nowMs;
    const gained = Math.round(baseScore * this.comboMultiplier() * scoreMult);
    this.score += gained;
    return gained;
  }

  onPickup(base: number, scoreMult = 1): number {
    return this.addRaw(base, scoreMult);
  }

  tickSurvival(dtSec: number, scoreMult = 1): number {
    this.survivalAcc += dtSec * 1000;
    let gained = 0;
    while (this.survivalAcc >= SCORE.survivalTickMs) {
      this.survivalAcc -= SCORE.survivalTickMs;
      gained += this.addRaw(SCORE.survivalTickScore, scoreMult);
    }
    return gained;
  }

  /** Decay combo when idle */
  update(nowMs: number): void {
    if (this.combo > 0 && nowMs - this.lastKillAt > SCORE.comboWindowMs) {
      this.combo = 0;
    }
  }

  applyEndBonuses(opts: {
    lampRemaining: number;
    damageTaken: number;
    scoreMult: number;
  }): number {
    let bonus = 0;
    bonus += Math.round(opts.lampRemaining * SCORE.lampRemainingBonusPerPoint * opts.scoreMult);
    if (opts.damageTaken === 0) {
      bonus += Math.round(SCORE.noDamageBonus * opts.scoreMult);
    }
    this.score += bonus;
    return bonus;
  }
}

export function comboMultiplier(combo: number): number {
  return 1 + Math.min(Math.max(0, combo), SCORE.maxCombo) * SCORE.comboScoreStep;
}

export function calcKillScore(base: number, combo: number, mult = 1): number {
  return Math.round(base * comboMultiplier(combo) * mult);
}
