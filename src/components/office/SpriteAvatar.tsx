'use client';

import { useEffect, useRef, useState } from 'react';

interface SpriteRegion {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Same regions as pokemonAvatars.ts — NPC spritesheet coordinates
const NPC_REGIONS: Record<string, SpriteRegion> = {
  'juan':              { x: 671, y: 126, w: 14, h: 21 },
  'manager':           { x: 74,  y: 451, w: 16, h: 20 },
  'openclaw-bot':      { x: 38,  y: 451, w: 16, h: 20 },
  'sa-main':           { x: 1,   y: 451, w: 16, h: 20 },
  'content-writer':    { x: 20,  y: 468, w: 16, h: 20 },
  'outreach':          { x: 707, y: 126, w: 14, h: 21 },
  'proposals':         { x: 20,  y: 400, w: 16, h: 20 },
  'agent-a1':          { x: 3,   y: 325, w: 16, h: 20 },
  'agent-a2':          { x: 3,   y: 325, w: 16, h: 20 },
  'agent-b1':          { x: 2,   y: 468, w: 16, h: 20 },
  'agent-b2':          { x: 2,   y: 468, w: 16, h: 20 },
  'lab-bot':           { x: 38,  y: 451, w: 16, h: 20 },
  'agent-c1':          { x: 56,  y: 451, w: 16, h: 20 },
  'agent-c2':          { x: 1,   y: 400, w: 16, h: 20 },
  'agent-d1':          { x: 2,   y: 355, w: 16, h: 21 },
  'agent-e1':          { x: 2,   y: 377, w: 16, h: 20 },
  'agent-e2':          { x: 689, y: 126, w: 14, h: 21 },
  'learn-bot':         { x: 56,  y: 451, w: 16, h: 20 },
};

// Standalone agent PNGs (override NPC atlas)
const CUSTOM_SPRITES: Record<string, string> = {
  'juan':          '/sprites/pokemon/juan-sprite.png',
  'manager':       '/sprites/pokemon/manager-sprite.png',
  'sa-main':       '/sprites/pokemon/lab-agent.png',
  'agent-d1':      '/sprites/pokemon/project-d-sprite.png',
  'content-writer': '/sprites/pokemon/sa-agent-sprite.png',
  'outreach':       '/sprites/pokemon/sa-agent-sprite.png',
  'proposals':      '/sprites/pokemon/sa-agent-sprite.png',
  'agent-b1':       '/sprites/pokemon/project-b-sprite.png',
  'agent-b2':       '/sprites/pokemon/project-b-sprite.png',
  'learn-bot':     '/sprites/pokemon/learn-sprite.png',
  'openclaw-bot':  '/sprites/pokemon/openclaw-sprite.png',
};

const NPC_SHEET = '/sprites/pokemon/npc-overworld.png';

// Cache extracted data URLs to avoid re-rendering
const spriteCache = new Map<string, string>();
let npcSheetImage: HTMLImageElement | null = null;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function extractWithBgRemoval(
  img: HTMLImageElement,
  sx: number, sy: number, sw: number, sh: number,
  outputSize: number,
  threshold = 30,
): string {
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  // Draw source region scaled to fill canvas, centered and bottom-aligned
  const scale = Math.min(outputSize / sw, outputSize / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  const dx = (outputSize - dw) / 2;
  const dy = outputSize - dh;
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);

  // Remove background color (sample from top-left of drawn area)
  const imageData = ctx.getImageData(0, 0, outputSize, outputSize);
  const data = imageData.data;

  // Find the background color by sampling corners
  let bgR = 0, bgG = 0, bgB = 0;
  // Sample from the top-left corner area
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      bgR = data[i];
      bgG = data[i + 1];
      bgB = data[i + 2];
      break;
    }
  }

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    if (Math.abs(data[i] - bgR) < threshold &&
        Math.abs(data[i + 1] - bgG) < threshold &&
        Math.abs(data[i + 2] - bgB) < threshold) {
      data[i + 3] = 0;
    }
  }
  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL();
}

interface SpriteAvatarProps {
  agentId: string;
  size?: number;
}

export default function SpriteAvatar({ agentId, size = 32 }: SpriteAvatarProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(spriteCache.get(agentId) ?? null);

  useEffect(() => {
    if (spriteCache.has(agentId)) {
      setDataUrl(spriteCache.get(agentId)!);
      return;
    }

    let cancelled = false;

    async function extract() {
      try {
        const customPath = CUSTOM_SPRITES[agentId];
        if (customPath) {
          // Custom sprite PNG — load and extract with bg removal
          const img = await loadImage(customPath);
          const url = extractWithBgRemoval(img, 0, 0, img.width, img.height, size * 2);
          if (!cancelled) {
            spriteCache.set(agentId, url);
            setDataUrl(url);
          }
        } else {
          // NPC spritesheet extraction
          const region = NPC_REGIONS[agentId];
          if (!region) return;

          if (!npcSheetImage) {
            npcSheetImage = await loadImage(NPC_SHEET);
          }

          const url = extractWithBgRemoval(
            npcSheetImage, region.x, region.y, region.w, region.h, size * 2
          );
          if (!cancelled) {
            spriteCache.set(agentId, url);
            setDataUrl(url);
          }
        }
      } catch {
        // Silently fail — will show fallback
      }
    }

    extract();
    return () => { cancelled = true; };
  }, [agentId, size]);

  if (!dataUrl) {
    return (
      <div
        className="rounded-lg bg-bg-card"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt=""
      width={size}
      height={size}
      className="block"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
