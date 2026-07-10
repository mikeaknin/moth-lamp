import { describe, expect, it } from 'vitest';
import { PowerUpSystem, isPowerUpExpired } from '../../game/systems/powerupSystem';

describe('PowerUpSystem', () => {
  it('tracks timed power-ups and expiration', () => {
    const p = new PowerUpSystem();
    p.apply('spread', 0);
    expect(p.has('spread', 100)).toBe(true);
    p.update(99999);
    expect(p.has('spread', 99999)).toBe(false);
  });

  it('rapid fire shortens cooldown', () => {
    const p = new PowerUpSystem();
    expect(p.fireCooldown(0)).toBe(160);
    p.apply('rapid', 0);
    expect(p.fireCooldown(10)).toBeLessThan(160);
  });

  it('lamp refill is instant', () => {
    const p = new PowerUpSystem();
    const r = p.apply('lampRefill', 0);
    expect(r.instant).toBe(true);
    expect(r.amount).toBeGreaterThan(0);
  });

  it('isPowerUpExpired helper', () => {
    expect(isPowerUpExpired(100, 50)).toBe(true);
    expect(isPowerUpExpired(10, 50)).toBe(false);
  });
});
