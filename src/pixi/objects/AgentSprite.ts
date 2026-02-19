import { Container, Graphics, Text, TextStyle, EventEmitter, Texture } from 'pixi.js';
import { Agent, AgentStatus } from '@/types/agent';
import { Position } from '@/types/tilemap';
import {
  drawCharacterSprite as drawPokemonCharacter,
  drawStatusIndicator as drawPokemonStatus,
  CHARACTER_WIDTH, CHARACTER_HEIGHT,
} from '../drawing/pokemonAvatars';
import {
  createActiveGlow, createReadyGlow,
  createWorkingIndicator, createReadyIndicator, createZzzEffect,
  createCompletionFlash, createUnreadBadge,
  createSendFlash, createReceiveFlash,
  animateGlow, animateReadyGlow, animateWorkingIndicator, animateZzz,
  animateCompletionFlash, animateUnreadBadge,
  animateSendFlash, animateReceiveFlash,
} from '../drawing/effects';
import { TaskBubble } from './TaskBubble';
import { PALETTE } from '../drawing/palette';
import { SpriteAtlas } from '../drawing/spriteAtlas';

const NUNITO_FONT = 'Nunito, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';

// Re-export for TowerRenderer movement bounds
export { CHARACTER_WIDTH, CHARACTER_HEIGHT };

export type VisualState = 'working' | 'ready' | 'idle' | 'offline';

export class AgentSprite extends Container {
  agentData: Agent;
  private characterContainer: Container;
  private statusIndicator: Graphics | null = null;
  private glow: Graphics | null = null;
  private workingIndicator: Container | null = null;
  private readyIndicator: Container | null = null;
  private zzzEffect: Container | null = null;
  private completionFlash: Container | null = null;
  private completionStartTime = 0;
  private sendFlash: Container | null = null;
  private sendFlashProgress = 0;
  private receiveFlash: Container | null = null;
  private receiveFlashProgress = 0;
  private _elapsed = 0;
  private _bobPhase = Math.random() * Math.PI * 2;
  private _visualState: VisualState = 'offline';
  private _isWorking = false;
  private _unread = false;
  private unreadBadge: Container | null = null;
  private taskBubble: TaskBubble;
  private npcAtlas: SpriteAtlas | null;
  readonly events = new EventEmitter();

  constructor(agent: Agent, position: Position, npcAtlas: SpriteAtlas | null = null, customTexture: Texture | null = null) {
    super();
    this.agentData = agent;
    this.npcAtlas = npcAtlas;
    this.x = position.x;
    this.y = position.y;
    this.eventMode = 'static';
    this.cursor = 'pointer';

    const isOwner = agent.id === 'juan';

    // Draw character sprite (custom PNG > NPC atlas > procedural fallback)
    this.characterContainer = drawPokemonCharacter(0, 0, agent.id, isOwner, npcAtlas, customTexture);
    this.addChild(this.characterContainer);

    // Name tag — golden for owner, white for others
    const nameTag = this.createNameTag(agent.displayName, isOwner);
    nameTag.x = CHARACTER_WIDTH / 2 - nameTag.width / 2;
    nameTag.y = -14;
    this.addChild(nameTag);

    // Hit area (slightly larger for taller Pokemon sprites)
    this.hitArea = {
      contains: (hx: number, hy: number) => {
        return hx >= -4 && hx <= CHARACTER_WIDTH + 4 && hy >= -16 && hy <= CHARACTER_HEIGHT + 4;
      },
    };

    // Task bubble above
    const borderColor = parseInt(agent.spriteColor.replace('#', ''), 16);
    this.taskBubble = new TaskBubble(borderColor);
    this.taskBubble.x = CHARACTER_WIDTH / 2 - 40;
    this.taskBubble.y = -36;
    this.addChild(this.taskBubble);

    if (agent.currentTask) {
      this.taskBubble.setTask(agent.currentTask);
    }

    this.setStatus(agent.status);

    // Events
    this.on('pointerover', () => this.events.emit('hover', agent));
    this.on('pointerout', () => this.events.emit('hoverEnd', agent));
    this.on('pointertap', () => this.events.emit('click', agent));
  }

  private createNameTag(name: string, isOwner = false): Container {
    const container = new Container();

    const text = new Text({
      text: isOwner ? `★ ${name}` : name,
      style: new TextStyle({
        fontFamily: NUNITO_FONT,
        fontSize: isOwner ? 9 : 8,
        fill: isOwner ? 0x1a1a2e : PALETTE.textDark,
        fontWeight: '700',
      }),
    });

    const padX = isOwner ? 6 : 5;
    const padY = 2.5;
    const w = text.width + padX * 2;
    const h = text.height + padY * 2;

    const bg = new Graphics();
    if (isOwner) {
      // Gold gradient-like background with gold border
      bg.roundRect(0, 0, w, h, 5);
      bg.fill({ color: 0xffd700, alpha: 0.95 });
      bg.roundRect(0, 0, w, h, 5);
      bg.stroke({ color: 0xb8860b, width: 1, alpha: 0.8 });
    } else {
      bg.roundRect(0, 0, w, h, 4);
      bg.fill({ color: PALETTE.white, alpha: 0.92 });
      bg.roundRect(0, 0, w, h, 4);
      bg.stroke({ color: PALETTE.tagBorder, width: 0.5, alpha: 0.4 });
    }

    text.x = padX;
    text.y = padY;

    container.addChild(bg);
    container.addChild(text);

    return container;
  }

