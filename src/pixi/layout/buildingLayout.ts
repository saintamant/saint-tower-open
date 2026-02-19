import { BuildingLayout, RoomLayout, FurniturePlacement, AgentPlacement } from '@/types/tilemap';

// Canvas: 980x660 — 3 rows of offices
const ROOM_GAP = 6;
const LEFT_MARGIN = 30;
const TOP_MARGIN = 70; // space for roof sign

// ── Top row: SAINT private office | SA Core | Lab ──

const SAINT_W = 170;
const SA_CORE_W = 474;
const LAB_W = 244;

const SAINT: RoomLayout = {
  id: 'saint',
  position: { x: LEFT_MARGIN, y: TOP_MARGIN },
  size: { width: SAINT_W, height: 200 },
  floorType: 'wood',
  label: 'SAINT',
  color: '#e63946',
};

const SA_CORE_X = LEFT_MARGIN + SAINT_W + ROOM_GAP; // 206
const SA_CORE: RoomLayout = {
  id: 'sa-core',
  position: { x: SA_CORE_X, y: TOP_MARGIN },
  size: { width: SA_CORE_W, height: 200 },
  floorType: 'tile',
  label: 'SA CORE',
  color: '#0070f3',
};

const LAB_X = SA_CORE_X + SA_CORE_W + ROOM_GAP; // 716
const LAB: RoomLayout = {
  id: 'lab',
  position: { x: LAB_X, y: TOP_MARGIN },
  size: { width: LAB_W, height: 200 },
  floorType: 'tile',
  label: 'LAB',
  color: '#ff4488',
};

// ── Bottom row ──
const BOTTOM_Y = TOP_MARGIN + 200 + ROOM_GAP;

const PROJECT_C: RoomLayout = {
  id: 'project-c',
  position: { x: LEFT_MARGIN, y: BOTTOM_Y },
  size: { width: 220, height: 180 },
  floorType: 'tile',
  label: 'PROJECT C',
  color: '#0070f3',
};

const PROJECT_D: RoomLayout = {
  id: 'project-d',
  position: { x: LEFT_MARGIN + 220 + ROOM_GAP, y: BOTTOM_Y },
  size: { width: 220, height: 180 },
  floorType: 'tile',
  label: 'PROJECT D',
  color: '#f5a623',
};

// Project E — shrunk horizontally, was 448 now 280
const PROJECT_E: RoomLayout = {
  id: 'project-e',
  position: { x: LEFT_MARGIN + 446 + ROOM_GAP, y: BOTTOM_Y },
  size: { width: 280, height: 180 },
  floorType: 'grass',
  label: 'PROJECT E',
  color: '#00a86b',
};

// Library — after Project E
const LIB_X = LEFT_MARGIN + 446 + ROOM_GAP + 280 + ROOM_GAP;
const LIBRARY: RoomLayout = {
  id: 'library',
  position: { x: LIB_X, y: BOTTOM_Y },
  size: { width: 180, height: 180 },
  floorType: 'tile',
  label: 'LIBRARY',
  color: '#00bcd4',
};

// ── Third row: Project A | Project B ──
const THIRD_Y = BOTTOM_Y + 180 + ROOM_GAP;

const PROJECT_A: RoomLayout = {
  id: 'project-a',
  position: { x: LEFT_MARGIN, y: THIRD_Y },
  size: { width: 280, height: 180 },
  floorType: 'tile',
  label: 'PROJECT A',
  color: '#ffaa00',
};

const PROJECT_B: RoomLayout = {
  id: 'project-b',
  position: { x: LEFT_MARGIN + 280 + ROOM_GAP, y: THIRD_Y },
  size: { width: 240, height: 180 },
  floorType: 'tile',
  label: 'PROJECT B',
  color: '#88aaff',
};

const rooms: RoomLayout[] = [SAINT, SA_CORE, LAB, PROJECT_C, PROJECT_D, PROJECT_E, LIBRARY, PROJECT_A, PROJECT_B];

// ── Furniture ──
// Rooms with pre-composed sprites (saint, sa-core, lab) have no furniture here —
// their images already include desks, computers, etc.
const furniture: FurniturePlacement[] = [];

// ── Agent positions ──
const agents: AgentPlacement[] = [
  // Juan — in private SAINT office
  { agentId: 'juan',             position: { x: 78, y: 168 }, roomId: 'saint' },
  // Manager — in SAINT office next to Juan
  { agentId: 'manager',          position: { x: 135, y: 148 }, roomId: 'saint' },
  // OpenClawBot — Telegram bot in SAINT office
  { agentId: 'openclaw-bot',     position: { x: 55, y: 128 }, roomId: 'saint' },
  // SA Core agents — spread across 474px wide room
  { agentId: 'sa-main',         position: { x: SA_CORE_X + 60,  y: 190 }, roomId: 'sa-core' },
  { agentId: 'content-writer',  position: { x: SA_CORE_X + 170, y: 198 }, roomId: 'sa-core' },
  { agentId: 'outreach',        position: { x: SA_CORE_X + 280, y: 192 }, roomId: 'sa-core' },
  { agentId: 'proposals',       position: { x: SA_CORE_X + 390, y: 185 }, roomId: 'sa-core' },

  // Lab agents
  { agentId: 'lab-bot',         position: { x: LAB_X + 85,  y: 210 }, roomId: 'lab' },

  // Project A — own office (third row)
  { agentId: 'agent-a1',        position: { x: LEFT_MARGIN + 80,  y: THIRD_Y + 110 }, roomId: 'project-a' },
  { agentId: 'agent-a2',        position: { x: LEFT_MARGIN + 180, y: THIRD_Y + 110 }, roomId: 'project-a' },

  // Project B — own office (third row)
  { agentId: 'agent-b1',        position: { x: LEFT_MARGIN + 280 + ROOM_GAP + 70,  y: THIRD_Y + 110 }, roomId: 'project-b' },
  { agentId: 'agent-b2',        position: { x: LEFT_MARGIN + 280 + ROOM_GAP + 150, y: THIRD_Y + 110 }, roomId: 'project-b' },

  // Project C — two agents
  { agentId: 'agent-c1',        position: { x: 65,  y: 362 }, roomId: 'project-c' },
  { agentId: 'agent-c2',        position: { x: 175, y: 348 }, roomId: 'project-c' },

  // Project D
  { agentId: 'agent-d1',        position: { x: 325, y: 365 }, roomId: 'project-d' },

  // Project E — two agents
  { agentId: 'agent-e1',  position: { x: 545, y: 362 }, roomId: 'project-e' },
  { agentId: 'agent-e2',  position: { x: 640, y: 362 }, roomId: 'project-e' },

  // Library
  { agentId: 'learn-bot',      position: { x: LIB_X + 75, y: 365 }, roomId: 'library' },
];

export const buildingLayout: BuildingLayout = { rooms, furniture, agents };

// Base (unscaled) dimensions — used for layout coordinates
export const CANVAS_WIDTH = 980;
export const CANVAS_HEIGHT = 660;
export const ROOF_Y = TOP_MARGIN - 40;

// Scale factor — enlarges everything so interior elements are readable
export const BUILDING_SCALE = 1.4;
