import { Graphics } from 'pixi.js';

// Anime chibi characters — 32x48 pixel art
// Each agent is a recognizable anime character

export const CHARACTER_WIDTH = 32;
export const CHARACTER_HEIGHT = 48;

// ── Shared palette ──
const SKIN = 0xffd5b8;
const SKIN_SH = 0xe8b898;
const EYE_W = 0xffffff;
const EYE_HI = 0xaaddff; // eye reflection
const MOUTH = 0xdd8888;

// ── Helpers ──

function darken(color: number, amt: number): number {
  const r = Math.max(0, ((color >> 16) & 0xff) * (1 - amt)) | 0;
  const g = Math.max(0, ((color >> 8) & 0xff) * (1 - amt)) | 0;
  const b = Math.max(0, (color & 0xff) * (1 - amt)) | 0;
  return (r << 16) | (g << 8) | b;
}

function lighten(color: number, amt: number): number {
  const r = Math.min(255, ((color >> 16) & 0xff) * (1 + amt)) | 0;
  const g = Math.min(255, ((color >> 8) & 0xff) * (1 + amt)) | 0;
  const b = Math.min(255, (color & 0xff) * (1 + amt)) | 0;
  return (r << 16) | (g << 8) | b;
}

/** Standard anime eyes — 6x5 each, placed at face level */
function drawEyes(g: Graphics, x: number, y: number, iris: number, opts?: {
  coverLeft?: boolean; coverRight?: boolean;
  geassLeft?: boolean; darkCircles?: boolean;
  narrow?: boolean; fierce?: boolean;
}) {
  const ey = y + 13;
  const lx = x + 6;
  const rx = x + 19;

  if (opts?.darkCircles) {
    g.rect(lx - 1, ey - 1, 8, 7); g.fill({ color: 0x332244, alpha: 0.3 });
    g.rect(rx - 1, ey - 1, 8, 7); g.fill({ color: 0x332244, alpha: 0.3 });
  }

  for (const [ex, side] of [[lx, 'left'], [rx, 'right']] as const) {
    if (side === 'left' && opts?.coverLeft) continue;
    if (side === 'right' && opts?.coverRight) continue;

    const h = opts?.narrow ? 3 : 5;
    const irisH = opts?.narrow ? 2 : 3;

    // White
    g.rect(ex, ey, 6, h); g.fill(EYE_W);

    // Iris
    const irisColor = (side === 'left' && opts?.geassLeft) ? 0xff0022 : iris;
    g.rect(ex + 1, ey + 1, 4, irisH); g.fill(irisColor);

    // Pupil
    g.rect(ex + 2, ey + 1, 2, 2); g.fill(0x111111);

    // Reflection
    g.rect(ex + 1, ey, 1, 1); g.fill(EYE_HI);
    if (!opts?.narrow) {
      g.rect(ex + 4, ey + 2, 1, 1); g.fill({ color: 0xffffff, alpha: 0.4 });
    }

    // Upper lash line (anime style)
    g.rect(ex, ey - 1, 6, 1); g.fill(0x222233);

    if (opts?.fierce) {
      // Angry eyebrow
      g.rect(ex - 1, ey - 3, 7, 2); g.fill(0x222233);
    }
  }
}

/** Standard face base */
function drawFace(g: Graphics, x: number, y: number) {
  // Face oval
  g.roundRect(x + 5, y + 8, 22, 16, 4); g.fill(SKIN);
  g.roundRect(x + 7, y + 20, 18, 6, 3); g.fill(SKIN);
  // Cheek blush
  g.rect(x + 6, y + 18, 3, 2); g.fill({ color: 0xff8888, alpha: 0.2 });
  g.rect(x + 23, y + 18, 3, 2); g.fill({ color: 0xff8888, alpha: 0.2 });
}

/** Nose hint */
function drawNose(g: Graphics, x: number, y: number) {
  g.rect(x + 15, y + 19, 2, 2); g.fill(SKIN_SH);
}

/** Small mouth */
function drawMouthLine(g: Graphics, x: number, y: number) {
  g.rect(x + 13, y + 22, 6, 1); g.fill(MOUTH);
}

/** Smile */
function drawSmile(g: Graphics, x: number, y: number) {
  g.rect(x + 12, y + 22, 8, 1); g.fill(MOUTH);
  g.rect(x + 13, y + 23, 6, 1); g.fill(darken(MOUTH, 0.15));
}

/** Smirk (one side up) */
function drawSmirk(g: Graphics, x: number, y: number) {
  g.rect(x + 14, y + 22, 6, 1); g.fill(MOUTH);
  g.rect(x + 18, y + 21, 2, 1); g.fill(MOUTH);
}

/** Neck */
function drawNeck(g: Graphics, x: number, y: number) {
  g.rect(x + 13, y + 25, 6, 3); g.fill(SKIN);
}

/** Standard shirt+pants body */
function drawBody(g: Graphics, x: number, y: number,
  shirt: number, pants: number, shoes: number,
  opts?: { tie?: number; belt?: number; openChest?: boolean }
) {
  // Torso
  g.rect(x + 7, y + 27, 18, 11); g.fill(shirt);
  // Shoulders wider
  g.rect(x + 5, y + 28, 22, 4); g.fill(shirt);

  // Collar area
  if (opts?.openChest) {
    g.rect(x + 12, y + 27, 8, 3); g.fill(SKIN);
  } else {
    g.rect(x + 12, y + 27, 8, 2); g.fill(lighten(shirt, 0.2));
  }

  // Tie
  if (opts?.tie) {
    g.rect(x + 14, y + 28, 4, 2); g.fill(opts.tie);
    g.rect(x + 15, y + 30, 2, 6); g.fill(opts.tie);
    g.rect(x + 14, y + 35, 4, 2); g.fill(darken(opts.tie, 0.2));
  }

  // Shirt shading
  g.rect(x + 5, y + 31, 4, 5); g.fill(darken(shirt, 0.15));
  g.rect(x + 23, y + 31, 4, 5); g.fill(darken(shirt, 0.15));

  // Arms
  g.rect(x + 2, y + 28, 4, 10); g.fill(shirt);
  g.rect(x + 26, y + 28, 4, 10); g.fill(shirt);
  // Hands
  g.rect(x + 2, y + 37, 4, 3); g.fill(SKIN);
  g.rect(x + 26, y + 37, 4, 3); g.fill(SKIN);

  // Belt
  if (opts?.belt) {
    g.rect(x + 7, y + 37, 18, 2); g.fill(opts.belt);
  }

  // Pants
  g.rect(x + 8, y + 38, 16, 5); g.fill(pants);
  // Legs
  g.rect(x + 9, y + 42, 5, 3); g.fill(pants);
  g.rect(x + 18, y + 42, 5, 3); g.fill(pants);
  // Shoes
  g.rect(x + 8, y + 45, 6, 3); g.fill(shoes);
  g.rect(x + 18, y + 45, 6, 3); g.fill(shoes);
}

