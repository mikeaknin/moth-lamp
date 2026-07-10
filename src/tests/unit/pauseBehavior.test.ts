import { describe, expect, it } from 'vitest';
import { gameBridge } from '../../game/bridge';

describe('pause / bridge commands', () => {
  it('queues pause and resume without auto wallet side effects', () => {
    gameBridge.drainCommands();
    gameBridge.pause();
    gameBridge.resume();
    const cmds = gameBridge.drainCommands();
    expect(cmds).toEqual(['pause', 'resume']);
    expect(gameBridge.drainCommands()).toEqual([]);
  });

  it('requestStart marks a wallet-free game start', () => {
    gameBridge.drainCommands();
    // clear any sticky start flag
    gameBridge.consumeStart();
    gameBridge.requestStart({ tutorial: true });
    expect(gameBridge.drainCommands()).toContain('restart');
    const s = gameBridge.consumeStart();
    expect(s.start).toBe(true);
    expect(s.tutorial).toBe(true);
  });
});