  private clearEffects() {
    if (this.glow) { this.removeChild(this.glow); this.glow = null; }
    if (this.statusIndicator) { this.removeChild(this.statusIndicator); this.statusIndicator = null; }
    if (this.workingIndicator) { this.removeChild(this.workingIndicator); this.workingIndicator = null; }
    if (this.readyIndicator) { this.removeChild(this.readyIndicator); this.readyIndicator = null; }
    if (this.zzzEffect) { this.removeChild(this.zzzEffect); this.zzzEffect = null; }
  }

  setStatus(status: AgentStatus) {
    this.agentData.status = status;
    this.applyVisualState();
  }

  setWorking(working: boolean) {
    if (this._isWorking === working) return;
    this._isWorking = working;
    this.applyVisualState();
  }

  setUnread(unread: boolean) {
    if (this._unread === unread) return;
    this._unread = unread;
    if (unread && !this.unreadBadge) {
      this.unreadBadge = createUnreadBadge();
      this.addChild(this.unreadBadge);
    } else if (!unread && this.unreadBadge) {
      this.removeChild(this.unreadBadge);
      this.unreadBadge = null;
    }
  }

  triggerCompletion() {
    if (this.completionFlash) {
      this.removeChild(this.completionFlash);
    }
    this.completionFlash = createCompletionFlash();
    this.completionStartTime = this._elapsed;
    this.addChild(this.completionFlash);
  }

  triggerSendFlash() {
    if (this.sendFlash) this.removeChild(this.sendFlash);
    this.sendFlash = createSendFlash();
    this.sendFlashProgress = 0;
    this.addChild(this.sendFlash);
  }

  triggerReceiveFlash() {
    if (this.receiveFlash) this.removeChild(this.receiveFlash);
    this.receiveFlash = createReceiveFlash();
    this.receiveFlashProgress = 0;
    this.addChild(this.receiveFlash);
  }

  private applyVisualState() {
    this.clearEffects();

    const status = this.agentData.status;
    if (status === 'offline') {
      this._visualState = 'offline';
    } else if (status === 'active' || this._isWorking) {
      this._visualState = 'working';
    } else if (status === 'idle') {
      this._visualState = 'idle';
    } else {
      this._visualState = 'ready';
    }

    // Status indicator dot
    this.statusIndicator = drawPokemonStatus(0, 0, status, this._isWorking);
    // Adjust position for potentially taller Pokemon sprites
    this.statusIndicator.x = CHARACTER_WIDTH / 2 + 12 - (CHARACTER_WIDTH / 2 + 12);
    this.addChild(this.statusIndicator);

    switch (this._visualState) {
      case 'working':
        this.alpha = 1;
        this.glow = createActiveGlow(0, 0, CHARACTER_WIDTH, CHARACTER_HEIGHT);
        this.addChildAt(this.glow, 0);
        this.workingIndicator = createWorkingIndicator();
        this.addChild(this.workingIndicator);
        break;

      case 'ready':
        this.alpha = 1;
        this.glow = createReadyGlow(0, 0, CHARACTER_WIDTH, CHARACTER_HEIGHT);
        this.addChildAt(this.glow, 0);
        this.readyIndicator = createReadyIndicator();
        this.addChild(this.readyIndicator);
        break;

      case 'idle':
        this.alpha = 1;
        this.zzzEffect = createZzzEffect();
        this.addChild(this.zzzEffect);
        break;

      case 'offline':
        this.alpha = 1;
        break;
    }
  }

  setCurrentTask(task: string | null) {
    this.agentData.currentTask = task ?? undefined;
    this.taskBubble.setTask(task);
  }

  update(deltaTime: number) {
    this._elapsed += deltaTime / 60;

    // Subtle idle bobbing (character breathing)
    if (this.agentData.status !== 'offline') {
      const bob = Math.sin((this._elapsed + this._bobPhase) * 1.5) * 1;
      this.characterContainer.y = bob;
    }

    // Animate effects based on visual state
    switch (this._visualState) {
      case 'working':
        if (this.glow) animateGlow(this.glow, this._elapsed);
        if (this.workingIndicator) animateWorkingIndicator(this.workingIndicator, this._elapsed);
        break;
      case 'ready':
        if (this.glow) animateReadyGlow(this.glow, this._elapsed);
        break;
      case 'idle':
        if (this.zzzEffect) animateZzz(this.zzzEffect, this._elapsed);
        break;
    }

    // Animate unread badge
    if (this.unreadBadge) animateUnreadBadge(this.unreadBadge, this._elapsed);

    // Animate completion flash if active
    if (this.completionFlash) {
      const done = animateCompletionFlash(this.completionFlash, this._elapsed, this.completionStartTime);
      if (done) {
        this.removeChild(this.completionFlash);
        this.completionFlash = null;
      }
    }

    // Animate send flash (capped delta to survive React re-render stalls)
    if (this.sendFlash) {
      this.sendFlashProgress += Math.min(deltaTime / 60, 0.034);
      const done = animateSendFlash(this.sendFlash, this.sendFlashProgress);
      if (done) {
        this.removeChild(this.sendFlash);
        this.sendFlash = null;
      }
    }

    // Animate receive flash (capped delta to survive React re-render stalls)
    if (this.receiveFlash) {
      this.receiveFlashProgress += Math.min(deltaTime / 60, 0.034);
      const done = animateReceiveFlash(this.receiveFlash, this.receiveFlashProgress);
      if (done) {
        this.removeChild(this.receiveFlash);
        this.receiveFlash = null;
      }
    }

    this.taskBubble.update(deltaTime);
  }
}
