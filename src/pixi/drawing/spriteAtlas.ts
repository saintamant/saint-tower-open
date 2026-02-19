import { Texture, Rectangle } from 'pixi.js';

/**
 * SpriteAtlas: loads a sprite sheet and extracts rectangular regions as PixiJS Textures.
 * All textures use nearest-neighbor scaling for pixel-perfect GBA look.
 */
export class SpriteAtlas {
  private baseTexture: Texture | null = null;
  private imgElement: HTMLImageElement | null = null;
  private cache = new Map<string, Texture>();
  private tileSize: number;
  readonly loaded: boolean = false;

  constructor(
    private readonly sheetPath: string,
    tileSize = 16,
  ) {
    this.tileSize = tileSize;
  }

  async load(): Promise<boolean> {
    try {
      this.imgElement = await loadImage(this.sheetPath);
      const canvas = document.createElement('canvas');
      canvas.width = this.imgElement.width;
      canvas.height = this.imgElement.height;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.imgElement, 0, 0);

      this.baseTexture = Texture.from(canvas);
      this.baseTexture.source.scaleMode = 'nearest';
      (this as { loaded: boolean }).loaded = true;
      return true;
    } catch (e) {
      console.warn(`Failed to load sprite atlas: ${this.sheetPath}`, e);
      return false;
    }
  }

  /**
   * Get a tile by grid column/row (assumes uniform tile grid)
   */
  getTile(col: number, row: number, tilesWide = 1, tilesHigh = 1): Texture | null {
    if (!this.baseTexture) return null;

    const key = `tile:${col},${row},${tilesWide},${tilesHigh}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const texture = this.extractRegion(
      col * this.tileSize,
      row * this.tileSize,
      tilesWide * this.tileSize,
      tilesHigh * this.tileSize,
    );

    if (texture) this.cache.set(key, texture);
    return texture;
  }

  /**
   * Get an arbitrary rectangular region from the sheet
   */
  getRegion(x: number, y: number, w: number, h: number): Texture | null {
    if (!this.baseTexture) return null;

    const key = `region:${x},${y},${w},${h}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const texture = this.extractRegion(x, y, w, h);
    if (texture) this.cache.set(key, texture);
    return texture;
  }

  /**
   * Extract a region with background color removal.
   * Detects background from top-left pixel and makes matching pixels transparent.
   * Used for NPC sprites that have solid-color backgrounds.
   */
  getRegionWithBgRemoval(
    x: number, y: number, w: number, h: number,
    bgThreshold = 30,
  ): Texture | null {
    if (!this.imgElement) return null;

    const key = `bgremoval:${x},${y},${w},${h}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.imgElement, x, y, w, h, 0, 0, w, h);

      // Detect background color from top-left pixel
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;
      const bgR = data[0];
      const bgG = data[1];
      const bgB = data[2];

      // Remove background color
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] === 0) continue;
        if (
          Math.abs(data[i] - bgR) < bgThreshold &&
          Math.abs(data[i + 1] - bgG) < bgThreshold &&
          Math.abs(data[i + 2] - bgB) < bgThreshold
        ) {
          data[i + 3] = 0;
        }
      }
      ctx.putImageData(imageData, 0, 0);

      const texture = Texture.from(canvas);
      texture.source.scaleMode = 'nearest';
      this.cache.set(key, texture);
      return texture;
    } catch {
      return null;
    }
  }

  private extractRegion(x: number, y: number, w: number, h: number): Texture | null {
    if (!this.baseTexture) return null;

    try {
      const frame = new Rectangle(x, y, w, h);
      const texture = new Texture({
        source: this.baseTexture.source,
        frame,
      });
      texture.source.scaleMode = 'nearest';
      return texture;
    } catch {
      return null;
    }
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}