/** Drop shadow under character */
function drawShadow(g: Graphics, x: number, y: number) {
  g.ellipse(x + 16, y + 47, 10, 2); g.fill({ color: 0x000000, alpha: 0.15 });
}

// ═══════════════════════════════════════════════════════════════
// INDIVIDUAL CHARACTER DRAW FUNCTIONS
// ═══════════════════════════════════════════════════════════════

// ── JUAN → Light Yagami (Death Note) ──
// Auburn side-swept hair, sharp brown eyes, white shirt, red tie
function drawLight(g: Graphics, x: number, y: number) {
  const hair = 0x8b4820;
  const hairHi = 0xa86030;
  const hairDk = 0x6b3010;

  drawShadow(g, x, y);
  drawFace(g, x, y);

  // Hair — straight, side-swept with bangs
  g.rect(x + 6, y + 2, 20, 8); g.fill(hair);
  g.rect(x + 5, y + 4, 22, 6); g.fill(hair);
  g.rect(x + 4, y + 6, 6, 10); g.fill(hair); // left sideburns
  g.rect(x + 24, y + 6, 4, 8); g.fill(hair); // right side
  // Bangs sweep
  g.rect(x + 7, y + 3, 6, 3); g.fill(hairHi);
  g.rect(x + 14, y + 2, 8, 2); g.fill(hairHi);
  g.rect(x + 20, y + 4, 4, 2); g.fill(hairDk);
  // Top volume
  g.rect(x + 8, y + 1, 14, 3); g.fill(hair);
  g.rect(x + 10, y, 10, 2); g.fill(hairDk);
  // Hair tips over forehead
  g.rect(x + 6, y + 8, 4, 4); g.fill(hair);
  g.rect(x + 5, y + 10, 3, 3); g.fill(hairDk);

  drawEyes(g, x, y, 0x993322); // red-brown eyes
  drawNose(g, x, y);
  drawSmirk(g, x, y);
  drawNeck(g, x, y);
  drawBody(g, x, y, 0xffffff, 0x333344, 0x222233, {
    tie: 0xcc2222,
    belt: 0x333333,
  });

  // Shirt details (collar fold)
  g.rect(x + 10, y + 27, 3, 3); g.fill(0xeeeeee);
  g.rect(x + 19, y + 27, 3, 3); g.fill(0xeeeeee);

  // Death Note book in hand
  g.rect(x + 26, y + 35, 5, 7); g.fill(0x111111);
  g.rect(x + 27, y + 36, 3, 5); g.fill(0x222222);
  g.rect(x + 27, y + 36, 3, 1); g.fill(0xeeeeee); // page edge
}

// ── SA-VENDEDOR → Sanji (One Piece) ──
// Blonde hair covering left eye, black suit, cigarette, curly eyebrow
function drawSanji(g: Graphics, x: number, y: number) {
  const hair = 0xddcc44;
  const hairDk = 0xbbaa22;

  drawShadow(g, x, y);
  drawFace(g, x, y);

  // Blonde hair — covers left eye, parted
  g.rect(x + 6, y + 2, 20, 7); g.fill(hair);
  g.rect(x + 5, y + 4, 22, 5); g.fill(hair);
  g.rect(x + 8, y + 1, 14, 3); g.fill(hair);
  g.rect(x + 10, y, 10, 2); g.fill(hairDk);
  // Left side — hair covers the eye entirely
  g.rect(x + 4, y + 5, 8, 14); g.fill(hair);
  g.rect(x + 3, y + 7, 6, 10); g.fill(hairDk);
  // Right side
  g.rect(x + 24, y + 5, 4, 8); g.fill(hair);
  // Hair highlight
  g.rect(x + 12, y + 2, 6, 2); g.fill(lighten(hair, 0.2));

  drawEyes(g, x, y, 0x334488, { coverLeft: true }); // only right eye visible
  // Curly eyebrow (Sanji signature!)
  g.rect(x + 20, y + 11, 5, 1); g.fill(hair);
  g.rect(x + 24, y + 10, 2, 2); g.fill(hair); // curl
  drawNose(g, x, y);
  drawSmirk(g, x, y);
  drawNeck(g, x, y);

  // Black suit
  drawBody(g, x, y, 0x222233, 0x222233, 0x111122, {
    tie: 0x2244aa,
    belt: 0x222222,
  });
  // Shirt visible under suit
  g.rect(x + 12, y + 27, 8, 2); g.fill(0xeeeedd);

  // Cigarette
  g.rect(x + 22, y + 22, 6, 1); g.fill(0xeeeecc);
  g.rect(x + 27, y + 21, 2, 1); g.fill(0xff6633); // ember
  g.rect(x + 28, y + 20, 1, 1); g.fill({ color: 0xcccccc, alpha: 0.5 }); // smoke
  g.rect(x + 29, y + 19, 1, 1); g.fill({ color: 0xcccccc, alpha: 0.3 });
}

// ── SA-MARKETING → Dio Brando (JoJo's Bizarre Adventure) ──
// Blonde flowing hair, golden outfit, menacing red eyes
function drawDio(g: Graphics, x: number, y: number) {
  const hair = 0xddcc44;
  const hairHi = 0xeedd66;
  const hairDk = 0xbb9922;

  drawShadow(g, x, y);
  drawFace(g, x, y);

  // Tall flowing blonde hair
  g.rect(x + 6, y - 2, 20, 10); g.fill(hair);
  g.rect(x + 5, y + 0, 22, 8); g.fill(hair);
  g.rect(x + 8, y - 4, 16, 4); g.fill(hair);
  g.rect(x + 10, y - 5, 12, 3); g.fill(hairHi);
  // Hair flows down sides
  g.rect(x + 3, y + 5, 5, 16); g.fill(hair);
  g.rect(x + 2, y + 8, 4, 14); g.fill(hairDk);
  g.rect(x + 25, y + 5, 5, 16); g.fill(hair);
  g.rect(x + 27, y + 8, 4, 14); g.fill(hairDk);
  // Volume highlights
  g.rect(x + 12, y - 3, 4, 2); g.fill(hairHi);
  g.rect(x + 8, y + 1, 3, 2); g.fill(hairHi);

  drawEyes(g, x, y, 0xcc2222, { fierce: true }); // menacing red eyes
  drawNose(g, x, y);
  // Evil grin
  g.rect(x + 11, y + 22, 10, 1); g.fill(MOUTH);
  g.rect(x + 12, y + 23, 8, 1); g.fill(0xcc5555);
  // Fangs hint
  g.rect(x + 12, y + 23, 1, 1); g.fill(0xffffff);
  g.rect(x + 19, y + 23, 1, 1); g.fill(0xffffff);

  drawNeck(g, x, y);

  // Golden outfit (part 3 Dio)
  drawBody(g, x, y, 0xddaa22, 0xddaa22, 0x886611, {
    belt: 0x886611,
  });
  // Green heart motifs on chest
  g.rect(x + 14, y + 30, 4, 4); g.fill(0x22aa44);
  g.rect(x + 13, y + 31, 6, 2); g.fill(0x22aa44);
  // Shoulder pads
  g.rect(x + 3, y + 27, 6, 3); g.fill(0xccaa22);
  g.rect(x + 23, y + 27, 6, 3); g.fill(0xccaa22);
}

