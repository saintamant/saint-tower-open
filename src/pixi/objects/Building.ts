import { Container } from 'pixi.js';
import { Agent, HealthLevel } from '@/types/agent';
import { buildingLayout } from '../layout/buildingLayout';
import { createAllFurniture } from '../drawing/pokemonFurniture';
import { Room } from './Room';
import { AgentSprite } from './AgentSprite';
import { RoofSign } from './RoofSign';
import type { PokemonAssets } from '../drawing/spriteLoader';

export class Building extends Container {
  agentSprites: Map<string, AgentSprite> = new Map();
  juanSprite: AgentSprite | null = null;
  private rooms: Map<string, Room> = new Map();
  private roofSign: RoofSign;

  constructor(agents: Agent[], assets: PokemonAssets | null = null) {
    super();

    const interiorAtlas = assets?.interiorAtlas ?? null;
    const npcAtlas = assets?.npcAtlas ?? null;

    // Create agent lookup
    const agentMap = new Map(agents.map(a => [a.id, a]));

    // Roof sign
    this.roofSign = new RoofSign();
    this.addChild(this.roofSign);

    // Layer 1: Room backgrounds (floors + walls) — now Container-based
    for (const roomLayout of buildingLayout.rooms) {
      const room = new Room(roomLayout, assets);
      this.rooms.set(roomLayout.id, room);
      this.addChild(room);
    }

    // Layer 2: Furniture — skip rooms with pre-composed sprites (furniture already baked in)
    const roomsWithSprites = new Set(assets?.roomTextures?.keys() ?? []);
    const filteredFurniture = buildingLayout.furniture.filter(f => !roomsWithSprites.has(f.roomId));
    const furnitureContainer = createAllFurniture(filteredFurniture, interiorAtlas, assets?.computerTexture ?? null);
    this.addChild(furnitureContainer);

    // Layer 3: Agent sprites — now with Pokemon NPC sprites
    for (const placement of buildingLayout.agents) {
      const agent = agentMap.get(placement.agentId);
      if (!agent) continue;

      // Use DB-stored position if available, otherwise layout default
      const position = (agent.positionX != null && agent.positionY != null)
        ? { x: agent.positionX, y: agent.positionY }
        : placement.position;

      const customTex = assets?.agentTextures?.get(agent.id) ?? null;
      const sprite = new AgentSprite(agent, position, npcAtlas, customTex);
      this.agentSprites.set(agent.id, sprite);
      this.addChild(sprite);

      if (agent.id === 'juan') {
        this.juanSprite = sprite;
      }
    }

    // Layer 4: Room labels (ALWAYS on top — never hidden behind agents or furniture)
    const labelsLayer = new Container();
    for (const room of this.rooms.values()) {
      if (room.roomLabel) {
        labelsLayer.addChild(room.roomLabel);
      }
    }
    this.addChild(labelsLayer);
  }

  updateAgentStatus(agentId: string, status: Agent['status']) {
    const sprite = this.agentSprites.get(agentId);
    if (sprite) sprite.setStatus(status);
  }

  updateAgentTask(agentId: string, task: string | null) {
    const sprite = this.agentSprites.get(agentId);
    if (sprite) sprite.setCurrentTask(task);
  }

  updateAgentWorking(agentId: string, isWorking: boolean) {
    const sprite = this.agentSprites.get(agentId);
    if (sprite) sprite.setWorking(isWorking);
  }

  updateAgentUnread(agentId: string, unread: boolean) {
    const sprite = this.agentSprites.get(agentId);
    if (sprite) sprite.setUnread(unread);
  }

  triggerAgentSendFlash(agentId: string) {
    const sprite = this.agentSprites.get(agentId);
    if (sprite) sprite.triggerSendFlash();
  }

  triggerAgentReceiveFlash(agentId: string) {
    const sprite = this.agentSprites.get(agentId);
    if (sprite) sprite.triggerReceiveFlash();
  }

  updateRoomHealth(roomId: string, health: HealthLevel) {
    const room = this.rooms.get(roomId);
    if (room) room.setHealth(health);
  }

  updateRoomLastActive(roomId: string, timestamp: string | null) {
    const room = this.rooms.get(roomId);
    if (room) room.setLastActive(timestamp);
  }

  updateRoomStats(roomId: string, activeTasks: number, errors: number, activeAgentCount: number) {
    const room = this.rooms.get(roomId);
    if (room) room.setStats(activeTasks, errors, activeAgentCount);
  }

  tick(deltaTime: number) {
    for (const sprite of this.agentSprites.values()) {
      sprite.update(deltaTime);
    }
    for (const room of this.rooms.values()) {
      room.update(deltaTime);
    }
    this.roofSign.update(deltaTime);
  }
}
