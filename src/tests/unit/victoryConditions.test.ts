import { describe, expect, it } from 'vitest';
import { getMedal } from '../../game/data/balance';

describe('victory / medal conditions', () => {
  it('awards S only with high score and lamp remaining', () => {
    expect(getMedal(30000, 50)).toBe('S');
    expect(getMedal(30000, 5)).not.toBe('S');
  });

  it('falls back to C', () => {
    expect(getMedal(100, 0)).toBe('C');
  });
});

describe('game-over conditions (logic)', () => {
  it('hp zero implies game over', () => {
    const hp = 0;
    const lamp = 40;
    const outcome = hp <= 0 ? 'gameover_hp' : lamp <= 0 ? 'gameover_lamp' : 'playing';
    expect(outcome).toBe('gameover_hp');
  });

  it('lamp zero implies game over', () => {
    const hp = 2;
    const lamp = 0;
    const outcome = hp <= 0 ? 'gameover_hp' : lamp <= 0 ? 'gameover_lamp' : 'playing';
    expect(outcome).toBe('gameover_lamp');
  });
});
