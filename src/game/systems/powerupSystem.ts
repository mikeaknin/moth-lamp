import { POWERUPS } from '../data/balance';
import type { ActivePowerUp, PowerUpKind } from '../data/types';

export class PowerUpSystem {
  private active = new Map<string, number>();

  reset(): void {
    this.active.clear();
  }

  apply(kind: PowerUpKind, nowMs: number): { instant: boolean; amount?: number } {
    if (kind === 'lampRefill') {
      return { instant: true, amount: POWERUPS.lampRefillAmount };
    }
    const duration = POWERUPS.durationMs[kind];
    const expires = nowMs + duration;
    const prev = this.active.get(kind) ?? 0;
    this.active.set(kind, Math.max(prev, expires));
    if (kind === 'shield') {
      // shield is also a flag on player; duration is visual window
    }
    return { instant: false };
  }

  update(nowMs: number): void {
    for (const [k, exp] of this.active) {
      if (nowMs >= exp) this.active.delete(k);
    }
  }

  has(kind: Exclude<PowerUpKind, 'lampRefill'>, nowMs: number): boolean {
    const exp = this.active.get(kind);
    return !!exp && nowMs < exp;
  }

  list(nowMs: number): ActivePowerUp[] {
    const out: ActivePowerUp[] = [];
    for (const [kind, expiresAt] of this.active) {
      if (nowMs < expiresAt && kind !== 'lampRefill') {
        out.push({ kind: kind as ActivePowerUp['kind'], expiresAt });
      }
    }
    return out;
  }

  fireCooldown(nowMs: number): number {
    if (this.has('rapid', nowMs)) return POWERUPS.rapidFireCooldownMs;
    return 160; // PLAYER.fireCooldownMs mirrored to avoid circular import in tests
  }

  isExpired(_kind: string, nowMs: number, expiresAt: number): boolean {
    return nowMs >= expiresAt;
  }
}

export function isPowerUpExpired(nowMs: number, expiresAt: number): boolean {
  return nowMs >= expiresAt;
}