// ── SA-CTO → Lelouch vi Britannia (Code Geass) ──
// Sleek black hair, sharp violet eyes, one Geass eye, school uniform
function drawLelouch(g: Graphics, x: number, y: number) {
  const hair = 0x111122;
  const hairHi = 0x222244;

  drawShadow(g, x, y);
  drawFace(g, x, y);

  // Sleek black hair — angular, covers forehead
  g.rect(x + 5, y + 1, 22, 8); g.fill(hair);
  g.rect(x + 4, y + 3, 24, 6); g.fill(hair);
  g.rect(x + 7, y, 18, 3); g.fill(hair);
  g.rect(x + 9, y - 1, 14, 2); g.fill(hairHi);
  // Sharp bangs pointing down
  g.rect(x + 6, y + 8, 5, 5); g.fill(hair);
  g.rect(x + 5, y + 10, 3, 4); g.fill(hair);
  g.rect(x + 22, y + 8, 5, 4); g.fill(hair);
  // Side hair
  g.rect(x + 3, y + 5, 4, 12); g.fill(hair);
  g.rect(x + 26, y + 5, 4, 10); g.fill(hair);
  // Highlight
  g.rect(x + 14, y + 1, 5, 2); g.fill(hairHi);

  drawEyes(g, x, y, 0x8833cc, { geassLeft: true }); // left eye = Geass red
  // Geass sigil hint in left eye
  g.rect(x + 7, y + 14, 1, 1); g.fill(0xff4444);
  drawNose(g, x, y);
  drawMouthLine(g, x, y);
  drawNeck(g, x, y);

  // Ashford Academy uniform (black with gold trim)
  drawBody(g, x, y, 0x222233, 0x222233, 0x111122, {
    belt: 0x444444,
  });
  // Gold trim details
  g.rect(x + 10, y + 27, 12, 1); g.fill(0xccaa44);
  g.rect(x + 7, y + 31, 1, 6); g.fill(0xccaa44);
  g.rect(x + 24, y + 31, 1, 6); g.fill(0xccaa44);
  // White collar peeking
  g.rect(x + 12, y + 27, 8, 2); g.fill(0xeeeeee);
}

// ── SA-FINANZAS → L (Death Note) ──
// Messy wild black hair, dark circles, white long shirt, hunched, no shoes
function drawL(g: Graphics, x: number, y: number) {
  const hair = 0x111111;
  const hairHi = 0x222233;

  drawShadow(g, x, y);
  drawFace(g, x, y);

  // Messy wild black hair — all directions
  g.rect(x + 4, y + 1, 24, 8); g.fill(hair);
  g.rect(x + 3, y + 3, 26, 6); g.fill(hair);
  g.rect(x + 6, y - 1, 20, 4); g.fill(hair);
  g.rect(x + 8, y - 3, 16, 4); g.fill(hair);
  // Messy spikes
  g.rect(x + 5, y - 2, 3, 4); g.fill(hair);
  g.rect(x + 10, y - 4, 4, 3); g.fill(hair);
  g.rect(x + 16, y - 3, 3, 3); g.fill(hair);
  g.rect(x + 22, y - 1, 4, 3); g.fill(hair);
  g.rect(x + 25, y + 1, 3, 4); g.fill(hair);
  // Side strands hanging down
  g.rect(x + 3, y + 5, 4, 14); g.fill(hair);
  g.rect(x + 2, y + 8, 3, 12); g.fill(hairHi);
  g.rect(x + 26, y + 5, 4, 12); g.fill(hair);
  // Highlight
  g.rect(x + 12, y - 1, 6, 2); g.fill(hairHi);

  // Huge dark eyes with dark circles (L's signature look)
  drawEyes(g, x, y, 0x111111, { darkCircles: true });
  drawNose(g, x, y);
  drawMouthLine(g, x, y);
  drawNeck(g, x, y);

  // Plain white long shirt, baggy jeans, bare feet
  drawBody(g, x, y, 0xeeeeee, 0x5566aa, 0xffd5b8); // bare feet = skin color
  // Shirt is baggy — no belt, no tie, loose
  g.rect(x + 7, y + 37, 18, 2); g.fill(0xeeeeee); // shirt hangs over pants
  // Hunched posture — slightly forward lean (darker shadow on front)
  g.rect(x + 12, y + 30, 8, 4); g.fill(0xdddddd);
}

// ── PROJECT-A-DATA → Vegeta (Dragon Ball Z) ──
// Tall flame hair, widow's peak, Saiyan armor, blue bodysuit
function drawVegeta(g: Graphics, x: number, y: number) {
  const hair = 0x111111;
  const hairHi = 0x222233;

  drawShadow(g, x, y);
  drawFace(g, x, y);

  // Tall flame-like spiky hair (Vegeta's signature)
  g.rect(x + 5, y + 1, 22, 8); g.fill(hair);
  g.rect(x + 4, y + 3, 24, 5); g.fill(hair);
  // Widow's peak
  g.rect(x + 13, y + 7, 6, 4); g.fill(hair);
  // Tall spikes going UP
  g.rect(x + 6, y - 8, 4, 10); g.fill(hair);
  g.rect(x + 10, y - 12, 4, 14); g.fill(hair);
  g.rect(x + 14, y - 10, 4, 12); g.fill(hair);
  g.rect(x + 18, y - 8, 4, 10); g.fill(hair);
  g.rect(x + 22, y - 5, 4, 8); g.fill(hair);
  g.rect(x + 4, y - 4, 3, 6); g.fill(hair);
  // Spike tips (lighter)
  g.rect(x + 10, y - 12, 4, 2); g.fill(hairHi);
  g.rect(x + 14, y - 10, 4, 2); g.fill(hairHi);
  g.rect(x + 6, y - 8, 4, 2); g.fill(hairHi);
  g.rect(x + 18, y - 8, 4, 2); g.fill(hairHi);
  // Side hair
  g.rect(x + 3, y + 5, 4, 8); g.fill(hair);
  g.rect(x + 26, y + 5, 4, 6); g.fill(hair);

  drawEyes(g, x, y, 0x111111, { fierce: true }); // dark fierce eyes
  drawNose(g, x, y);
  // Scowl
  g.rect(x + 13, y + 22, 6, 1); g.fill(darken(MOUTH, 0.3));
  drawNeck(g, x, y);

  // Saiyan armor (white chest plate over blue bodysuit)
  // Blue bodysuit base
  g.rect(x + 5, y + 27, 22, 12); g.fill(0x2233aa);
  g.rect(x + 2, y + 28, 4, 10); g.fill(0x2233aa); // arms
  g.rect(x + 26, y + 28, 4, 10); g.fill(0x2233aa);
  // White armor chest plate
  g.rect(x + 8, y + 27, 16, 10); g.fill(0xeeeecc);
  g.rect(x + 7, y + 28, 18, 8); g.fill(0xeeeecc);
  // Gold trim on armor
  g.rect(x + 8, y + 27, 16, 1); g.fill(0xccaa44);
  g.rect(x + 8, y + 36, 16, 1); g.fill(0xccaa44);
  // Shoulder pads
  g.rect(x + 3, y + 27, 6, 3); g.fill(0xeeeecc);
  g.rect(x + 23, y + 27, 6, 3); g.fill(0xeeeecc);
  // Hands (gloves)
  g.rect(x + 2, y + 37, 4, 3); g.fill(0xeeeeee);
  g.rect(x + 26, y + 37, 4, 3); g.fill(0xeeeeee);
  // Blue pants/boots
  g.rect(x + 8, y + 38, 16, 5); g.fill(0x2233aa);
  g.rect(x + 9, y + 42, 5, 3); g.fill(0x2233aa);
  g.rect(x + 18, y + 42, 5, 3); g.fill(0x2233aa);
  // White boots
  g.rect(x + 8, y + 45, 6, 3); g.fill(0xeeeecc);
  g.rect(x + 18, y + 45, 6, 3); g.fill(0xeeeecc);
}

