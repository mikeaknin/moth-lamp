import Phaser from 'phaser';
import { GAME } from './data/balance';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { gameBridge } from './bridge';
import type { GameSettings } from './data/types';

export function createGame(parent: HTMLElement, settings: GameSettings): Phaser.Game {
  gameBridge.settings = { ...settings };

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME.width,
    height: GAME.height,
    backgroundColor: '#05030e',
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    banner: false,
    audio: {
      disableWebAudio: false,
      noAudio: false,
    },
    scale: {
      // FIT = entire 320×180 playfield always visible (no crop).
      // ENVELOP was cropping phones to a "window into desktop" — wrong for mobile.
      // Letterbox bars are intentional; pixelArt keeps nearest-neighbor crisp.
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME.width,
      height: GAME.height,
      expandParent: true,
      fullscreenTarget: parent,
      autoRound: true,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [BootScene, GameScene],
    input: {
      activePointers: 3,
    },
    fps: {
      target: GAME.targetFps,
      forceSetTimeOut: false,
    },
    render: {
      pixelArt: true,
      antialias: false,
      powerPreference: 'high-performance',
    },
  });

  // Pause Phaser when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      game.sound?.pauseOnBlur && (game.sound.pauseOnBlur = true);
      if (game.scene.isActive('GameScene')) {
        gameBridge.pause();
      }
    }
  });

  return game;
}
