import { Graphics } from 'pixi.js';
import { PALETTE } from './palette';

// Gather.town style: 32x36 pixel art characters, 3/4 top-down view
// Drawn on a 16x18 grid (each cell = 2x2 screen pixels)
export const CHARACTER_WIDTH = 32;
export const CHARACTER_HEIGHT = 36;

const P = 2;           // pixel art pixel size
const OUTLINE = 0x1a1a2e;
const GW = 16;         // grid width
const GH = 18;         // grid height
const BODY_H = 16;     // outline only computed for rows 0-15

// ═══ Agent config ═══

type HairStyle = 'short' | 'spiky' | 'long' | 'bangs' | 'curly' | 'buzz' |
  'ponytail' | 'cap' | 'mohawk' | 'twintails' | 'swept' | 'messy';

interface AgentLook {
  hair: number;
  shirt: number;
  skin: number;
  pants: number;
  hairStyle: HairStyle;
}

const AGENT_LOOKS: Record<string, AgentLook> = {
  'juan':              { hair: 0x1a1a1a, shirt: 0x1a1a2a, skin: 0xf0b888, pants: 0x111118, hairStyle: 'short' },
  'sa-vendedor':       { hair: 0x2a1a0a, shirt: 0xee8833, skin: 0xd4a070, pants: 0x4a4a5a, hairStyle: 'spiky' },
  'sa-marketing':      { hair: 0x8855aa, shirt: 0xbb55bb, skin: 0xf5c09a, pants: 0x3a3a52, hairStyle: 'long' },
  'sa-cto':            { hair: 0x2a2a3a, shirt: 0x4488cc, skin: 0xf0b888, pants: 0x2a2a3a, hairStyle: 'bangs' },
  'sa-finanzas':       { hair: 0x4a3a1a, shirt: 0x44aa66, skin: 0xd4a070, pants: 0x3a3a52, hairStyle: 'messy' },
  'project-a-data':    { hair: 0x1a1a1a, shirt: 0xeeaa33, skin: 0xf5c09a, pants: 0x4a4a5a, hairStyle: 'buzz' },
  'project-b-data':    { hair: 0x5a3a1a, shirt: 0x8855bb, skin: 0xf0b888, pants: 0x3a3a52, hairStyle: 'ponytail' },
  'project-c-data':    { hair: 0x3a2a1a, shirt: 0x4488cc, skin: 0xd4a070, pants: 0x4a4a5a, hairStyle: 'mohawk' },
  'project-d-data':    { hair: 0x1a1a1a, shirt: 0xeeaa33, skin: 0xf5c09a, pants: 0x3a3a52, hairStyle: 'swept' },
  'agent-e1':          { hair: 0x2a2a2a, shirt: 0x44aa66, skin: 0xf0b888, pants: 0x3a3a52, hairStyle: 'buzz' },
  'agent-e2':          { hair: 0xcc5544, shirt: 0xcc4444, skin: 0xf5c09a, pants: 0x2a2a3a, hairStyle: 'twintails' },
};

const DEFAULT_LOOK: AgentLook = { hair: 0x3a3a3a, shirt: 0x5a6a7a, skin: 0xf0b888, pants: 0x3a3a52, hairStyle: 'short' };

export function getAgentLook(agentId: string): AgentLook {
  return AGENT_LOOKS[agentId] ?? DEFAULT_LOOK;
}

// ═══ Color helpers ═══

function darken(c: number, amt = 25): number {
  return (
    (Math.max(0, ((c >> 16) & 0xff) - amt) << 16) |
    (Math.max(0, ((c >> 8) & 0xff) - amt) << 8) |
    Math.max(0, (c & 0xff) - amt)
  );
}

// ═══ Grid system ═══

type Grid = (number | null)[][];

function createGrid(): Grid {
  return Array.from({ length: GH }, () => Array<number | null>(GW).fill(null));
}

function s(g: Grid, x: number, y: number, c: number) {
  if (y >= 0 && y < GH && x >= 0 && x < GW) g[y][x] = c;
}

function h(g: Grid, x: number, y: number, w: number, c: number) {
  for (let i = 0; i < w; i++) s(g, x + i, y, c);
}

function computeOutline(grid: Grid): Grid {
  const out = createGrid();
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (let y = 0; y < BODY_H; y++) {
    for (let x = 0; x < GW; x++) {
      if (grid[y][x] !== null) continue;
      for (const [dy, dx] of dirs) {
        const ny = y + dy, nx = x + dx;
        if (ny >= 0 && ny < BODY_H && nx >= 0 && nx < GW && grid[ny][nx] !== null) {
          out[y][x] = OUTLINE;
          break;
        }
      }
    }
  }
  return out;
}

function renderGrid(g: Graphics, ox: number, oy: number, grid: Grid) {
  for (let y = 0; y < GH; y++) {
    let x = 0;
    while (x < GW) {
      const c = grid[y][x];
      if (c === null) { x++; continue; }
      let run = 1;
      while (x + run < GW && grid[y][x + run] === c) run++;
      g.rect(ox + x * P, oy + y * P, run * P, P);
      g.fill(c);
      x += run;
    }
  }
}

