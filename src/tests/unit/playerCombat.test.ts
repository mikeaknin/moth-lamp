import { describe, expect, it } from 'vitest';
import { PlayerCombat } from '../../game/systems/playerCombat';
import { PLAYER } from '../../game/data/balance';

describe('PlayerCombat', () => {
  it('takes damage and grants invulnerability', () => {
    const p = new PlayerCombat();
    const r = p.takeDamage(1000, 1, 1100);
    expect(r.damaged).toBe(true);
    expect(p.hp).toBe(PLAYER.maxHp - 1);
    expect(p.isInvulnerable(1500)).toBe(true);
    expect(p.takeDamage(1500, 1, 1100).damaged).toBe(false);
  });

  it('blocks with shield without HP loss', () => {
    const p = new PlayerCombat();
    p.grantShield();
    const r = p.takeDamage(1000, 1, 1100);
    expect(r.blocked).toBe(true);
    expect(r.damaged).toBe(false);
    expect(p.hp).toBe(PLAYER.maxHp);
    expect(p.hasShield).toBe(false);
  });

  it('dash sets cooldown and invuln', () => {
    const p = new PlayerCombat();
    expect(p.startDash(0)).toBe(true);
    expect(p.isDashing(50)).toBe(true);
    expect(p.canDash(100)).toBe(false);
    expect(p.dashCooldownRatio(0)).toBeLessThan(1);
    expect(p.dashCooldownRatio(PLAYER.dashCooldownMs)).toBe(1);
  });

  it('dies at zero HP', () => {
    const p = new PlayerCombat(1);
    const r = p.takeDamage(0, 1, 100);
    expect(r.died).toBe(true);
  });

  it('fire cooldown gating', () => {
    const p = new PlayerCombat();
    expect(p.canFire(0, 160)).toBe(true);
    p.markFired(0, 160);
    expect(p.canFire(100, 160)).toBe(false);
    expect(p.canFire(160, 160)).toBe(true);
  });
});
