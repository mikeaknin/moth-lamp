import { PLAYER } from '../data/balance';

/**
 * Pure player combat state — dash, invuln, health.
 */
export class PlayerCombat {
  hp: number;
  readonly maxHp: number;
  invulnUntil = 0;
  dashCooldownUntil = 0;
  dashUntil = 0;
  hasShield = false;
  private fireReadyAt = 0;

  constructor(maxHp: number = PLAYER.maxHp) {
    this.maxHp = maxHp;
    this.hp = maxHp;
  }

  reset(): void {
    this.hp = this.maxHp;
    this.invulnUntil = 0;
    this.dashCooldownUntil = 0;
    this.dashUntil = 0;
    this.hasShield = false;
    this.fireReadyAt = 0;
  }

  isInvulnerable(nowMs: number): boolean {
    return nowMs < this.invulnUntil || this.isDashing(nowMs);
  }

  isDashing(nowMs: number): boolean {
    return nowMs < this.dashUntil;
  }

  canDash(nowMs: number): boolean {
    return nowMs >= this.dashCooldownUntil && !this.isDashing(nowMs);
  }

  startDash(nowMs: number): boolean {
    if (!this.canDash(nowMs)) return false;
    this.dashUntil = nowMs + PLAYER.dashDurationMs;
    this.dashCooldownUntil = nowMs + PLAYER.dashCooldownMs;
    this.invulnUntil = Math.max(this.invulnUntil, nowMs + PLAYER.dashIFramesMs);
    return true;
  }

  dashCooldownRatio(nowMs: number): number {
    if (nowMs >= this.dashCooldownUntil) return 1;
    const remaining = this.dashCooldownUntil - nowMs;
    return 1 - remaining / PLAYER.dashCooldownMs;
  }

  canFire(nowMs: number, _cooldownMs?: number): boolean {
    return nowMs >= this.fireReadyAt;
  }

  markFired(nowMs: number, cooldownMs: number): void {
    this.fireReadyAt = nowMs + cooldownMs;
  }

  /**
   * Apply damage. Returns true if HP changed (or shield absorbed).
   */
  takeDamage(nowMs: number, amount: number, iFrameMs: number): {
    blocked: boolean;
    damaged: boolean;
    died: boolean;
  } {
    if (this.isInvulnerable(nowMs)) {
      return { blocked: true, damaged: false, died: false };
    }
    if (this.hasShield) {
      this.hasShield = false;
      this.invulnUntil = nowMs + iFrameMs * 0.5;
      return { blocked: true, damaged: false, died: false };
    }
    this.hp = Math.max(0, this.hp - amount);
    this.invulnUntil = nowMs + iFrameMs;
    return { blocked: false, damaged: true, died: this.hp <= 0 };
  }

  grantShield(): void {
    this.hasShield = true;
  }
}
