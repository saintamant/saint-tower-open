import { Container, Sprite, Graphics, TilingSprite } from 'pixi.js';
import { SpriteAtlas } from './spriteAtlas';
import { PALETTE } from './palette';

// Pokemon Emerald wall tile coordinates (16x16 grid on 3072x1024 sheet)
// Wall tiles are dark/slate colored — found at cols 24, rows 0-1
const WALL_COORDS = {
  // Top wall face (thick, creates depth illusion)
  wallTopLeft:  { col: 24, row: 0 },
  wallTopMid:   { col: 25, row: 0 },
  wallTopRight: { col: 26, row: 0 },
  // Wall bottom edge (shadow line)
  wallBottomEdge: { col: 25, row: 1 },
  // Side walls
  wallSideLeft:  { col: 24, row: 1 },
  wallSideRight: { col: 26, row: 1 },
};

export const WALL_TOP_HEIGHT = 24;
export const WALL_SIDE_WIDTH = 5;
const WALL_BOTTOM_HEIGHT = 2;
const SCALE = 2;

/**
 * Create Pokemon Emerald style room walls.
 * Returns a Container with sprite-based walls, or falls back to procedural.
 */
export function createRoomWalls(
  x: number, y: number, w: number, h: number,
  accentColor: number,
  atlas: SpriteAtlas | null,
): Container {
  const container = new Container();

  const wallTile = atlas?.getTile(WALL_COORDS.wallTopMid.col, WALL_COORDS.wallTopMid.row);
  const wallSideTile = atlas?.getTile(WALL_COORDS.wallSideLeft.col, WALL_COORDS.wallSideLeft.row);

  if (wallTile) {
    // Top wall — tiled horizontally
    const topWall = new TilingSprite({
      texture: wallTile,
      width: w,
      height: WALL_TOP_HEIGHT,
    });
    topWall.tileScale.set(SCALE, SCALE);
    topWall.x = x;
    topWall.y = y;
    container.addChild(topWall);

    // Accent stripe on wall face
    const accent = new Graphics();
    accent.rect(x + 6, y + 8, w - 12, 3);
    accent.fill({ color: accentColor, alpha: 0.7 });
    container.addChild(accent);

    // Wall bottom shadow
    const shadow = new Graphics();
    shadow.rect(x + WALL_SIDE_WIDTH, y + WALL_TOP_HEIGHT, w - WALL_SIDE_WIDTH * 2, 5);
    shadow.fill({ color: PALETTE.black, alpha: 0.2 });
    container.addChild(shadow);

    // Side walls
    if (wallSideTile) {
      const leftSide = new Sprite(wallSideTile);
      leftSide.x = x;
      leftSide.y = y + WALL_TOP_HEIGHT;
      leftSide.width = WALL_SIDE_WIDTH;
      leftSide.height = h - WALL_TOP_HEIGHT - WALL_BOTTOM_HEIGHT;
      container.addChild(leftSide);

      const rightSide = new Sprite(wallSideTile);
      rightSide.x = x + w - WALL_SIDE_WIDTH;
      rightSide.y = y + WALL_TOP_HEIGHT;
      rightSide.width = WALL_SIDE_WIDTH;
      rightSide.height = h - WALL_TOP_HEIGHT - WALL_BOTTOM_HEIGHT;
      container.addChild(rightSide);
    } else {
      const sides = new Graphics();
      sides.rect(x, y + WALL_TOP_HEIGHT, WALL_SIDE_WIDTH, h - WALL_TOP_HEIGHT - WALL_BOTTOM_HEIGHT);
      sides.fill(PALETTE.wallSide);
      sides.rect(x + w - WALL_SIDE_WIDTH, y + WALL_TOP_HEIGHT, WALL_SIDE_WIDTH, h - WALL_TOP_HEIGHT - WALL_BOTTOM_HEIGHT);
      sides.fill(PALETTE.wallSide);
      container.addChild(sides);
    }

    // Bottom wall
    const bottom = new Graphics();
    bottom.rect(x, y + h - WALL_BOTTOM_HEIGHT, w, WALL_BOTTOM_HEIGHT);
    bottom.fill(PALETTE.wallShadow);
    bottom.rect(x, y + h - WALL_BOTTOM_HEIGHT, WALL_SIDE_WIDTH, WALL_BOTTOM_HEIGHT);
    bottom.fill(PALETTE.wallSide);
    bottom.rect(x + w - WALL_SIDE_WIDTH, y + h - WALL_BOTTOM_HEIGHT, WALL_SIDE_WIDTH, WALL_BOTTOM_HEIGHT);
    bottom.fill(PALETTE.wallSide);
    container.addChild(bottom);
  } else {
    // Fallback: procedural walls (original code)
    const g = new Graphics();
    drawProceduralWalls(g, x, y, w, h, accentColor);
    container.addChild(g);
  }

  return container;
}

// ── Procedural fallback (from original walls.ts) ──

function drawProceduralWalls(
  g: Graphics, x: number, y: number, w: number, h: number,
  accentColor: number,
) {
  const accent = accentColor ?? PALETTE.accentBlue;

  // Top wall
  g.rect(x, y, w, 2); g.fill(PALETTE.wallTop);
  g.rect(x + 1, y + 1, w - 2, 1); g.fill({ color: PALETTE.white, alpha: 0.08 });
  g.rect(x, y + 2, w, WALL_TOP_HEIGHT - 4); g.fill(PALETTE.wallFace);
  g.rect(x + 6, y + 8, w - 12, 3); g.fill({ color: accent, alpha: 0.7 });
  g.rect(x, y + WALL_TOP_HEIGHT - 2, w, 2); g.fill(PALETTE.wallShadow);
  g.rect(x + WALL_SIDE_WIDTH, y + WALL_TOP_HEIGHT, w - WALL_SIDE_WIDTH * 2, 5);
  g.fill({ color: PALETTE.black, alpha: 0.2 });

  // Side walls
  g.rect(x, y + WALL_TOP_HEIGHT, WALL_SIDE_WIDTH, h - WALL_TOP_HEIGHT - WALL_BOTTOM_HEIGHT);
  g.fill(PALETTE.wallSide);
  g.rect(x + w - WALL_SIDE_WIDTH, y + WALL_TOP_HEIGHT, WALL_SIDE_WIDTH, h - WALL_TOP_HEIGHT - WALL_BOTTOM_HEIGHT);
  g.fill(PALETTE.wallSide);

  // Bottom wall
  g.rect(x, y + h - WALL_BOTTOM_HEIGHT, w, WALL_BOTTOM_HEIGHT); g.fill(PALETTE.wallShadow);
  g.rect(x, y + h - WALL_BOTTOM_HEIGHT, WALL_SIDE_WIDTH, WALL_BOTTOM_HEIGHT); g.fill(PALETTE.wallSide);
  g.rect(x + w - WALL_SIDE_WIDTH, y + h - WALL_BOTTOM_HEIGHT, WALL_SIDE_WIDTH, WALL_BOTTOM_HEIGHT); g.fill(PALETTE.wallSide);
}
