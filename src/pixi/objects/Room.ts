import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { RoomLayout } from '@/types/tilemap';
import { HealthLevel } from '@/types/agent';
import { createWoodFloor, createTileFloor, createGrassFloor, createMatFloor } from '../drawing/pokemonTiles';
import { createRoomWalls, WALL_TOP_HEIGHT, WALL_SIDE_WIDTH } from '../drawing/pokemonWalls';
import { createRoomLabel } from '../drawing/effects';
import { PALETTE } from '../drawing/palette';
import { HEALTH_COLORS } from '@/lib/health';
import { RoomHUD } from './RoomHUD';
import { SpriteAtlas } from '../drawing/spriteAtlas';
import type { PokemonAssets } from '../drawing/spriteLoader';

export class Room extends Container {
  layout: RoomLayout;
  roomLabel: Container | null = null;
  private healthGlow: Graphics;
  private _healthLevel: HealthLevel = 'empty';
  private _elapsed = 0;
  private hud: RoomHUD;

  constructor(layout: RoomLayout, assets: PokemonAssets | null = null) {
    super();
    this.layout = layout;

    const interiorAtlas = assets?.interiorAtlas ?? null;
    const { position, size, floorType, label, color } = layout;
    const { x, y } = position;
    const { width, height } = size;

    const accentColor = parseInt(color.replace('#', ''), 16);

    // Health glow (behind everything)
    this.healthGlow = new Graphics();
    this.addChild(this.healthGlow);

    // Pre-composed room: use sprite instead of floor+walls
    const roomTexture = assets?.roomTextures?.get(layout.id) ?? null;
    if (roomTexture) {
      const roomSprite = new Sprite(roomTexture);
      roomSprite.x = x;
      roomSprite.y = y;
      roomSprite.width = width;
      roomSprite.height = height;
      this.addChild(roomSprite);
    } else {
      // Floor — inset by wall thickness (Container-based with Pokemon sprites)
      const floorX = x + WALL_SIDE_WIDTH;
      const floorY = y + WALL_TOP_HEIGHT;
      const floorW = width - WALL_SIDE_WIDTH * 2;
      const floorH = height - WALL_TOP_HEIGHT - 2;

      let floorContainer: Container;
      switch (floorType) {
        case 'wood':  floorContainer = createWoodFloor(floorX, floorY, floorW, floorH, interiorAtlas); break;
        case 'tile':  floorContainer = createTileFloor(floorX, floorY, floorW, floorH, interiorAtlas); break;
        case 'grass': floorContainer = createGrassFloor(floorX, floorY, floorW, floorH, interiorAtlas); break;
        case 'mat':   floorContainer = createMatFloor(floorX, floorY, floorW, floorH, interiorAtlas); break;
      }
      this.addChild(floorContainer);

      // Walls — Container-based with Pokemon sprites
      const wallContainer = createRoomWalls(x, y, width, height, accentColor, interiorAtlas);
      this.addChild(wallContainer);
    }

    // Room label — stored as public property for Building to move to labelsLayer
    this.roomLabel = createRoomLabel(label, x + 8, y + 4, accentColor);

    // HUD in top-right area (on the wall)
    this.hud = new RoomHUD();
    this.hud.x = x + width - 70;
    this.hud.y = y + 4;
    this.addChild(this.hud);
  }

  setHealth(level: HealthLevel) {
    this._healthLevel = level;
    this.drawHealthGlow();
  }

  setLastActive(_timestamp: string | null) {
    // Minimal — no timestamp display in Gather style
  }

  setStats(activeTasks: number, errors: number, activeAgentCount: number) {
    this.hud.setStats(activeTasks, errors, activeAgentCount);
  }

  private drawHealthGlow() {
    this.healthGlow.clear();

    const { x, y } = this.layout.position;
    const { width, height } = this.layout.size;
    const color = HEALTH_COLORS[this._healthLevel];

    // Colored accent stripe on wall top (stronger)
    this.healthGlow.rect(x, y, width, 2);
    this.healthGlow.fill({ color, alpha: 0.9 });

    // Stronger border glow
    this.healthGlow.rect(x, y, width, height);
    this.healthGlow.stroke({ color, width: 2, alpha: 0.4 });
  }

  update(deltaTime: number) {
    this._elapsed += deltaTime / 60;

    if (this._healthLevel !== 'empty') {
      // Stronger pulse (0.8 base)
      const pulse = 0.7 + Math.sin(this._elapsed * 1.5) * 0.2;
      this.healthGlow.alpha = pulse;
    }

    this.hud.update(deltaTime);
  }
}
