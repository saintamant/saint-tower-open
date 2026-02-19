import { Container, Sprite, Graphics, TilingSprite, Texture } from 'pixi.js';
import { SpriteAtlas } from './spriteAtlas';
import { PALETTE } from './palette';

// Pokemon Emerald interior tileset tile coordinates (16x16 grid on 3072x1024 sheet)
// Positions mapped from actual pixel analysis of the downloaded tileset
const TILE_COORDS = {
  // Wood floor tiles — warm brown planks (cols 33-36 area, rows 1-2)
  woodFloor1: { col: 33, row: 1 },
  woodFloor2: { col: 34, row: 1 },
  // Lab/center checkerboard tiles — light cream/beige (cols 16-17, row 1)
  tileFloor1: { col: 16, row: 1 },
  tileFloor2: { col: 17, row: 1 },
  // Grass tiles — green (col 20, row 0 and col 18, row 3)
  grassFloor1: { col: 20, row: 0 },
  grassFloor2: { col: 18, row: 3 },
};

const SCALE = 2; // 16px tiles → 32px on screen

/**
 * Create a wood floor using Pokemon interior wooden plank tiles.
 * Falls back to procedural drawing if atlas not loaded.
 */
export function createWoodFloor(
  x: number, y: number, w: number, h: number,
  atlas: SpriteAtlas | null,
): Container {
  const container = new Container();

  const tile1 = atlas?.getTile(TILE_COORDS.woodFloor1.col, TILE_COORDS.woodFloor1.row);
  const tile2 = atlas?.getTile(TILE_COORDS.woodFloor2.col, TILE_COORDS.woodFloor2.row);

  if (tile1) {
    // Use tiling sprite for seamless fill
    const tiling = new TilingSprite({
      texture: tile1,
      width: w,
      height: h,
    });
    tiling.tileScale.set(SCALE, SCALE);
    tiling.x = x;
    tiling.y = y;
    container.addChild(tiling);
  } else {
    // Fallback: procedural wood floor
    const g = new Graphics();
    drawProceduralWoodFloor(g, x, y, w, h);
    container.addChild(g);
  }

  return container;
}

/**
 * Create a tile (checkerboard) floor using Pokemon lab/center tiles.
 */
export function createTileFloor(
  x: number, y: number, w: number, h: number,
  atlas: SpriteAtlas | null,
): Container {
  const container = new Container();

  // Always use procedural — tileset tile coords pull from pre-composed room
  // scenes rather than clean individual tiles, producing incorrect patterns
  const g = new Graphics();
  drawProceduralTileFloor(g, x, y, w, h);
  container.addChild(g);

  return container;
}

/**
 * Create a grass floor using Pokemon grass tiles.
 */
export function createGrassFloor(
  x: number, y: number, w: number, h: number,
  atlas: SpriteAtlas | null,
): Container {
  const container = new Container();

  const tile1 = atlas?.getTile(TILE_COORDS.grassFloor1.col, TILE_COORDS.grassFloor1.row);

  if (tile1) {
    const tiling = new TilingSprite({
      texture: tile1,
      width: w,
      height: h,
    });
    tiling.tileScale.set(SCALE, SCALE);
    tiling.x = x;
    tiling.y = y;
    container.addChild(tiling);
  } else {
    const g = new Graphics();
    drawProceduralGrassFloor(g, x, y, w, h);
    container.addChild(g);
  }

  return container;
}

/**
 * Create a mat floor (reuses grass tiles with tint).
 */
export function createMatFloor(
  x: number, y: number, w: number, h: number,
  atlas: SpriteAtlas | null,
): Container {
  const container = new Container();

  const tile1 = atlas?.getTile(TILE_COORDS.grassFloor1.col, TILE_COORDS.grassFloor1.row);

  if (tile1) {
    const tiling = new TilingSprite({
      texture: tile1,
      width: w,
      height: h,
    });
    tiling.tileScale.set(SCALE, SCALE);
    tiling.x = x;
    tiling.y = y;
    tiling.tint = 0x88bbaa; // Teal-ish tint for mat
    container.addChild(tiling);
  } else {
    const g = new Graphics();
    drawProceduralMatFloor(g, x, y, w, h);
    container.addChild(g);
  }

  return container;
}

// ── Helpers ──

function addCheckerOverlay(
  container: Container, x: number, y: number, w: number, h: number,
  tile: Texture, scale: number,
) {
  const tileSize = 16 * scale;
  for (let ty = 0; ty < h; ty += tileSize) {
    for (let tx = 0; tx < w; tx += tileSize) {
      const isAlt = (Math.floor(tx / tileSize) + Math.floor(ty / tileSize)) % 2 === 0;
      if (isAlt) {
        const sprite = new Sprite(tile);
        sprite.scale.set(scale);
        sprite.x = x + tx;
        sprite.y = y + ty;
        // Clip to bounds
        if (x + tx + tileSize > x + w) sprite.width = w - tx;
        if (y + ty + tileSize > y + h) sprite.height = h - ty;
        container.addChild(sprite);
      }
    }
  }
}