// ── PROJECT-B-DATA → Trunks (Dragon Ball Z) ──
// Lavender/purple straight hair, Capsule Corp jacket, sword on back
function drawTrunks(g: Graphics, x: number, y: number) {
  const hair = 0x9977cc;
  const hairHi = 0xbb99ee;
  const hairDk = 0x7755aa;

  drawShadow(g, x, y);
  drawFace(g, x, y);

  // Straight lavender hair — clean cut, slightly spiky
  g.rect(x + 5, y + 1, 22, 8); g.fill(hair);
  g.rect(x + 4, y + 3, 24, 5); g.fill(hair);
  g.rect(x + 7, y, 18, 3); g.fill(hair);
  g.rect(x + 9, y - 1, 14, 2); g.fill(hairHi);
  // Bangs
  g.rect(x + 7, y + 7, 6, 4); g.fill(hair);
  g.rect(x + 19, y + 7, 5, 3); g.fill(hair);
  // Side hair
  g.rect(x + 3, y + 5, 4, 10); g.fill(hair);
  g.rect(x + 26, y + 5, 4, 8); g.fill(hair);
  // Highlights
  g.rect(x + 12, y + 1, 5, 2); g.fill(hairHi);
  g.rect(x + 5, y + 4, 3, 3); g.fill(hairDk);

  drawEyes(g, x, y, 0x4488cc); // blue eyes
  drawNose(g, x, y);
  drawMouthLine(g, x, y);
  drawNeck(g, x, y);

  // Capsule Corp jacket (blue/purple)
  drawBody(g, x, y, 0x5544aa, 0x333344, 0x222233, {
    belt: 0x664422,
  });
  // CC logo on chest
  g.rect(x + 13, y + 30, 6, 4); g.fill(0xeeeeee);
  g.rect(x + 14, y + 31, 4, 2); g.fill(0xdd4444); // "CC"
  // Jacket collar
  g.rect(x + 10, y + 27, 4, 3); g.fill(0x6655bb);
  g.rect(x + 18, y + 27, 4, 3); g.fill(0x6655bb);

  // Sword on back (diagonal hint)
  g.rect(x + 24, y + 22, 2, 18); g.fill(0x888899);
  g.rect(x + 23, y + 20, 4, 3); g.fill(0xccaa44); // hilt
  g.rect(x + 22, y + 19, 6, 2); g.fill(0x886622); // guard
}

// ── PROJECT-C-DATA → Shikamaru Nara (Naruto) ──
// Spiky ponytail, green flak vest, lazy bored expression
function drawShikamaru(g: Graphics, x: number, y: number) {
  const hair = 0x222211;
  const hairHi = 0x333322;

  drawShadow(g, x, y);
  drawFace(g, x, y);

  // Dark hair with spiky ponytail going up-back
  g.rect(x + 5, y + 1, 22, 7); g.fill(hair);
  g.rect(x + 4, y + 3, 24, 5); g.fill(hair);
  g.rect(x + 7, y, 18, 3); g.fill(hair);
  // Ponytail (spiky, going up like a pineapple)
  g.rect(x + 11, y - 6, 10, 8); g.fill(hair);
  g.rect(x + 13, y - 9, 6, 5); g.fill(hair);
  g.rect(x + 14, y - 11, 4, 4); g.fill(hairHi);
  g.rect(x + 10, y - 4, 3, 3); g.fill(hair); // side spikes
  g.rect(x + 19, y - 4, 3, 3); g.fill(hair);
  // Side hair
  g.rect(x + 3, y + 5, 4, 8); g.fill(hair);
  g.rect(x + 26, y + 5, 4, 6); g.fill(hair);

  // Forehead protector
  g.rect(x + 4, y + 7, 24, 3); g.fill(0x3344aa);
  g.rect(x + 11, y + 7, 10, 3); g.fill(0x888899); // metal plate
  g.rect(x + 13, y + 8, 6, 1); g.fill(0xaaaabb); // plate shine

  drawEyes(g, x, y, 0x332211, { narrow: true }); // lazy narrow eyes
  drawNose(g, x, y);
  // Bored expression
  g.rect(x + 13, y + 22, 6, 1); g.fill(darken(MOUTH, 0.2));
  drawNeck(g, x, y);

  // Green flak vest (Chunin vest)
  drawBody(g, x, y, 0x557744, 0x333344, 0x222233, {
    belt: 0x444433,
  });
  // Vest pockets
  g.rect(x + 9, y + 31, 5, 3); g.fill(0x446633);
  g.rect(x + 18, y + 31, 5, 3); g.fill(0x446633);
  // Vest collar (high collar)
  g.rect(x + 10, y + 26, 4, 3); g.fill(0x668855);
  g.rect(x + 18, y + 26, 4, 3); g.fill(0x668855);
}

