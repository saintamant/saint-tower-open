// Gather.town inspired warm pixel-art palette
// Rich, high-contrast — warm woods, lush greens, inviting atmosphere

export const PALETTE = {
  // Background — deep dark void between rooms
  bgDark: 0x1c2128,
  bgVoid: 0x161b22,

  // Walls — much darker, higher contrast (Gather thick walls)
  wallFace: 0x3d3d50,
  wallTop: 0x52526a,
  wallShadow: 0x28283a,
  wallSide: 0x33334a,

  // Wood floor — richer warm honey tones
  woodLight: 0xd4a96a,
  woodMid: 0xc49858,
  woodDark: 0xb48848,
  woodLine: 0x9a7a45,

  // Tile floor — warmer cream
  tileLight: 0xe8e0d4,
  tileMid: 0xd8d0c4,
  tileDark: 0xc8c0b4,

  // Grass/carpet — lush greens
  carpetLight: 0x6aaa6a,
  carpetDark: 0x58965a,

  // Furniture — desk
  deskTop: 0x8b6f47,
  deskSide: 0x7a5f3a,
  deskLeg: 0x5a4a2a,

  // Furniture — computer
  screenFrame: 0x3a3a4a,
  screenBg: 0x1a3a5a,
  screenGlow: 0x5ab4e8,
  screenCode: 0x44dd88,

  // Furniture — chair
  chairSeat: 0x4a5a6a,
  chairBack: 0x3a4a5a,

  // Plants
  potBrown: 0x8b6244,
  potRim: 0x9a7254,
  leafGreen: 0x5aaa5a,
  leafDark: 0x4a8a4a,
  leafLight: 0x6abb6a,

  // Bookshelf
  shelfWood: 0xa08050,
  shelfBack: 0x3a3040,
  bookRed: 0xcc4444,
  bookBlue: 0x4488cc,
  bookGreen: 0x44aa66,
  bookYellow: 0xccaa44,
  bookPurple: 0x8855aa,

  // UI text
  white: 0xffffff,
  black: 0x000000,
  textDark: 0x333333,
  textDim: 0x8b949e,

  // Status — vivid Gather colors
  statusWorking: 0x56d364,
  statusReady: 0x58a6ff,
  statusActive: 0x56d364,
  statusIdle: 0xe3b341,
  statusOffline: 0x6e7681,

  // Health
  healthThriving: 0x56d364,
  healthNormal: 0x58a6ff,
  healthWarning: 0xe3b341,
  healthCritical: 0xf85149,
  healthEmpty: 0x484f58,

  // Name tags & bubbles
  tagBg: 0xffffff,
  tagBorder: 0xcccccc,
  bubbleBg: 0xffffff,
  bubbleBorder: 0xdddddd,

  // Room accent colors
  accentBlue: 0x58a6ff,
  accentAmber: 0xe3b341,
  accentPurple: 0xbc8cff,
  accentGreen: 0x56d364,
  accentRed: 0xf85149,
  accentTeal: 0x56d4dd,

  // Roof sign
  signBg: 0x1c2128,
  signBorder: 0x30363d,
  signText: 0xe6edf3,
  signAccent: 0x56d364,
} as const;