function fillCheckerboard(
  container: Container, x: number, y: number, w: number, h: number,
  tile1: Texture, tile2: Texture, scale: number,
) {
  const tileSize = 16 * scale;
  for (let ty = 0; ty < h; ty += tileSize) {
    for (let tx = 0; tx < w; tx += tileSize) {
      const isAlt = (Math.floor(tx / tileSize) + Math.floor(ty / tileSize)) % 2 === 0;
      const sprite = new Sprite(isAlt ? tile1 : tile2);
      sprite.scale.set(scale);
      sprite.x = x + tx;
      sprite.y = y + ty;
      container.addChild(sprite);
    }
  }
}

// ── Procedural fallbacks (from original tiles.ts) ──

function drawProceduralWoodFloor(g: Graphics, x: number, y: number, w: number, h: number) {
  g.rect(x, y, w, h);
  g.fill(PALETTE.woodLight);
  for (let py = y; py < y + h; py += 10) {
    const isAlt = (Math.floor((py - y) / 10)) % 2 === 0;
    if (isAlt) { g.rect(x, py, w, 10); g.fill(PALETTE.woodMid); }
    g.rect(x, py, w, 1); g.fill({ color: PALETTE.woodLine, alpha: 0.5 });
  }
  for (let py = y; py < y + h; py += 10) {
    const offset = (Math.floor((py - y) / 10)) % 2 === 0 ? 0 : 32;
    for (let px = x + offset + 20; px < x + w; px += 64) {
      g.rect(px, py + 1, 1, 9); g.fill({ color: PALETTE.woodLine, alpha: 0.4 });
    }
  }
  drawEdgeDarkening(g, x, y, w, h);
}

function drawProceduralTileFloor(g: Graphics, x: number, y: number, w: number, h: number) {
  g.rect(x, y, w, h); g.fill(PALETTE.tileLight);
  const TS = 20;
  for (let ty = y; ty < y + h; ty += TS) {
    for (let tx = x; tx < x + w; tx += TS) {
      const isAlt = (Math.floor((tx - x) / TS) + Math.floor((ty - y) / TS)) % 2 === 0;
      const tW = Math.min(TS, x + w - tx), tH = Math.min(TS, y + h - ty);
      if (isAlt) { g.rect(tx, ty, tW, tH); g.fill(PALETTE.tileDark); }
      g.rect(tx, ty, tW, 1); g.fill({ color: PALETTE.tileMid, alpha: 0.6 });
      g.rect(tx, ty, 1, tH); g.fill({ color: PALETTE.tileMid, alpha: 0.6 });
    }
  }
  drawEdgeDarkening(g, x, y, w, h);
}

function drawProceduralGrassFloor(g: Graphics, x: number, y: number, w: number, h: number) {
  g.rect(x, y, w, h); g.fill(PALETTE.carpetLight);
  for (let ty = y; ty < y + h; ty += 5) {
    for (let tx = x; tx < x + w; tx += 5) {
      const idx = Math.floor((tx - x) / 5) + Math.floor((ty - y) / 5);
      if (idx % 3 === 0) { g.rect(tx, ty, 2, 2); g.fill({ color: PALETTE.carpetDark, alpha: 0.35 }); }
      else if (idx % 5 === 0) { g.rect(tx + 1, ty + 1, 1, 1); g.fill({ color: 0x7abb7a, alpha: 0.3 }); }
    }
  }
  drawEdgeDarkening(g, x, y, w, h);
}

function drawProceduralMatFloor(g: Graphics, x: number, y: number, w: number, h: number) {
  g.rect(x, y, w, h); g.fill(PALETTE.carpetLight);
  for (let ty = y; ty < y + h; ty += 8) {
    for (let tx = x; tx < x + w; tx += 8) {
      if ((Math.floor((tx - x) / 8) + Math.floor((ty - y) / 8)) % 2 === 0) {
        g.rect(tx + 2, ty + 2, 4, 4); g.fill({ color: PALETTE.carpetDark, alpha: 0.2 });
      }
    }
  }
  drawEdgeDarkening(g, x, y, w, h);
}

function drawEdgeDarkening(g: Graphics, x: number, y: number, w: number, h: number) {
  g.rect(x, y, w, 2); g.fill({ color: PALETTE.black, alpha: 0.1 });
  g.rect(x, y + h - 2, w, 2); g.fill({ color: PALETTE.black, alpha: 0.1 });
  g.rect(x, y, 2, h); g.fill({ color: PALETTE.black, alpha: 0.1 });
  g.rect(x + w - 2, y, 2, h); g.fill({ color: PALETTE.black, alpha: 0.1 });
}