// ── PROJECT-D-DATA → Itachi Uchiha (Naruto) ──
// Long dark ponytail, Akatsuki cloak (black+red clouds), forehead line
function drawItachi(g: Graphics, x: number, y: number) {
  const hair = 0x111111;
  const hairHi = 0x222233;

  drawShadow(g, x, y);
  drawFace(g, x, y);

  // Long dark hair — ponytail hanging down back
  g.rect(x + 5, y + 1, 22, 8); g.fill(hair);
  g.rect(x + 4, y + 3, 24, 5); g.fill(hair);
  g.rect(x + 7, y, 18, 3); g.fill(hair);
  g.rect(x + 9, y - 1, 14, 2); g.fill(hairHi);
  // Side strands framing face
  g.rect(x + 3, y + 5, 4, 18); g.fill(hair);
  g.rect(x + 2, y + 10, 3, 14); g.fill(hairHi);
  g.rect(x + 26, y + 5, 4, 16); g.fill(hair);
  g.rect(x + 28, y + 10, 3, 12); g.fill(hairHi);
  // Low ponytail (behind body)
  g.rect(x + 13, y + 8, 6, 4); g.fill(hair);

  // Forehead protector with scratch
  g.rect(x + 4, y + 7, 24, 3); g.fill(0x3344aa);
  g.rect(x + 11, y + 7, 10, 3); g.fill(0x888899);
  g.rect(x + 13, y + 7, 6, 3); g.fill(0x666677); // scratched
  g.rect(x + 15, y + 7, 2, 3); g.fill(0x555566); // scratch line

  // Sharingan eyes (red with tomoe)
  drawEyes(g, x, y, 0xcc1111, { narrow: true });
  // Tear troughs (Itachi's face lines)
  g.rect(x + 8, y + 18, 1, 5); g.fill(SKIN_SH);
  g.rect(x + 23, y + 18, 1, 5); g.fill(SKIN_SH);

  drawNose(g, x, y);
  drawMouthLine(g, x, y);
  drawNeck(g, x, y);

  // Akatsuki cloak (black with red cloud accents)
  g.rect(x + 4, y + 27, 24, 14); g.fill(0x111111);
  g.rect(x + 2, y + 28, 28, 12); g.fill(0x111111);
  // Red cloud patterns
  g.rect(x + 8, y + 31, 6, 3); g.fill(0xcc2222);
  g.rect(x + 7, y + 32, 8, 1); g.fill(0xcc2222);
  g.rect(x + 18, y + 34, 5, 3); g.fill(0xcc2222);
  g.rect(x + 17, y + 35, 7, 1); g.fill(0xcc2222);
  // White cloud outlines
  g.rect(x + 7, y + 31, 1, 3); g.fill(0xeeeeee);
  g.rect(x + 14, y + 31, 1, 3); g.fill(0xeeeeee);
  // Cloak collar
  g.rect(x + 10, y + 26, 12, 3); g.fill(0x222222);
  // Hands hidden in cloak
  // Legs (dark pants under cloak)
  g.rect(x + 9, y + 42, 5, 3); g.fill(0x111111);
  g.rect(x + 18, y + 42, 5, 3); g.fill(0x111111);
  // Ninja sandals
  g.rect(x + 8, y + 45, 6, 3); g.fill(0x333333);
  g.rect(x + 18, y + 45, 6, 3); g.fill(0x333333);
}

// ── AGENT-E1 → Goku (Dragon Ball Z) ──
// Wild spiky black hair (huge!), orange gi, blue undershirt, muscular
function drawGoku(g: Graphics, x: number, y: number) {
  const hair = 0x111111;
  const hairHi = 0x222233;

  drawShadow(g, x, y);
  drawFace(g, x, y);

  // MASSIVE wild spiky hair (Goku's signature)
  g.rect(x + 4, y + 1, 24, 8); g.fill(hair);
  g.rect(x + 3, y + 3, 26, 5); g.fill(hair);
  // Main spikes — going every direction
  g.rect(x + 2, y - 10, 4, 12); g.fill(hair);
  g.rect(x + 6, y - 14, 4, 16); g.fill(hair);
  g.rect(x + 10, y - 16, 5, 18); g.fill(hair);
  g.rect(x + 15, y - 14, 5, 16); g.fill(hair);
  g.rect(x + 20, y - 12, 4, 14); g.fill(hair);
  g.rect(x + 24, y - 8, 4, 10); g.fill(hair);
  g.rect(x + 27, y - 4, 3, 6); g.fill(hair);
  // Side spikes
  g.rect(x, y - 4, 4, 8); g.fill(hair);
  g.rect(x - 1, y - 2, 3, 5); g.fill(hair);
  g.rect(x + 28, y - 2, 4, 6); g.fill(hair);
  // Spike highlights
  g.rect(x + 10, y - 16, 5, 2); g.fill(hairHi);
  g.rect(x + 6, y - 14, 4, 2); g.fill(hairHi);
  g.rect(x + 15, y - 14, 5, 2); g.fill(hairHi);
  g.rect(x + 20, y - 12, 4, 2); g.fill(hairHi);
  // Side bangs
  g.rect(x + 3, y + 5, 5, 10); g.fill(hair);
  g.rect(x + 26, y + 5, 4, 8); g.fill(hair);

  drawEyes(g, x, y, 0x111111); // dark eyes
  drawNose(g, x, y);
  drawSmile(g, x, y); // Goku always smiles

  drawNeck(g, x, y);

  // Orange gi top
  g.rect(x + 5, y + 27, 22, 12); g.fill(0xee7722);
  g.rect(x + 7, y + 28, 18, 10); g.fill(0xee7722);
  // Blue undershirt visible at collar
  g.rect(x + 12, y + 27, 8, 3); g.fill(0x2244aa);
  // Blue belt/sash
  g.rect(x + 7, y + 37, 18, 2); g.fill(0x2244aa);
  // Arms (orange gi sleeves)
  g.rect(x + 2, y + 28, 4, 8); g.fill(0xee7722);
  g.rect(x + 26, y + 28, 4, 8); g.fill(0xee7722);
  // Muscular arms (blue wristbands)
  g.rect(x + 2, y + 35, 4, 2); g.fill(0x2244aa);
  g.rect(x + 26, y + 35, 4, 2); g.fill(0x2244aa);
  g.rect(x + 2, y + 37, 4, 3); g.fill(SKIN);
  g.rect(x + 26, y + 37, 4, 3); g.fill(SKIN);
  // Orange gi pants
  g.rect(x + 8, y + 38, 16, 5); g.fill(0xee7722);
  g.rect(x + 9, y + 42, 5, 3); g.fill(0xee7722);
  g.rect(x + 18, y + 42, 5, 3); g.fill(0xee7722);
  // Blue boots
  g.rect(x + 8, y + 45, 6, 3); g.fill(0x2244aa);
  g.rect(x + 18, y + 45, 6, 3); g.fill(0x2244aa);
  // Gi shading
  g.rect(x + 5, y + 31, 4, 5); g.fill(darken(0xee7722, 0.15));
  g.rect(x + 23, y + 31, 4, 5); g.fill(darken(0xee7722, 0.15));

  // Kanji symbol on back (小) — hint on chest
  g.rect(x + 14, y + 30, 4, 5); g.fill(0x2244aa);
}

