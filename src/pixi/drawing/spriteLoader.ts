import { Texture, TextureStyle } from 'pixi.js';

// Set global default BEFORE any textures are loaded — critical for pixel art
TextureStyle.defaultOptions.scaleMode = 'nearest';
import { SpriteAtlas } from './spriteAtlas';

export interface SpriteConfig {
  sheet: string;
  frame: { x: number; y: number; w: number; h: number };
  hasAlpha?: boolean;
  bgThreshold?: number;
}

// All sprite sheets disabled — using Pokemon sprites now
export const SPRITE_CONFIGS: Record<string, SpriteConfig> = {};

// ── Pokemon Assets ──

export interface PokemonAssets {
  interiorAtlas: SpriteAtlas;
  npcAtlas: SpriteAtlas;
  /** Pre-composed room backgrounds keyed by room id */
  roomTextures: Map<string, Texture>;
  /** Standalone per-agent sprite PNGs (overrides NPC atlas) */
  agentTextures: Map<string, Texture>;
  computerTexture: Texture | null;
  loaded: boolean;
}

let pokemonAssetsSingleton: PokemonAssets | null = null;

/**
 * Load Pokemon Emerald sprite assets.
 * Creates two SpriteAtlas instances (interior tileset + NPC overworld).
 * Returns a PokemonAssets singleton — safe to call multiple times.
 */
export async function loadPokemonAssets(): Promise<PokemonAssets> {
  if (pokemonAssetsSingleton?.loaded) return pokemonAssetsSingleton;

  const interiorAtlas = new SpriteAtlas('/sprites/pokemon/interior-tileset.png', 16);
  const npcAtlas = new SpriteAtlas('/sprites/pokemon/npc-overworld.png', 16);

  // Standalone per-agent sprite PNGs (override NPC atlas extraction)
  const agentSpritePaths: Record<string, string> = {
    'juan':          '/sprites/pokemon/juan-sprite.png',
    'manager':       '/sprites/pokemon/manager-sprite.png',
    'sa-main':       '/sprites/pokemon/lab-agent.png',
    'agent-d1':       '/sprites/pokemon/project-d-sprite.png',
    'content-writer': '/sprites/pokemon/sa-agent-sprite.png',
    'outreach':       '/sprites/pokemon/sa-agent-sprite.png',
    'proposals':      '/sprites/pokemon/sa-agent-sprite.png',
    'agent-b1':       '/sprites/pokemon/project-b-sprite.png',
    'agent-b2':       '/sprites/pokemon/project-b-sprite.png',
    'learn-bot':     '/sprites/pokemon/learn-sprite.png',
    'openclaw-bot':  '/sprites/pokemon/openclaw-sprite.png',
  };

  // Pre-composed room backgrounds
  const roomPaths: Record<string, string> = {
    'lab':     '/sprites/pokemon/lab-room.png',
    'sa-core': '/sprites/pokemon/sa-core-room.png',
    'saint':   '/sprites/pokemon/saint-office.png',
    'project-c':  '/sprites/pokemon/project-c-room.png',
    'project-d':  '/sprites/pokemon/project-d-room.png',
    'project-e':   '/sprites/pokemon/project-e-room.png',
    'library':     '/sprites/pokemon/university-room.png',
    'project-a':   '/sprites/pokemon/project-a-room.png',
    'project-b':   '/sprites/pokemon/project-b-room.png',
  };

  // Load all assets in parallel — graceful failure if files don't exist
  const roomEntries = Object.entries(roomPaths);
  const agentSpriteEntries = Object.entries(agentSpritePaths);
  const [interiorOk, npcOk, computerTexture, ...restResults] = await Promise.all([
    interiorAtlas.load(),
    npcAtlas.load(),
    loadTextureFromPath('/sprites/pokemon/computer-sprite.png'),
    ...roomEntries.map(([, path]) => loadTextureFromPath(path)),
    ...agentSpriteEntries.map(([, path]) => loadTextureWithBgRemoval(path)),
  ]);

  const roomTextures = new Map<string, Texture>();
  roomEntries.forEach(([id], i) => {
    const tex = restResults[i];
    if (tex) roomTextures.set(id, tex);
  });

  const agentTextures = new Map<string, Texture>();
  agentSpriteEntries.forEach(([id], i) => {
    const tex = restResults[roomEntries.length + i];
    if (tex) agentTextures.set(id, tex);
  });

  const loaded = interiorOk || npcOk;

  if (!loaded) {
    console.warn('Pokemon sprite assets not found — using procedural fallbacks');
  }

  pokemonAssetsSingleton = { interiorAtlas, npcAtlas, roomTextures, agentTextures, computerTexture, loaded };
  return pokemonAssetsSingleton;
}

/**
 * Get the singleton if already loaded, or null.
 */
export function getPokemonAssets(): PokemonAssets | null {
  return pokemonAssetsSingleton;
}

// ── Standalone texture loading ──

async function loadTextureFromPath(path: string): Promise<Texture | null> {
  try {
    const img = await loadImage(path);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0);
    const texture = Texture.from(canvas);
    texture.source.scaleMode = 'nearest';
    return texture;
  } catch {
    return null;
  }
}

/** Load a sprite PNG and remove its background color (sampled from top-left pixel). */
async function loadTextureWithBgRemoval(path: string, threshold = 30): Promise<Texture | null> {
  try {
    const img = await loadImage(path);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    // Sample background color from top-left pixel
    const bgR = data[0], bgG = data[1], bgB = data[2];

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      if (Math.abs(data[i] - bgR) < threshold &&
          Math.abs(data[i + 1] - bgG) < threshold &&
          Math.abs(data[i + 2] - bgB) < threshold) {
        data[i + 3] = 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);

    const texture = Texture.from(canvas);
    texture.source.scaleMode = 'nearest';
    return texture;
  } catch {
    return null;
  }
}

// ── Legacy sprite loading (kept for backwards compat) ──

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

async function loadSingleSprite(config: SpriteConfig): Promise<Texture> {
  const img = await loadImage(config.sheet);

  const { x, y, w, h } = config.frame;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, x, y, w, h, 0, 0, w, h);

  if (!config.hasAlpha) {
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const bgR = data[0];
    const bgG = data[1];
    const bgB = data[2];
    const threshold = config.bgThreshold ?? 30;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      if (Math.abs(data[i] - bgR) < threshold &&
          Math.abs(data[i + 1] - bgG) < threshold &&
          Math.abs(data[i + 2] - bgB) < threshold) {
        data[i + 3] = 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  const texture = Texture.from(canvas);
  texture.source.scaleMode = 'nearest';
  return texture;
}

export async function loadCharacterTextures(): Promise<Map<string, Texture>> {
  const textures = new Map<string, Texture>();

  const promises = Object.entries(SPRITE_CONFIGS).map(async ([agentId, config]) => {
    try {
      const texture = await loadSingleSprite(config);
      textures.set(agentId, texture);
    } catch (e) {
      console.warn(`Failed to load sprite for ${agentId}:`, e);
    }
  });

  await Promise.all(promises);
  return textures;
}
