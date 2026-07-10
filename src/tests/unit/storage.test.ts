import { describe, expect, it, beforeEach } from 'vitest';
import {
  recoverSettings,
  mergeHighScores,
  clampVolume,
} from '../../game/systems/storage';
import { DEFAULT_SETTINGS } from '../../game/data/types';

describe('storage helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('clamps volumes', () => {
    expect(clampVolume(-1)).toBe(0);
    expect(clampVolume(2)).toBe(1);
    expect(clampVolume(0.4)).toBe(0.4);
  });

  it('recovers corrupted settings', () => {
    expect(recoverSettings(null)).toEqual(DEFAULT_SETTINGS);
    const recovered = recoverSettings({ musicVolume: 9, screenShake: false });
    expect(recovered.musicVolume).toBe(1);
    expect(recovered.screenShake).toBe(false);
  });

  it('merges high scores sorted and capped', () => {
    const list = mergeHighScores(
      [
        {
          score: 100,
          medal: 'C',
          difficulty: 'normal',
          date: 'a',
          timeSec: 1,
          enemies: 1,
        },
      ],
      {
        score: 500,
        medal: 'A',
        difficulty: 'normal',
        date: 'b',
        timeSec: 2,
        enemies: 2,
      },
      10,
    );
    expect(list[0].score).toBe(500);
    expect(list).toHaveLength(2);
  });
});
