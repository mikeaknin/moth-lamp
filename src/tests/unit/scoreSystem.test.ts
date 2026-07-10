import { describe, expect, it } from 'vitest';
import { ScoreSystem, calcKillScore, comboMultiplier } from '../../game/systems/scoreSystem';

describe('ScoreSystem', () => {
  it('builds combo within window', () => {
    const s = new ScoreSystem();
    s.onEnemyKill(100, 0);
    expect(s.combo).toBe(1);
    s.onEnemyKill(100, 500);
    expect(s.combo).toBe(2);
    expect(s.maxCombo).toBe(2);
  });

  it('resets combo after window', () => {
    const s = new ScoreSystem();
    s.onEnemyKill(100, 0);
    s.onEnemyKill(100, 5000);
    expect(s.combo).toBe(1);
  });

  it('calcKillScore multiplies by combo', () => {
    const base = calcKillScore(100, 1, 1);
    const combod = calcKillScore(100, 5, 1);
    expect(combod).toBeGreaterThan(base);
    expect(comboMultiplier(0)).toBe(1);
  });

  it('applies end bonuses', () => {
    const s = new ScoreSystem();
    s.score = 1000;
    const bonus = s.applyEndBonuses({ lampRemaining: 50, damageTaken: 0, scoreMult: 1 });
    expect(bonus).toBeGreaterThan(0);
    expect(s.score).toBe(1000 + bonus);
  });
});
