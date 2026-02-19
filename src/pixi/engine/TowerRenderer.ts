import { Application, Graphics } from 'pixi.js';
import { Agent, HealthLevel } from '@/types/agent';
import { Building } from '../objects/Building';
import { CANVAS_WIDTH, CANVAS_HEIGHT, BUILDING_SCALE } from '../layout/buildingLayout';
import { PALETTE } from '../drawing/palette';
import { AgentSprite, CHARACTER_WIDTH, CHARACTER_HEIGHT } from '../objects/AgentSprite';
import { loadPokemonAssets, PokemonAssets } from '../drawing/spriteLoader';

export interface TowerCallbacks {
  onAgentHover?: (agent: Agent | null) => void;
  onAgentClick?: (agent: Agent) => void;
}

const MOVE_SPEED = 2.5; // pixels per frame
const POSITION_SAVE_DELAY = 1000; // ms after last keypress

export class TowerRenderer {
  app: Application;
  building: Building | null = null;
  private callbacks: TowerCallbacks;
  private initialized = false;
  private destroyed = false;
  private keysPressed = new Set<string>();
  private keyDownHandler: ((e: KeyboardEvent) => void) | null = null;
  private keyUpHandler: ((e: KeyboardEvent) => void) | null = null;
  private pokemonAssets: PokemonAssets | null = null;
  private selectedSprite: AgentSprite | null = null;
  private selectionRing: Graphics | null = null;
  private positionSaveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(callbacks: TowerCallbacks = {}) {
    this.app = new Application();
    this.callbacks = callbacks;
  }