// ═══ Base body (same for all agents, colors vary) ═══

function drawBody(grid: Grid, look: AgentLook) {
  const S = look.skin, Ss = darken(S, 30);
  const T = look.shirt, Ts = darken(T, 30);
  const Pn = look.pants, Ps = darken(Pn, 25);
  const shoe = darken(Pn, 45);

  // Head (rows 2-7) — rounded pixel shape
  h(grid, 5, 2, 6, S);       // top curve (narrower)
  h(grid, 4, 3, 8, S);       // full width
  h(grid, 4, 4, 8, S);       // eye row
  h(grid, 4, 5, 8, S);       // cheeks
  h(grid, 4, 6, 8, S);       // mouth row
  h(grid, 5, 7, 6, Ss);      // chin (narrower + shadow)

  // Face shadow right
  s(grid, 11, 3, Ss); s(grid, 11, 4, Ss);
  s(grid, 11, 5, Ss); s(grid, 11, 6, Ss);

  // Eyes
  s(grid, 6, 4, 0x111122);
  s(grid, 9, 4, 0x111122);

  // Mouth
  s(grid, 7, 6, darken(S, 40));
  s(grid, 8, 6, darken(S, 40));

  // Body (rows 8-12)
  h(grid, 7, 8, 2, T);       // neck
  h(grid, 5, 9, 6, T);       // shoulders
  h(grid, 4, 10, 8, T);      // torso + arms
  h(grid, 4, 11, 8, T);      // torso + arms
  h(grid, 5, 12, 6, Ts);     // shirt bottom shadow

  // Shirt shadow right
  s(grid, 11, 10, Ts); s(grid, 11, 11, Ts);

  // Hands
  s(grid, 4, 12, S); s(grid, 11, 12, S);

  // Pants (rows 13-14)
  h(grid, 5, 13, 6, Pn);
  h(grid, 5, 14, 2, Pn); h(grid, 9, 14, 2, Pn);
  s(grid, 6, 14, Ps); s(grid, 10, 14, Ps);

  // Shoes (row 15)
  h(grid, 5, 15, 2, shoe); h(grid, 9, 15, 2, shoe);
}

// ═══ Hair styles ═══

function drawHair(grid: Grid, look: AgentLook) {
  const H = look.hair, Hs = darken(H, 25);

  switch (look.hairStyle) {
    case 'short':
      h(grid, 6, 1, 4, H);
      h(grid, 5, 2, 6, H);
      h(grid, 4, 3, 8, H);
      s(grid, 4, 4, H); s(grid, 11, 4, H);
      h(grid, 5, 3, 6, Hs);
      break;

    case 'spiky':
      s(grid, 5, 0, H); s(grid, 7, 0, H); s(grid, 10, 0, H);
      h(grid, 5, 1, 6, H);
      h(grid, 5, 2, 6, H);
      h(grid, 4, 3, 8, H);
      s(grid, 4, 4, H); s(grid, 11, 4, H);
      h(grid, 6, 3, 4, Hs);
      break;

    case 'long':
      h(grid, 6, 0, 4, H);
      h(grid, 5, 1, 6, H);
      h(grid, 4, 2, 8, H);
      s(grid, 4, 3, H); s(grid, 11, 3, H);
      s(grid, 4, 4, H); s(grid, 11, 4, H);
      s(grid, 3, 5, H); s(grid, 12, 5, H);
      s(grid, 3, 6, H); s(grid, 12, 6, H);
      s(grid, 3, 7, H); s(grid, 12, 7, H);
      s(grid, 3, 8, Hs); s(grid, 12, 8, Hs);
      s(grid, 4, 9, Hs); s(grid, 11, 9, Hs);
      break;

    case 'bangs':
      h(grid, 6, 1, 4, H);
      h(grid, 5, 2, 6, H);
      h(grid, 4, 3, 8, H);
      h(grid, 4, 4, 4, H);  // bangs cover left side
      s(grid, 11, 4, H);
      h(grid, 5, 3, 3, Hs);
      break;

    case 'curly':
      h(grid, 5, 0, 6, H);
      h(grid, 4, 1, 8, H);
      h(grid, 3, 2, 10, H);
      h(grid, 3, 3, 10, H);
      s(grid, 3, 4, H); s(grid, 12, 4, H);
      s(grid, 3, 5, H); s(grid, 12, 5, H);
      h(grid, 4, 3, 8, Hs);
      break;

    case 'buzz':
      h(grid, 5, 2, 6, H);
      h(grid, 4, 3, 8, Hs);
      break;

    case 'ponytail':
      h(grid, 6, 1, 4, H);
      h(grid, 5, 2, 6, H);
      h(grid, 4, 3, 8, H);
      s(grid, 12, 4, H); s(grid, 12, 5, H);
      s(grid, 12, 6, Hs); s(grid, 12, 7, Hs);
      s(grid, 11, 8, Hs);
      s(grid, 4, 4, H);
      h(grid, 5, 3, 6, Hs);
      break;

    case 'mohawk':
      h(grid, 7, 0, 2, H);
      h(grid, 7, 1, 2, H);
      h(grid, 6, 2, 4, H);
      h(grid, 5, 3, 6, Hs);
      s(grid, 4, 4, H); s(grid, 11, 4, H);
      break;

    case 'twintails':
      h(grid, 6, 1, 4, H);
      h(grid, 5, 2, 6, H);
      h(grid, 4, 3, 8, H);
      s(grid, 3, 4, H); s(grid, 4, 4, H);
      s(grid, 11, 4, H); s(grid, 12, 4, H);
      s(grid, 3, 5, H); s(grid, 12, 5, H);
      s(grid, 3, 6, H); s(grid, 12, 6, H);
      s(grid, 3, 7, Hs); s(grid, 12, 7, Hs);
      s(grid, 3, 8, Hs); s(grid, 12, 8, Hs);
      h(grid, 5, 3, 6, Hs);
      break;

    case 'swept':
      h(grid, 5, 1, 6, H);
      h(grid, 4, 2, 8, H);
      h(grid, 4, 3, 8, H);
      s(grid, 11, 4, H); s(grid, 12, 4, H);
      s(grid, 12, 5, Hs);
      s(grid, 4, 4, Hs);
      h(grid, 5, 3, 6, Hs);
      break;

    case 'messy':
      s(grid, 4, 0, H); s(grid, 8, 0, H); s(grid, 11, 0, H);
      h(grid, 5, 1, 7, H);
      s(grid, 3, 1, H);
      h(grid, 4, 2, 8, H);
      s(grid, 12, 2, H);
      h(grid, 3, 3, 10, H);
      s(grid, 3, 4, H); s(grid, 12, 4, H);
      s(grid, 3, 5, Hs); s(grid, 12, 5, Hs);
      h(grid, 4, 3, 8, Hs);
      break;

    case 'cap': {
      const capColor = look.shirt;
      const capDk = darken(capColor, 30);
      h(grid, 3, 1, 10, capColor);  // brim (wider than head!)
      h(grid, 4, 2, 8, capColor);   // cap body
      h(grid, 4, 3, 8, capDk);      // cap bottom edge
      s(grid, 4, 4, capDk); s(grid, 11, 4, capDk);
      break;
    }
  }
}

