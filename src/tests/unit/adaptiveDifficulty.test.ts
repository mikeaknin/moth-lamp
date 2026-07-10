import { describe, expect, it } from 'vitest';
import { AdaptiveDifficulty } from '../../game/systems/adaptiveDifficulty';

describe('AdaptiveDifficulty', () => {
  it('returns static profile for non-adaptive modes', () => {
    const a = new AdaptiveDifficulty('hard');
    const before = a.profile.lampDrainPerSec;
    a.onDamage();
    a.update(20);
    expect(a.profile.lampDrainPerSec).toBe(before);
  });

  it('eases after repeated damage in adaptive mode', () => {
    const a = new AdaptiveDifficulty('adaptive');
    const base = a.profile.spawnRateMult;
    a.onDamage();
    a.onDamage();
    a.update(12);
    expect(a.getBias()).toBeLessThan(0);
    expect(a.profile.spawnRateMult).toBeLessThanOrEqual(base);
  });
});