// ── AGENT-E2 → Asuka Langley (Evangelion) ──
// Red/auburn hair with neural clips, red plugsuit, blue eyes, fiery
function drawAsuka(g: Graphics, x: number, y: number) {
  const hair = 0xcc4422;
  const hairHi = 0xdd6644;
  const hairDk = 0xaa3311;

  drawShadow(g, x, y);
  drawFace(g, x, y);

  // Long red hair with bangs
  g.rect(x + 5, y + 1, 22, 8); g.fill(hair);
  g.rect(x + 4, y + 3, 24, 5); g.fill(hair);
  g.rect(x + 7, y, 18, 3); g.fill(hair);
  g.rect(x + 9, y - 1, 14, 2); g.fill(hairHi);
  // Bangs (straight across)
  g.rect(x + 6, y + 8, 20, 3); g.fill(hair);
  g.rect(x + 7, y + 8, 4, 4); g.fill(hairDk);
  g.rect(x + 21, y + 8, 4, 4); g.fill(hairDk);
  // Long hair flowing down sides and back
  g.rect(x + 2, y + 5, 5, 22); g.fill(hair);
  g.rect(x + 1, y + 10, 4, 18); g.fill(hairHi);
  g.rect(x + 26, y + 5, 5, 22); g.fill(hair);
  g.rect(x + 28, y + 10, 4, 18); g.fill(hairHi);
  // Neural clips (red A10 clips) — interface headset
  g.rect(x + 4, y + 4, 3, 3); g.fill(0xff3322);
  g.rect(x + 25, y + 4, 3, 3); g.fill(0xff3322);
  g.rect(x + 5, y + 5, 1, 1); g.fill(0xffaa44); // clip detail
  g.rect(x + 26, y + 5, 1, 1); g.fill(0xffaa44);

  drawEyes(g, x, y, 0x2266cc); // blue eyes
  drawNose(g, x, y);
  // Confident expression
  g.rect(x + 12, y + 22, 8, 1); g.fill(MOUTH);
  g.rect(x + 18, y + 21, 2, 1); g.fill(MOUTH); // smirk

  drawNeck(g, x, y);

  // Red plugsuit
  g.rect(x + 5, y + 27, 22, 12); g.fill(0xcc2222);
  g.rect(x + 7, y + 28, 18, 10); g.fill(0xcc2222);
  // Green accents on plugsuit
  g.rect(x + 12, y + 28, 8, 2); g.fill(0x228844);
  g.rect(x + 14, y + 30, 4, 4); g.fill(0x228844);
  // Arms
  g.rect(x + 2, y + 28, 4, 10); g.fill(0xcc2222);
  g.rect(x + 26, y + 28, 4, 10); g.fill(0xcc2222);
  g.rect(x + 2, y + 37, 4, 3); g.fill(SKIN);
  g.rect(x + 26, y + 37, 4, 3); g.fill(SKIN);
  // Plugsuit legs
  g.rect(x + 8, y + 38, 16, 5); g.fill(0xcc2222);
  g.rect(x + 9, y + 42, 5, 3); g.fill(0xcc2222);
  g.rect(x + 18, y + 42, 5, 3); g.fill(0xcc2222);
  // Red boots
  g.rect(x + 8, y + 45, 6, 3); g.fill(0xaa1111);
  g.rect(x + 18, y + 45, 6, 3); g.fill(0xaa1111);
  // Suit shading
  g.rect(x + 5, y + 31, 4, 5); g.fill(darken(0xcc2222, 0.2));
  g.rect(x + 23, y + 31, 4, 5); g.fill(darken(0xcc2222, 0.2));
}

// ── Luffy (One Piece) — unused fallback ──
// Straw hat, messy black hair, red vest, blue shorts, X scar
function drawLuffy(g: Graphics, x: number, y: number) {
  const hair = 0x111111;

  drawShadow(g, x, y);
  drawFace(g, x, y);

  // Messy black hair (under hat)
  g.rect(x + 4, y + 4, 24, 6); g.fill(hair);
  g.rect(x + 3, y + 6, 26, 4); g.fill(hair);
  g.rect(x + 3, y + 8, 4, 8); g.fill(hair); // sideburns
  g.rect(x + 26, y + 8, 4, 6); g.fill(hair);

  // Straw hat (Luffy's MOST iconic feature)
  g.rect(x + 3, y - 2, 26, 8); g.fill(0xddcc66);
  g.rect(x + 5, y - 4, 22, 4); g.fill(0xddcc66);
  g.rect(x + 7, y - 5, 18, 3); g.fill(0xeedd77);
  // Hat brim (wide!)
  g.rect(x, y + 4, 32, 3); g.fill(0xddcc66);
  g.rect(x - 1, y + 5, 34, 2); g.fill(0xccbb55);
  // Red band
  g.rect(x + 5, y + 1, 22, 3); g.fill(0xcc2222);
  g.rect(x + 6, y + 2, 20, 1); g.fill(0xdd3333);

  drawEyes(g, x, y, 0x222211); // dark eyes
  // Scar under left eye
  g.rect(x + 7, y + 19, 4, 1); g.fill(0xcc8888);
  g.rect(x + 8, y + 20, 2, 1); g.fill(0xcc8888);
  drawNose(g, x, y);
  drawSmile(g, x, y); // big Luffy grin

  drawNeck(g, x, y);

  // Red vest (open) + blue shorts
  // Bare chest with X scar
  g.rect(x + 10, y + 27, 12, 10); g.fill(SKIN);
  // X scar on chest
  g.rect(x + 13, y + 29, 1, 5); g.fill(0xcc8888);
  g.rect(x + 18, y + 29, 1, 5); g.fill(0xcc8888);
  g.rect(x + 14, y + 30, 1, 3); g.fill(0xcc8888);
  g.rect(x + 17, y + 30, 1, 3); g.fill(0xcc8888);
  g.rect(x + 15, y + 31, 2, 1); g.fill(0xcc8888);
  // Red vest (open sides)
  g.rect(x + 5, y + 27, 6, 11); g.fill(0xcc2222);
  g.rect(x + 21, y + 27, 6, 11); g.fill(0xcc2222);
  // Arms
  g.rect(x + 2, y + 28, 4, 10); g.fill(SKIN);
  g.rect(x + 26, y + 28, 4, 10); g.fill(SKIN);
  g.rect(x + 2, y + 37, 4, 3); g.fill(SKIN);
  g.rect(x + 26, y + 37, 4, 3); g.fill(SKIN);
  // Blue shorts
  g.rect(x + 7, y + 37, 18, 2); g.fill(0xccaa44); // yellow sash
  g.rect(x + 8, y + 38, 16, 5); g.fill(0x3355cc);
  g.rect(x + 9, y + 42, 5, 3); g.fill(0x3355cc);
  g.rect(x + 18, y + 42, 5, 3); g.fill(0x3355cc);
  // Sandals
  g.rect(x + 8, y + 45, 6, 3); g.fill(0x886633);
  g.rect(x + 18, y + 45, 6, 3); g.fill(0x886633);
}

