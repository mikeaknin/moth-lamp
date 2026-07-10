import { describe, expect, it } from 'vitest';
import { LampSystem, computeGlowRestore } from '../../game/systems/lampSystem';
import { LAMP } from '../../game/data/balance';

describe('LampSystem', () => {
  it('counts down lamp life over time', () => {
    const lamp = new LampSystem(100);
    lamp.update(1, 10);
    expect(lamp.life).toBeCloseTo(90, 5);
  });

  it('reaches zero and reports dead', () => {
    const lamp = new LampSystem(10);
    const alive = lamp.update(2, 10);
    expect(alive).toBe(false);
    expect(lamp.isDead).toBe(true);
  });

  it('restores with a hard cap per pickup', () => {
    const lamp = new LampSystem(100);
    lamp.life = 50;
    const restored = lamp.restore(100, 1);
    expect(restored).toBeLessThanOrEqual(LAMP.maxRestoreFromPickup);
    expect(lamp.life).toBe(50 + restored);
  });

  it('never restores above max', () => {
    const lamp = new LampSystem(100);
    lamp.life = 95;
    lamp.restore(50, 1);
    expect(lamp.life).toBeLessThanOrEqual(100);
  });

  it('applies leech drain until leeches removed', () => {
    const lamp = new LampSystem(100);
    lamp.addLeech();
    lamp.addLeech();
    lamp.update(1, 0);
    expect(lamp.life).toBeCloseTo(100 - LAMP.leechDrainPerSec * 2, 5);
    lamp.removeLeech();
    lamp.removeLeech();
    const after = lamp.life;
    lamp.update(1, 0);
    expect(lamp.life).toBeCloseTo(after, 5);
  });

  it('computeGlowRestore respects cap', () => {
    expect(computeGlowRestore(100, 2)).toBe(LAMP.maxRestoreFromPickup);
    expect(computeGlowRestore(5, 1)).toBe(5);
  });
});
