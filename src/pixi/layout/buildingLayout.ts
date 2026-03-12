import { BuildingLayout, RoomLayout, FurniturePlacement, AgentPlacement } from '@/types/tilemap';

// Canvas: 980x660 — 3 rows of offices
const ROOM_GAP = 6;
const LEFT_MARGIN = 30;
const TOP_MARGIN = 10;

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
  // SAINT room
  { agentId: 'juan',            position: { x: 78,  y: 175 }, roomId: 'saint' },
  { agentId: 'openclaw-bot',    position: { x: 45,  y: 92 },  roomId: 'saint' },
  { agentId: 'manager',         position: { x: 150, y: 85 },  roomId: 'saint' },

  // SA Core — spread across 474px wide room
  { agentId: 'sa-main',         position: { x: SA_CORE_X + 100, y: 155 }, roomId: 'sa-core' },
  { agentId: 'content-writer',  position: { x: SA_CORE_X + 195, y: 128 }, roomId: 'sa-core' },
  { agentId: 'outreach',        position: { x: SA_CORE_X + 305, y: 132 }, roomId: 'sa-core' },
  { agentId: 'proposals',       position: { x: SA_CORE_X + 420, y: 105 }, roomId: 'sa-core' },

  // Lab
  { agentId: 'lab-bot',         position: { x: LAB_X + 130, y: 172 }, roomId: 'lab' },

  // Project C
  { agentId: 'agent-c1',        position: { x: 55,  y: 352 }, roomId: 'project-c' },
  { agentId: 'agent-c2',        position: { x: 165, y: 335 }, roomId: 'project-c' },

  // Project D
  { agentId: 'agent-d1',        position: { x: 340, y: 358 }, roomId: 'project-d' },

  // Project E
  { agentId: 'agent-e1',        position: { x: 555, y: 342 }, roomId: 'project-e' },
  { agentId: 'agent-e2',        position: { x: 635, y: 305 }, roomId: 'project-e' },

  // Library
  { agentId: 'learn-bot',       position: { x: LIB_X + 90, y: 335 }, roomId: 'library' },

  // Project A (third row)
  { agentId: 'agent-a1',        position: { x: LEFT_MARGIN + 75,  y: THIRD_Y + 118 }, roomId: 'project-a' },
  { agentId: 'agent-a2',        position: { x: LEFT_MARGIN + 175, y: THIRD_Y + 118 }, roomId: 'project-a' },

  // Project B (third row)
  { agentId: 'agent-b1',        position: { x: LEFT_MARGIN + 280 + ROOM_GAP + 75,  y: THIRD_Y + 112 }, roomId: 'project-b' },
  { agentId: 'agent-b2',        position: { x: LEFT_MARGIN + 280 + ROOM_GAP + 155, y: THIRD_Y + 112 }, roomId: 'project-b' },
];

export const buildingLayout: BuildingLayout = { rooms, furniture, agents };

// Base (unscaled) dimensions — used for layout coordinates
export const CANVAS_WIDTH = 980;
export const CANVAS_HEIGHT = 600;

// Scale factor — enlarges everything so interior elements are readable
export const BUILDING_SCALE = 1.4;
