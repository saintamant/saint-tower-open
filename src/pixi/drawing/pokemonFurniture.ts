import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { SpriteAtlas } from './spriteAtlas';
import {
  drawDesk, drawComputer, drawPlant, drawBookshelf,
  drawGolfBag, drawMicroscope, drawFlask, drawTestTubes, drawWhiteboard,
} from './furniture';

type FurnitureType = 'desk' | 'computer' | 'plant' | 'bookshelf' | 'golfbag' | 'microscope' | 'flask' | 'testtubes' | 'whiteboard';

// Scale for extracted computer sprite (15x27 native → ~24x43 at 1.6x)
const COMPUTER_SPRITE_SCALE = 1.6;

/**
 * Draw a single piece of furniture at the given position.
 * Returns a Container with the sprite (or procedural fallback).
 */
export function createFurniture(
  type: FurnitureType,
  x: number,
  y: number,
  atlas: SpriteAtlas | null,
  computerTexture: Texture | null = null,
): Container {
  const container = new Container();

  // Use extracted Pokemon sprite for computers
  if (type === 'computer' && computerTexture) {
    const sprite = new Sprite(computerTexture);
    sprite.scale.set(COMPUTER_SPRITE_SCALE);
    sprite.x = x;
    sprite.y = y;
    container.addChild(sprite);
    return container;
  }

  // Procedural fallback for all other furniture
  const g = new Graphics();
  switch (type) {
    case 'desk':       drawDesk(g, x, y); break;
    case 'computer':   drawComputer(g, x, y); break;
    case 'plant':      drawPlant(g, x, y); break;
    case 'bookshelf':  drawBookshelf(g, x, y); break;
    case 'golfbag':    drawGolfBag(g, x, y); break;
    case 'microscope': drawMicroscope(g, x, y); break;
    case 'flask':      drawFlask(g, x, y); break;
    case 'testtubes':  drawTestTubes(g, x, y); break;
    case 'whiteboard': drawWhiteboard(g, x, y); break;
  }
  container.addChild(g);

  return container;
}

/**
 * Draw all furniture for the building layout.
 * Returns a Container with all furniture children.
 */
export function createAllFurniture(
  furniturePlacements: Array<{ type: FurnitureType; position: { x: number; y: number } }>,
  atlas: SpriteAtlas | null,
  computerTexture: Texture | null = null,
): Container {
  const container = new Container();

  for (const f of furniturePlacements) {
    const piece = createFurniture(f.type, f.position.x, f.position.y, atlas, computerTexture);
    container.addChild(piece);
  }

  return container;
}