  async init(container: HTMLElement) {
    // Load Pokemon sprite assets in parallel with Pixi init
    const [, assets] = await Promise.all([
      this.app.init({
        width: Math.round(CANVAS_WIDTH * BUILDING_SCALE),
        height: Math.round(CANVAS_HEIGHT * BUILDING_SCALE),
        background: PALETTE.bgDark,
        antialias: false,
        roundPixels: true,
        resolution: 2,
        autoDensity: true,
      }),
      loadPokemonAssets(),
    ]);

    this.pokemonAssets = assets;

    // If destroy was called while init was running, clean up now
    if (this.destroyed) {
      this.app.destroy(true, { children: true });
      return;
    }

    this.initialized = true;
    const canvas = this.app.canvas as HTMLCanvasElement;
    canvas.style.imageRendering = 'pixelated';
    container.appendChild(canvas);

    // Keyboard listeners for Juan movement
    this.keyDownHandler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
        this.keysPressed.add(key);
      }
    };
    this.keyUpHandler = (e: KeyboardEvent) => {
      this.keysPressed.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', this.keyDownHandler);
    window.addEventListener('keyup', this.keyUpHandler);
  }

  async loadAgents(agents: Agent[]) {
    if (this.destroyed || !this.initialized) return;

    // Remove old building
    if (this.building) {
      this.app.stage.removeChild(this.building);
      this.building.destroy({ children: true });
    }

    // Pass Pokemon assets to Building
    this.building = new Building(agents, this.pokemonAssets);
    this.building.scale.set(BUILDING_SCALE);
    this.app.stage.addChild(this.building);

    // Wire up callbacks — click selects agent for WASD movement
    for (const sprite of this.building.agentSprites.values()) {
      sprite.events.on('hover', (agent: Agent) => {
        this.callbacks.onAgentHover?.(agent);
      });
      sprite.events.on('hoverEnd', () => {
        this.callbacks.onAgentHover?.(null);
      });
      sprite.events.on('click', (agent: Agent) => {
        this.selectAgent(sprite);
        this.callbacks.onAgentClick?.(agent);
      });
    }

    // Select Juan by default
    if (this.building.juanSprite) {
      this.selectAgent(this.building.juanSprite);
    }

    // Start animation ticker
    this.app.ticker.add((ticker) => {
      this.building?.tick(ticker.deltaTime);
      this.moveSelected(ticker.deltaTime);
      this.animateSelectionRing(ticker.deltaTime);
    });
  }

  private selectAgent(sprite: AgentSprite) {
    this.selectedSprite = sprite;

    // Remove old ring
    if (this.selectionRing) {
      this.selectionRing.parent?.removeChild(this.selectionRing);
      this.selectionRing.destroy();
      this.selectionRing = null;
    }

    // Create selection ring under the character
    const ring = new Graphics();
    ring.ellipse(CHARACTER_WIDTH / 2, CHARACTER_HEIGHT - 2, 14, 5);
    ring.stroke({ color: 0x00ff88, width: 1.5, alpha: 0.9 });
    ring.ellipse(CHARACTER_WIDTH / 2, CHARACTER_HEIGHT - 2, 14, 5);
    ring.fill({ color: 0x00ff88, alpha: 0.15 });
    this.selectionRing = ring;
    sprite.addChildAt(ring, 0);
  }

  private _selectionElapsed = 0;

  private animateSelectionRing(deltaTime: number) {
    if (!this.selectionRing) return;
    this._selectionElapsed += deltaTime / 60;
    const pulse = 0.6 + Math.sin(this._selectionElapsed * 3) * 0.4;
    this.selectionRing.alpha = pulse;
  }

  private moveSelected(deltaTime: number) {
    const sprite = this.selectedSprite;
    if (!sprite) return;

    let dx = 0;
    let dy = 0;

    if (this.keysPressed.has('w') || this.keysPressed.has('arrowup')) dy -= 1;
    if (this.keysPressed.has('s') || this.keysPressed.has('arrowdown')) dy += 1;
    if (this.keysPressed.has('a') || this.keysPressed.has('arrowleft')) dx -= 1;
    if (this.keysPressed.has('d') || this.keysPressed.has('arrowright')) dx += 1;

    if (dx === 0 && dy === 0) return;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const norm = 1 / Math.sqrt(2);
      dx *= norm;
      dy *= norm;
    }

    const speed = MOVE_SPEED * deltaTime;
    const newX = sprite.x + dx * speed;
    const newY = sprite.y + dy * speed;

    // Clamp to canvas bounds
    sprite.x = Math.max(5, Math.min(CANVAS_WIDTH - CHARACTER_WIDTH - 5, newX));
    sprite.y = Math.max(5, Math.min(CANVAS_HEIGHT - CHARACTER_HEIGHT - 5, newY));

    // Debounced save to DB
    this.scheduleSavePosition(sprite);
  }

  private scheduleSavePosition(sprite: AgentSprite) {
    if (this.positionSaveTimer) clearTimeout(this.positionSaveTimer);
    this.positionSaveTimer = setTimeout(() => {
      const agentId = sprite.agentData.id;
      fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionX: sprite.x, positionY: sprite.y }),
      }).catch(() => {});
    }, POSITION_SAVE_DELAY);
  }

  updateAgentStatus(agentId: string, status: Agent['status']) {
    this.building?.updateAgentStatus(agentId, status);
  }

  updateAgentTask(agentId: string, task: string | null) {
    this.building?.updateAgentTask(agentId, task);
  }

  updateAgentWorking(agentId: string, isWorking: boolean) {
    this.building?.updateAgentWorking(agentId, isWorking);
  }

  updateAgentUnread(agentId: string, unread: boolean) {
    this.building?.updateAgentUnread(agentId, unread);
  }

  triggerAgentSendFlash(agentId: string) {
    this.building?.triggerAgentSendFlash(agentId);
  }

  triggerAgentReceiveFlash(agentId: string) {
    this.building?.triggerAgentReceiveFlash(agentId);
  }

  updateRoomHealth(roomId: string, health: HealthLevel) {
    this.building?.updateRoomHealth(roomId, health);
  }

  updateRoomLastActive(roomId: string, timestamp: string | null) {
    this.building?.updateRoomLastActive(roomId, timestamp);
  }

  updateRoomStats(roomId: string, activeTasks: number, errors: number, activeAgentCount: number) {
    this.building?.updateRoomStats(roomId, activeTasks, errors, activeAgentCount);
  }

  destroy() {
    this.destroyed = true;
    if (this.positionSaveTimer) clearTimeout(this.positionSaveTimer);

    // Remove keyboard listeners
    if (this.keyDownHandler) {
      window.removeEventListener('keydown', this.keyDownHandler);
      this.keyDownHandler = null;
    }
    if (this.keyUpHandler) {
      window.removeEventListener('keyup', this.keyUpHandler);
      this.keyUpHandler = null;
    }

    if (this.initialized) {
      try {
        this.app.destroy(true, { children: true });
      } catch {
        // Ignore destroy errors during cleanup
      }
    }
  }
}
