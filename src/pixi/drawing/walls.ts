import { Graphics } from 'pixi.js';
import { PALETTE } from './palette';

// Gather.town style — thick top wall creates depth illusion (bigger, more prominent)
export const WALL_TOP_HEIGHT = 24;
export const WALL_SIDE_WIDTH = 5;
const WALL_BOTTOM_HEIGHT = 2;

export function drawRoomWalls(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  accentColor?: number
) {
  const accent = accentColor ?? PALETTE.accentBlue;

  // ── Top wall (thick — creates the Gather depth illusion) ──

  // Wall top edge (highlight — 1px inner shine for polish)
  g.rect(x, y, w, 2);
  g.fill(PALETTE.wallTop);
  // Inner highlight line at top for polish
  g.rect(x + 1, y + 1, w - 2, 1);
  g.fill({ color: PALETTE.white, alpha: 0.08 });

  // Wall face (main thick area)
  g.rect(x, y + 2, w, WALL_TOP_HEIGHT - 4);
  g.fill(PALETTE.wallFace);

  // Accent stripe on wall face (stronger, thicker)
  g.rect(x + 6, y + 8, w - 12, 3);
  g.fill({ color: accent, alpha: 0.7 });

  // Wall bottom edge (dark shadow line)
  g.rect(x, y + WALL_TOP_HEIGHT - 2, w, 2);
  g.fill(PALETTE.wallShadow);

  // Shadow cast onto floor (stronger 0.2 alpha)
  g.rect(x + WALL_SIDE_WIDTH, y + WALL_TOP_HEIGHT, w - WALL_SIDE_WIDTH * 2, 5);
  g.fill({ color: PALETTE.black, alpha: 0.2 });

  // ── Side walls (slightly wider) ──
  g.rect(x, y + WALL_TOP_HEIGHT, WALL_SIDE_WIDTH, h - WALL_TOP_HEIGHT - WALL_BOTTOM_HEIGHT);
  g.fill(PALETTE.wallSide);

  g.rect(x + w - WALL_SIDE_WIDTH, y + WALL_TOP_HEIGHT, WALL_SIDE_WIDTH, h - WALL_TOP_HEIGHT - WALL_BOTTOM_HEIGHT);
  g.fill(PALETTE.wallSide);

  // ── Bottom wall (thin) ──
  g.rect(x, y + h - WALL_BOTTOM_HEIGHT, w, WALL_BOTTOM_HEIGHT);
  g.fill(PALETTE.wallShadow);

  // ── Corner pieces (fill in the gaps) ──
  g.rect(x, y + h - WALL_BOTTOM_HEIGHT, WALL_SIDE_WIDTH, WALL_BOTTOM_HEIGHT);
  g.fill(PALETTE.wallSide);
  g.rect(x + w - WALL_SIDE_WIDTH, y + h - WALL_BOTTOM_HEIGHT, WALL_SIDE_WIDTH, WALL_BOTTOM_HEIGHT);
  g.fill(PALETTE.wallSide);
}
