import Phaser from 'phaser';

export type BulletOwner = 'player' | 'enemy';

export interface BulletData {
  owner: BulletOwner;
  damage: number;
  pierce: boolean;
  vx: number;
  vy: number;
  alive: boolean;
  lifespan: number;
}

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  data_!: BulletData;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'bullet_player');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.data_ = {
      owner: 'player',
      damage: 1,
      pierce: false,
      vx: 0,
      vy: 0,
      alive: false,
      lifespan: 0,
    };
    this.setActive(false).setVisible(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
  }

  fire(opts: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    owner: BulletOwner;
    damage?: number;
    pierce?: boolean;
    texture?: string;
    lifespan?: number;
  }): void {
    this.setTexture(opts.texture ?? (opts.owner === 'player' ? 'bullet_player' : 'bullet_enemy'));
    this.setPosition(opts.x, opts.y);
    this.setActive(true).setVisible(true);
    this.setDepth(20);
    this.data_ = {
      owner: opts.owner,
      damage: opts.damage ?? 1,
      pierce: opts.pierce ?? false,
      vx: opts.vx,
      vy: opts.vy,
      alive: true,
      lifespan: opts.lifespan ?? 2500,
    };
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setSize(this.width - 2, this.height - 2);
    body.setAllowGravity(false);
    this.setVelocity(opts.vx, opts.vy);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (!this.data_.alive) return;
    this.data_.lifespan -= delta;
    if (
      this.data_.lifespan <= 0 ||
      this.x < -20 ||
      this.x > 340 ||
      this.y < -20 ||
      this.y > 200
    ) {
      this.kill();
    }
  }

  kill(): void {
    this.data_.alive = false;
    this.setActive(false).setVisible(false);
    this.setVelocity(0, 0);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
  }
}