// ── Deku / Izuku Midoriya (My Hero Academia) — unused fallback ──
// Green messy curly hair, green hero costume, red shoes, freckles
function drawDeku(g: Graphics, x: number, y: number) {
  const hair = 0x226633;
  const hairHi = 0x33aa55;
  const hairDk = 0x114422;

  drawShadow(g, x, y);
  drawFace(g, x, y);

  // Green messy curly hair (big and fluffy)
  g.rect(x + 4, y, 24, 9); g.fill(hair);
  g.rect(x + 3, y + 2, 26, 7); g.fill(hair);
  g.rect(x + 6, y - 3, 20, 5); g.fill(hair);
  g.rect(x + 8, y - 5, 16, 4); g.fill(hair);
  // Curly texture — irregular bumps
  g.rect(x + 5, y - 2, 4, 3); g.fill(hairHi);
  g.rect(x + 11, y - 5, 5, 3); g.fill(hairHi);
  g.rect(x + 19, y - 3, 4, 3); g.fill(hairHi);
  g.rect(x + 24, y - 1, 3, 3); g.fill(hairHi);
  g.rect(x + 3, y - 1, 3, 3); g.fill(hairDk);
  g.rect(x + 14, y - 4, 3, 2); g.fill(hairDk);
  // Side curls
  g.rect(x + 2, y + 5, 5, 10); g.fill(hair);
  g.rect(x + 26, y + 5, 5, 8); g.fill(hair);
  g.rect(x + 1, y + 7, 3, 6); g.fill(hairDk);

  drawEyes(g, x, y, 0x228833); // green eyes (big, expressive)
  // Freckles
  g.rect(x + 8, y + 19, 1, 1); g.fill(SKIN_SH);
  g.rect(x + 10, y + 20, 1, 1); g.fill(SKIN_SH);
  g.rect(x + 22, y + 19, 1, 1); g.fill(SKIN_SH);
  g.rect(x + 24, y + 20, 1, 1); g.fill(SKIN_SH);
  drawNose(g, x, y);
  drawSmile(g, x, y); // determined smile

  drawNeck(g, x, y);

  // Green hero costume (with white/red accents)
  g.rect(x + 5, y + 27, 22, 12); g.fill(0x228844);
  g.rect(x + 7, y + 28, 18, 10); g.fill(0x228844);
  // White accents
  g.rect(x + 12, y + 28, 8, 2); g.fill(0xeeeeee);
  // Red belt
  g.rect(x + 7, y + 37, 18, 2); g.fill(0xcc3333);
  // Arms (with gauntlets)
  g.rect(x + 2, y + 28, 4, 8); g.fill(0x228844);
  g.rect(x + 26, y + 28, 4, 8); g.fill(0x228844);
  g.rect(x + 2, y + 35, 4, 2); g.fill(0xcc3333); // red gauntlets
  g.rect(x + 26, y + 35, 4, 2); g.fill(0xcc3333);
  g.rect(x + 2, y + 37, 4, 3); g.fill(SKIN);
  g.rect(x + 26, y + 37, 4, 3); g.fill(SKIN);
  // Pants
  g.rect(x + 8, y + 38, 16, 5); g.fill(0x228844);
  g.rect(x + 9, y + 42, 5, 3); g.fill(0x228844);
  g.rect(x + 18, y + 42, 5, 3); g.fill(0x228844);
  // Red shoes (iconic)
  g.rect(x + 8, y + 45, 6, 3); g.fill(0xcc2222);
  g.rect(x + 18, y + 45, 6, 3); g.fill(0xcc2222);
  // Shoe soles
  g.rect(x + 8, y + 47, 6, 1); g.fill(0xeeeeee);
  g.rect(x + 18, y + 47, 6, 1); g.fill(0xeeeeee);
}

// ── Gon Freecss (Hunter x Hunter) — unused fallback ──
// Tall spiky black-green hair, green jacket, shorts, boots
function drawGon(g: Graphics, x: number, y: number) {
  const hair = 0x113322;
  const hairHi = 0x225533;
  const hairDk = 0x0a1a11;

  drawShadow(g, x, y);
  drawFace(g, x, y);

  // Tall spiky hair (goes straight up!)
  g.rect(x + 5, y + 1, 22, 8); g.fill(hair);
  g.rect(x + 4, y + 3, 24, 5); g.fill(hair);
  g.rect(x + 7, y - 4, 18, 6); g.fill(hair);
  // Big upward spikes
  g.rect(x + 8, y - 12, 5, 10); g.fill(hair);
  g.rect(x + 13, y - 14, 6, 16); g.fill(hair);
  g.rect(x + 19, y - 10, 5, 12); g.fill(hair);
  g.rect(x + 6, y - 6, 3, 6); g.fill(hair);
  g.rect(x + 23, y - 6, 3, 6); g.fill(hair);
  // Spike tips
  g.rect(x + 13, y - 14, 6, 2); g.fill(hairHi);
  g.rect(x + 8, y - 12, 5, 2); g.fill(hairHi);
  g.rect(x + 19, y - 10, 5, 2); g.fill(hairHi);
  // Dark roots
  g.rect(x + 10, y + 1, 12, 3); g.fill(hairDk);
  // Side hair
  g.rect(x + 3, y + 5, 4, 6); g.fill(hair);
  g.rect(x + 26, y + 5, 4, 5); g.fill(hair);

  drawEyes(g, x, y, 0x885522); // amber/brown eyes (big, innocent)
  drawNose(g, x, y);
  drawSmile(g, x, y); // cheerful!

  drawNeck(g, x, y);

  // Green jacket + white shirt
  g.rect(x + 5, y + 27, 22, 12); g.fill(0x227744);
  g.rect(x + 7, y + 28, 18, 10); g.fill(0x227744);
  // White shirt underneath
  g.rect(x + 12, y + 27, 8, 6); g.fill(0xeeeeee);
  // Arms (green jacket)
  g.rect(x + 2, y + 28, 4, 10); g.fill(0x227744);
  g.rect(x + 26, y + 28, 4, 10); g.fill(0x227744);
  g.rect(x + 2, y + 37, 4, 3); g.fill(SKIN);
  g.rect(x + 26, y + 37, 4, 3); g.fill(SKIN);
  // Green shorts
  g.rect(x + 8, y + 38, 16, 4); g.fill(0x227744);
  g.rect(x + 9, y + 41, 5, 2); g.fill(0x227744);
  g.rect(x + 18, y + 41, 5, 2); g.fill(0x227744);
  // Bare legs
  g.rect(x + 9, y + 42, 5, 3); g.fill(SKIN);
  g.rect(x + 18, y + 42, 5, 3); g.fill(SKIN);
  // Green boots
  g.rect(x + 8, y + 45, 6, 3); g.fill(0x885522);
  g.rect(x + 18, y + 45, 6, 3); g.fill(0x885522);
}

