export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface RoomLayout {
  id: string;
  position: Position;
  size: Size;
  floorType: 'wood' | 'tile' | 'grass' | 'mat';
  label: string;
  color: string;
}

export interface FurniturePlacement {
  type: 'desk' | 'computer' | 'plant' | 'bookshelf' | 'golfbag' | 'microscope' | 'flask' | 'testtubes' | 'whiteboard';
  position: Position;
  roomId: string;
}

export interface AgentPlacement {
  agentId: string;
  position: Position;
  roomId: string;
}

export interface BuildingLayout {
  rooms: RoomLayout[];
  furniture: FurniturePlacement[];
  agents: AgentPlacement[];
}
