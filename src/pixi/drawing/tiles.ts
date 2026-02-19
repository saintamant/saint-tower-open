import { Graphics } from 'pixi.js';
import { PALETTE } from './palette';

const PLANK_HEIGHT = 10;
const TILE_SIZE = 20;

export function drawWoodFloor(g: Graphics, x: number, y: number, w: number, h: number) {
  // Base warm wood
  g.rect(x, y, w, h);
  g.fill(PALETTE.woodLight);

  // Horizontal plank lines with alternating shades
  for (let py = y; py < y + h; py += PLANK_HEIGHT) {
    const isAlt = (Math.floor((py - y) / PLANK_HEIGHT)) % 2 === 0;
    if (isAlt) {
      g.rect(x, py, w, PLANK_HEIGHT);
      g.fill(PALETTE.woodMid);
    }
    // Plank seam line (stronger — 0.5 alpha)
    g.rect(x, py, w, 1);
    g.fill({ color: PALETTE.woodLine, alpha: 0.5 });
  }

  // Vertical seams (staggered, more visible — 0.4 alpha)
  for (let py = y; py < y + h; py += PLANK_HEIGHT) {
    const offset = (Math.floor((py - y) / PLANK_HEIGHT)) % 2 === 0 ? 0 : 32;
    for (let px = x + offset + 20; px < x + w; px += 64) {
      g.rect(px, py + 1, 1, PLANK_HEIGHT - 1);
      g.fill({ color: PALETTE.woodLine, alpha: 0.4 });
    }
  }

  // Edge darkening for depth (2px border inside room edges)
  g.rect(x, y, w, 2);
  g.fill({ color: PALETTE.black, alpha: 0.1 });
  g.rect(x, y + h - 2, w, 2);
  g.fill({ color: PALETTE.black, alpha: 0.1 });
  g.rect(x, y, 2, h);
  g.fill({ color: PALETTE.black, alpha: 0.1 });
  g.rect(x + w - 2, y, 2, h);
  g.fill({ color: PALETTE.black, alpha: 0.1 });
}

export function drawTileFloor(g: Graphics, x: number, y: number, w: number, h: number) {
  // Base cream/beige
  g.rect(x, y, w, h);
  g.fill(PALETTE.tileLight);

  // Checkerboard pattern with larger tiles
  for (let ty = y; ty < y + h; ty += TILE_SIZE) {
    for (let tx = x; tx < x + w; tx += TILE_SIZE) {
      const isAlt = (Math.floor((tx - x) / TILE_SIZE) + Math.floor((ty - y) / TILE_SIZE)) % 2 === 0;
      const tileW = Math.min(TILE_SIZE, x + w - tx);
      const tileH = Math.min(TILE_SIZE, y + h - ty);

      if (isAlt) {
        g.rect(tx, ty, tileW, tileH);
        g.fill(PALETTE.tileDark);
      } else {
        // Subtle shine on light tiles
        g.rect(tx + 2, ty + 2, Math.max(0, tileW - 4), Math.max(0, tileH - 4));
        g.fill({ color: PALETTE.white, alpha: 0.04 });
      }

      // Grout lines (stronger — 0.6 alpha)
      g.rect(tx, ty, tileW, 1);
      g.fill({ color: PALETTE.tileMid, alpha: 0.6 });
      g.rect(tx, ty, 1, tileH);
      g.fill({ color: PALETTE.tileMid, alpha: 0.6 });
    }
  }

  // Edge darkening
  g.rect(x, y, w, 2);
  g.fill({ color: PALETTE.black, alpha: 0.1 });
  g.rect(x, y + h - 2, w, 2);
  g.fill({ color: PALETTE.black, alpha: 0.1 });
  g.rect(x, y, 2, h);
  g.fill({ color: PALETTE.black, alpha: 0.1 });
  g.rect(x + w - 2, y, 2, h);
  g.fill({ color: PALETTE.black, alpha: 0.1 });
}

export function drawGrassFloor(g: Graphics, x: number, y: number, w: number, h: number) {
  // Lush green base
  g.rect(x, y, w, h);
  g.fill(PALETTE.carpetLight);

  // Varied grass texture dots — multiple sizes and shades for organic look
  for (let ty = y; ty < y + h; ty += 5) {
    for (let tx = x; tx < x + w; tx += 5) {
      const idx = Math.floor((tx - x) / 5) + Math.floor((ty - y) / 5);
      if (idx % 3 === 0) {
        // 2px darker dots
        g.rect(tx, ty, 2, 2);
        g.fill({ color: PALETTE.carpetDark, alpha: 0.35 });
      } else if (idx % 5 === 0) {
        // 1px lighter dots
        g.rect(tx + 1, ty + 1, 1, 1);
        g.fill({ color: 0x7abb7a, alpha: 0.3 });
      }
    }
  }

  // Edge darkening
  g.rect(x, y, w, 2);
  g.fill({ color: PALETTE.black, alpha: 0.1 });
  g.rect(x, y + h - 2, w, 2);
  g.fill({ color: PALETTE.black, alpha: 0.1 });
  g.rect(x, y, 2, h);
  g.fill({ color: PALETTE.black, alpha: 0.1 });
  g.rect(x + w - 2, y, 2, h);
  g.fill({ color: PALETTE.black, alpha: 0.1 });
}

export function drawMatFloor(g: Graphics, x: number, y: number, w: number, h: number) {
  // Teal-green carpet
  g.rect(x, y, w, h);
  g.fill(PALETTE.carpetLight);

  // Diamond pattern
  for (let ty = y; ty < y + h; ty += 8) {
    for (let tx = x; tx < x + w; tx += 8) {
      if ((Math.floor((tx - x) / 8) + Math.floor((ty - y) / 8)) % 2 === 0) {
        g.rect(tx + 2, ty + 2, 4, 4);
        g.fill({ color: PALETTE.carpetDark, alpha: 0.2 });
      }
    }
  }

  // Edge darkening
  g.rect(x, y, w, 2);
  g.fill({ color: PALETTE.black, alpha: 0.1 });
  g.rect(x, y + h - 2, w, 2);
  g.fill({ color: PALETTE.black, alpha: 0.1 });
  g.rect(x, y, 2, h);
  g.fill({ color: PALETTE.black, alpha: 0.1 });
  g.rect(x + w - 2, y, 2, h);
  g.fill({ color: PALETTE.black, alpha: 0.1 });
}