// ── Byakuya Kuchiki (Bleach) — unused fallback ──
// Long straight black hair with kenseikan clips, white captain haori, noble
function drawByakuya(g: Graphics, x: number, y: number) {
  const hair = 0x111122;
  const hairHi = 0x222244;

  drawShadow(g, x, y);
  drawFace(g, x, y);

  // Long straight black hair
  g.rect(x + 5, y + 1, 22, 8); g.fill(hair);
  g.rect(x + 4, y + 3, 24, 5); g.fill(hair);
  g.rect(x + 7, y, 18, 3); g.fill(hair);
  g.rect(x + 9, y - 1, 14, 2); g.fill(hairHi);
  // Elegant side strands
  g.rect(x + 3, y + 5, 4, 20); g.fill(hair);
  g.rect(x + 2, y + 10, 3, 16); g.fill(hairHi);
  g.rect(x + 26, y + 5, 4, 18); g.fill(hair);
  g.rect(x + 28, y + 10, 3, 14); g.fill(hairHi);

  // Kenseikan clips (white hair ornaments on top — Byakuya's signature)
  g.rect(x + 7, y + 1, 4, 3); g.fill(0xeeeeee);
  g.rect(x + 6, y + 2, 6, 1); g.fill(0xdddddd);
  g.rect(x + 21, y + 1, 4, 3); g.fill(0xeeeeee);
  g.rect(x + 20, y + 2, 6, 1); g.fill(0xdddddd);
  // Middle clip
  g.rect(x + 14, y - 1, 4, 3); g.fill(0xeeeeee);
  g.rect(x + 13, y, 6, 1); g.fill(0xdddddd);

  drawEyes(g, x, y, 0x444466, { narrow: true }); // stoic grey eyes
  drawNose(g, x, y);
  drawMouthLine(g, x, y); // neutral, noble expression

  drawNeck(g, x, y);

  // Captain haori (white) over black shihakusho
  // Black kimono underneath
  g.rect(x + 5, y + 27, 22, 12); g.fill(0x111122);
  g.rect(x + 7, y + 28, 18, 10); g.fill(0x111122);
  // White haori over it (open front)
  g.rect(x + 4, y + 27, 5, 14); g.fill(0xeeeeee);
  g.rect(x + 23, y + 27, 5, 14); g.fill(0xeeeeee);
  // Haori bottom edge (diamond pattern)
  g.rect(x + 4, y + 39, 5, 2); g.fill(0xdddddd);
  g.rect(x + 23, y + 39, 5, 2); g.fill(0xdddddd);
  // Scarf (Ginpaku Kazahana — white silk scarf)
  g.rect(x + 10, y + 26, 12, 3); g.fill(0xeeeeff);
  g.rect(x + 8, y + 27, 4, 8); g.fill(0xeeeeff); // draped
  g.rect(x + 20, y + 27, 4, 8); g.fill(0xeeeeff);
  // Arms
  g.rect(x + 2, y + 28, 3, 10); g.fill(0xeeeeee);
  g.rect(x + 27, y + 28, 3, 10); g.fill(0xeeeeee);
  g.rect(x + 2, y + 37, 4, 3); g.fill(SKIN);
  g.rect(x + 26, y + 37, 4, 3); g.fill(SKIN);
  // Hakama pants (black)
  g.rect(x + 8, y + 38, 16, 5); g.fill(0x111122);
  g.rect(x + 9, y + 42, 5, 3); g.fill(0x111122);
  g.rect(x + 18, y + 42, 5, 3); g.fill(0x111122);
  // Waraji sandals
  g.rect(x + 8, y + 45, 6, 3); g.fill(0x886644);
  g.rect(x + 18, y + 45, 6, 3); g.fill(0x886644);
}

// ── Generic fallback ──
function drawGeneric(g: Graphics, x: number, y: number, color: number) {
  drawShadow(g, x, y);
  drawFace(g, x, y);

  // Simple dark hair
  g.rect(x + 5, y + 1, 22, 8); g.fill(0x222222);
  g.rect(x + 4, y + 3, 24, 5); g.fill(0x222222);
  g.rect(x + 7, y, 18, 3); g.fill(0x222222);
  g.rect(x + 3, y + 5, 4, 8); g.fill(0x222222);
  g.rect(x + 26, y + 5, 4, 6); g.fill(0x222222);

  drawEyes(g, x, y, 0x332211);
  drawNose(g, x, y);
  drawMouthLine(g, x, y);
  drawNeck(g, x, y);
  drawBody(g, x, y, color, 0x333344, 0x222233);
}

// ── Owner indicator (star above head instead of crown) ──
export function drawOwnerStar(g: Graphics, x: number, y: number) {
  // Golden star above the character
  const sy = y - 8;
  const sx = x + 13;
  g.rect(sx + 2, sy, 2, 6); g.fill(0xffcc00);
  g.rect(sx, sy + 2, 6, 2); g.fill(0xffcc00);
  g.rect(sx + 1, sy + 1, 4, 4); g.fill(0xffdd44);
  g.rect(sx + 2, sy + 2, 2, 2); g.fill(0xffeebb);
}

// ═══════════════════════════════════════════════════════════════
// CHARACTER MAP AND MAIN EXPORT
// ═══════════════════════════════════════════════════════════════

const CHARACTER_DRAWERS: Record<string, (g: Graphics, x: number, y: number) => void> = {
  'juan':              drawLight,      // Light Yagami (Death Note)
  'sa-vendedor':       drawSanji,      // Sanji (One Piece)
  'sa-marketing':      drawDio,        // Dio Brando (JoJo)
  'sa-cto':            drawLelouch,    // Lelouch (Code Geass)
  'sa-finanzas':       drawL,          // L (Death Note)
  'project-a-data':    drawVegeta,     // Vegeta (Dragon Ball Z)
  'project-b-data':    drawTrunks,     // Trunks (Dragon Ball Z)
  'project-c-data':    drawShikamaru,  // Shikamaru (Naruto)
  'project-d-data':    drawItachi,     // Itachi (Naruto)
  'agent-e1':          drawGoku,       // Goku (Dragon Ball Z)
  'agent-e2':          drawAsuka,      // Asuka (Evangelion)
};

export function drawCharacter(
  g: Graphics,
  x: number,
  y: number,
  _shirtColor: number,
  isOwner: boolean = false,
  agentId?: string
) {
  const drawer = agentId ? CHARACTER_DRAWERS[agentId] : undefined;
  if (drawer) {
    drawer(g, x, y);
  } else {
    drawGeneric(g, x, y, _shirtColor);
  }

  if (isOwner) {
    drawOwnerStar(g, x, y);
  }
}
