import { Container, Sprite, Graphics, Texture } from 'pixi.js';
import { SpriteAtlas } from './spriteAtlas';
import { drawCharacterSprite as drawProceduralCharacter, drawStatusIndicator as drawProceduralStatus, getAgentLook } from './avatars';
import { PALETTE } from './palette';

// Pokemon Emerald NPC overworld sprite frame size
// Each frame is ~16x21 on the actual NPC sheet, displayed at 1.5x
const SCALE = 1.5;

// Exported character dimensions (used by AgentSprite, effects, etc.)
export const CHARACTER_WIDTH = 24;   // 16px * 1.5x scale
export const CHARACTER_HEIGHT = 36;  // ~24px * 1.5x scale

// ── NPC sprite positions on the actual sheet ──
// The NPC sheet (856x695) has characters in non-uniform bands.
// Each character type occupies a sub-band; facing-down (toward camera) row
// was identified via pixel-level analysis with sharp.
// Background removal handles any extra green pixels in the extraction region.
//
// Character assignments:
//   juan        → Old man with white beard (viejo con pelo blanco)
//   sa-main     → Researcher in white shirt (professor for the lab)
//   project-a   → Fat guy in blue overalls (el más gordo)
//   project-b   → Blonde lady
//   project-c   → Dark-haired researcher + Nurse Joy
//   project-d   → Green cyclist
//   project-e   → Pink cyclist + Green hiker

interface NPCRegion {
  x: number;
  y: number;
  w: number;
  h: number;
}

const NPC_REGIONS: Record<string, NPCRegion> = {
  // Old man with white beard — facing down y=126-146
  'juan':              { x: 671, y: 126, w: 14, h: 21 },
  // Manager — researcher variant
  'manager':           { x: 74,  y: 451, w: 16, h: 20 },
  // OpenClawBot — Krabby sprite
  'openclaw-bot':      { x: 38,  y: 451, w: 16, h: 20 },
  // Researcher white shirt — facing down y=451-470
  'sa-main':           { x: 1,   y: 451, w: 16, h: 20 },
  // Content Writer — Blonde lady variant
  'content-writer':    { x: 20,  y: 468, w: 16, h: 20 },
  // Outreach — Green hiker variant
  'outreach':          { x: 707, y: 126, w: 14, h: 21 },
  // Proposals — Nurse Joy variant
  'proposals':         { x: 20,  y: 400, w: 16, h: 20 },
  // Fat guy blue overalls — facing down y=325-344
  'agent-a1':          { x: 3,   y: 325, w: 16, h: 20 },
  'agent-a2':          { x: 3,   y: 325, w: 16, h: 20 },
  // Blonde lady — facing down y=468+
  'agent-b1':          { x: 2,   y: 468, w: 16, h: 20 },
  'agent-b2':          { x: 2,   y: 468, w: 16, h: 20 },
  // Scientist/hacker for lab bot — facing down
  'lab-bot':           { x: 38,  y: 451, w: 16, h: 20 },
  // Different researcher — facing down y=451-470
  'agent-c1':          { x: 56,  y: 451, w: 16, h: 20 },
  // Nurse Joy — y=396+
  'agent-c2':          { x: 1,   y: 400, w: 16, h: 20 },
  // Green cyclist — y=355+
  'agent-d1':          { x: 2,   y: 355, w: 16, h: 21 },
  // Pink cyclist — y=373+
  'agent-e1':          { x: 2,   y: 377, w: 16, h: 20 },
  // Green hiker — facing down y=126-146
  'agent-e2':          { x: 689, y: 126, w: 14, h: 21 },
  // Scientist for library/learning
  'learn-bot':         { x: 56,  y: 451, w: 16, h: 20 },
};

// Default region for unmapped agents (researcher)
const DEFAULT_NPC_REGION: NPCRegion = { x: 1, y: 451, w: 16, h: 20 };