// ═══ Main export ═══

export function drawCharacterSprite(
  g: Graphics,
  x: number,
  y: number,
  agentId: string,
  isOwner: boolean = false,
) {
  const look = getAgentLook(agentId);

  // Ground shadow (alpha — drawn directly)
  g.ellipse(x + CHARACTER_WIDTH / 2, y + 33, 9, 3);
  g.fill({ color: 0x000000, alpha: 0.2 });

  // Build pixel grid
  const grid = createGrid();
  drawBody(grid, look);
  drawHair(grid, look);

  // Auto-generate 1px dark outline
  const outline = computeOutline(grid);

  // Render: outline first, fill on top
  renderGrid(g, x, y, outline);
  renderGrid(g, x, y, grid);

  // Eye highlights (alpha overlay)
  g.rect(x + 6 * P, y + 3 * P, P, 1);
  g.fill({ color: 0xffffff, alpha: 0.5 });
  g.rect(x + 9 * P, y + 3 * P, P, 1);
  g.fill({ color: 0xffffff, alpha: 0.5 });

  // Blush
  g.rect(x + 5 * P, y + 5 * P, P, P);
  g.fill({ color: 0xff9999, alpha: 0.15 });
  g.rect(x + 10 * P, y + 5 * P, P, P);
  g.fill({ color: 0xff9999, alpha: 0.15 });

  // Owner crown
  if (isOwner) {
    const cx = x + CHARACTER_WIDTH / 2;
    const cy = y - 2;
    g.rect(cx - 5, cy, 10, 4);
    g.fill(0xffcc00);
    g.rect(cx - 5, cy - 3, 2, 3);
    g.fill(0xffcc00);
    g.rect(cx - 1, cy - 4, 2, 4);
    g.fill(0xffcc00);
    g.rect(cx + 3, cy - 3, 2, 3);
    g.fill(0xffcc00);
    g.rect(cx - 3, cy + 1, 2, 2);
    g.fill(0xff5544);
    g.rect(cx + 1, cy + 1, 2, 2);
    g.fill(0x4488ff);
  }
}

// ═══ Status indicator ═══

export function drawStatusIndicator(
  g: Graphics,
  x: number,
  y: number,
  status: 'active' | 'idle' | 'offline',
  isWorking: boolean = false,
) {
  const cx = x + CHARACTER_WIDTH / 2 + 12;
  const cy = y + 3;

  g.circle(cx, cy, 5);
  g.fill(PALETTE.white);

  const color = isWorking ? PALETTE.statusWorking
    : status === 'active' ? PALETTE.statusReady
    : status === 'idle' ? PALETTE.statusIdle
    : PALETTE.statusOffline;

  g.circle(cx, cy, 3.5);
  g.fill(color);
}