/**
 * Get the standing-frame texture for an agent from the NPC atlas.
 * Uses background color removal since the sheet has a solid background.
 */
function getAgentNPCTexture(agentId: string, atlas: SpriteAtlas | null): Texture | null {
  if (!atlas?.loaded) return null;

  const region = NPC_REGIONS[agentId] ?? DEFAULT_NPC_REGION;
  return atlas.getRegionWithBgRemoval(region.x, region.y, region.w, region.h);
}

/**
 * Draw a Pokemon NPC overworld sprite for an agent.
 * Returns a Container (allows mixed sprite + graphics children).
 * Falls back to procedural pixel art if atlas not loaded.
 */
export function drawCharacterSprite(
  x: number,
  y: number,
  agentId: string,
  isOwner: boolean,
  npcAtlas: SpriteAtlas | null,
  customTexture: Texture | null = null,
): Container {
  const container = new Container();

  // Priority: custom standalone PNG > NPC atlas extraction > procedural fallback
  const texture = customTexture ?? getAgentNPCTexture(agentId, npcAtlas);

  if (texture) {
    // Ground shadow
    const shadow = new Graphics();
    shadow.ellipse(CHARACTER_WIDTH / 2, CHARACTER_HEIGHT - 3, 8, 3);
    shadow.fill({ color: 0x000000, alpha: 0.2 });
    container.addChild(shadow);

    // Scale to fit within CHARACTER_WIDTH x CHARACTER_HEIGHT, bottom-aligned
    const sprite = new Sprite(texture);
    if (customTexture) {
      // Custom sprites: scale to fit character box preserving aspect ratio
      const scaleX = CHARACTER_WIDTH / texture.width;
      const scaleY = CHARACTER_HEIGHT / texture.height;
      const s = Math.min(scaleX, scaleY);
      sprite.scale.set(s, s);
      const displayW = texture.width * s;
      const displayH = texture.height * s;
      sprite.x = Math.round((CHARACTER_WIDTH - displayW) / 2);
      sprite.y = CHARACTER_HEIGHT - 4 - displayH;
    } else {
      // NPC atlas: uniform scale
      sprite.scale.set(SCALE, SCALE);
      const displayW = texture.width * SCALE;
      const displayH = texture.height * SCALE;
      sprite.x = Math.round((CHARACTER_WIDTH - displayW) / 2);
      sprite.y = CHARACTER_HEIGHT - 4 - displayH;
    }
    container.addChild(sprite);

    // Owner crown
    if (isOwner) {
      const crown = createCrown(CHARACTER_WIDTH / 2, -2);
      container.addChild(crown);
    }
  } else {
    // Fallback: procedural pixel art character (original 32x36 avatars)
    const g = new Graphics();
    drawProceduralCharacter(g, 0, 0, agentId, isOwner);
    container.addChild(g);
  }

  container.x = x;
  container.y = y;
  return container;
}

/**
 * Draw status indicator dot.
 */
export function drawStatusIndicator(
  x: number,
  y: number,
  status: 'active' | 'idle' | 'offline',
  isWorking: boolean,
): Graphics {
  const g = new Graphics();
  drawProceduralStatus(g, x, y, status, isWorking);
  return g;
}

/**
 * Get the agent look config (for backward compat).
 */
export { getAgentLook } from './avatars';

// ── Helpers ──

function createCrown(cx: number, cy: number): Graphics {
  const g = new Graphics();
  g.rect(cx - 5, cy, 10, 4); g.fill(0xffcc00);
  g.rect(cx - 5, cy - 3, 2, 3); g.fill(0xffcc00);
  g.rect(cx - 1, cy - 4, 2, 4); g.fill(0xffcc00);
  g.rect(cx + 3, cy - 3, 2, 3); g.fill(0xffcc00);
  g.rect(cx - 3, cy + 1, 2, 2); g.fill(0xff5544);
  g.rect(cx + 1, cy + 1, 2, 2); g.fill(0x4488ff);
  return g;
}
