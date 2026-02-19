import { Graphics } from 'pixi.js';
import { PALETTE } from './palette';

// Top-down Gather.town style furniture

export function drawDesk(g: Graphics, x: number, y: number) {
  // Shadow
  g.rect(x + 2, y + 2, 40, 20);
  g.fill({ color: PALETTE.black, alpha: 0.12 });

  // Desk surface
  g.roundRect(x, y, 40, 20, 2);
  g.fill(PALETTE.deskTop);

  // Edge/front face
  g.rect(x, y + 18, 40, 2);
  g.fill(PALETTE.deskSide);

  // Items on desk — papers
  g.rect(x + 4, y + 3, 8, 6);
  g.fill({ color: PALETTE.white, alpha: 0.25 });
  g.rect(x + 30, y + 4, 6, 4);
  g.fill({ color: PALETTE.white, alpha: 0.15 });
}

export function drawComputer(g: Graphics, x: number, y: number) {
  // Shadow
  g.rect(x + 2, y + 2, 24, 22);
  g.fill({ color: PALETTE.black, alpha: 0.12 });

  // Monitor frame
  g.roundRect(x, y, 24, 18, 2);
  g.fill(PALETTE.screenFrame);

  // Screen
  g.rect(x + 2, y + 2, 20, 13);
  g.fill(PALETTE.screenBg);

  // Code lines on screen
  g.rect(x + 4, y + 4, 10, 1);
  g.fill({ color: PALETTE.screenCode, alpha: 0.9 });
  g.rect(x + 4, y + 6, 14, 1);
  g.fill({ color: PALETTE.screenGlow, alpha: 0.7 });
  g.rect(x + 6, y + 8, 8, 1);
  g.fill({ color: PALETTE.screenCode, alpha: 0.6 });
  g.rect(x + 4, y + 10, 12, 1);
  g.fill({ color: PALETTE.screenGlow, alpha: 0.5 });

  // Screen glow halo
  g.rect(x + 1, y + 1, 22, 15);
  g.fill({ color: PALETTE.screenGlow, alpha: 0.04 });

  // Keyboard
  g.roundRect(x + 4, y + 18, 16, 4, 1);
  g.fill({ color: PALETTE.chairSeat, alpha: 0.8 });
  // Key dots
  for (let i = 0; i < 4; i++) {
    g.rect(x + 6 + i * 3, y + 19, 2, 1);
    g.fill({ color: PALETTE.white, alpha: 0.2 });
  }
}

export function drawPlant(g: Graphics, x: number, y: number) {
  // Shadow
  g.ellipse(x + 7, y + 20, 8, 3);
  g.fill({ color: PALETTE.black, alpha: 0.1 });

  // Pot
  g.roundRect(x + 2, y + 14, 10, 6, 2);
  g.fill(PALETTE.potBrown);
  g.rect(x + 1, y + 14, 12, 2);
  g.fill(PALETTE.potRim);

  // Leaves (overlapping circles — lush)
  g.circle(x + 7, y + 7, 6);
  g.fill(PALETTE.leafGreen);
  g.circle(x + 4, y + 10, 4);
  g.fill(PALETTE.leafDark);
  g.circle(x + 10, y + 9, 4);
  g.fill(PALETTE.leafDark);
  g.circle(x + 7, y + 4, 4);
  g.fill(PALETTE.leafLight);

  // Center highlight
  g.circle(x + 7, y + 7, 1.5);
  g.fill({ color: PALETTE.leafLight, alpha: 0.6 });
}

export function drawBookshelf(g: Graphics, x: number, y: number) {
  // Shadow
  g.rect(x + 2, y + 2, 24, 30);
  g.fill({ color: PALETTE.black, alpha: 0.12 });

  // Shelf frame
  g.roundRect(x, y, 24, 28, 2);
  g.fill(PALETTE.shelfWood);

  // Inner back
  g.rect(x + 2, y + 2, 20, 24);
  g.fill(PALETTE.shelfBack);

  // Book rows
  const bookColors = [PALETTE.bookRed, PALETTE.bookBlue, PALETTE.bookGreen, PALETTE.bookYellow, PALETTE.bookPurple];
  for (let row = 0; row < 3; row++) {
    const by = y + 3 + row * 8;
    // Shelf divider
    g.rect(x + 2, by + 6, 20, 1);
    g.fill({ color: PALETTE.shelfWood, alpha: 0.6 });

    // Books
    let bx = x + 3;
    for (let b = 0; b < 4; b++) {
      const bw = 3 + (b % 3);
      const bh = 5;
      g.rect(bx, by, bw, bh);
      g.fill(bookColors[(row * 4 + b) % bookColors.length]);
      bx += bw + 1;
    }
  }
}

export function drawGolfBag(g: Graphics, x: number, y: number) {
  // Shadow
  g.ellipse(x + 8, y + 30, 7, 3);
  g.fill({ color: PALETTE.black, alpha: 0.1 });

  // Bag body
  g.roundRect(x + 2, y + 10, 12, 20, 3);
  g.fill(0x2d5a27); // dark green bag
  g.roundRect(x + 3, y + 11, 10, 8, 2);
  g.fill(0x3a7a32); // lighter pocket

  // Bag rim
  g.rect(x + 1, y + 10, 14, 2);
  g.fill(0x1a3a18);

  // Club shafts sticking out
  g.rect(x + 4, y, 1, 14);
  g.fill(0xc0c0c0); // silver shaft
  g.rect(x + 7, y - 2, 1, 16);
  g.fill(0xc0c0c0);
  g.rect(x + 10, y + 1, 1, 13);
  g.fill(0xd4a843); // gold shaft

  // Club heads
  g.roundRect(x + 2, y - 2, 4, 3, 1);
  g.fill(0x888888); // iron head
  g.roundRect(x + 5, y - 5, 5, 4, 2);
  g.fill(0x333333); // driver head
  g.roundRect(x + 9, y - 1, 3, 3, 1);
  g.fill(0xd4a843); // putter head
}

export function drawMicroscope(g: Graphics, x: number, y: number) {
  // Shadow
  g.ellipse(x + 8, y + 24, 7, 3);
  g.fill({ color: PALETTE.black, alpha: 0.1 });

  // Base plate
  g.roundRect(x + 1, y + 18, 14, 6, 2);
  g.fill(0x2a2a3a); // dark metal

  // Stage (sample platform)
  g.rect(x + 3, y + 15, 10, 3);
  g.fill(0x444460);

  // Arm (vertical pillar)
  g.rect(x + 6, y + 2, 4, 16);
  g.fill(0x3a3a50);

  // Eyepiece tube (angled)
  g.rect(x + 2, y, 6, 4);
  g.fill(0x555570);
  // Eyepiece lens
  g.circle(x + 5, y, 3);
  g.fill(0x222238);
  g.circle(x + 5, y, 1.5);
  g.fill({ color: 0x88aaff, alpha: 0.6 }); // blue lens glow

  // Objective lens (pointing down at stage)
  g.rect(x + 7, y + 12, 3, 4);
  g.fill(0x555570);
  g.circle(x + 8.5, y + 16, 1.5);
  g.fill({ color: 0x88ccff, alpha: 0.4 });

  // Focus knob
  g.circle(x + 12, y + 10, 2);
  g.fill(0x666680);
  g.circle(x + 12, y + 10, 1);
  g.fill(0x777790);
}

export function drawFlask(g: Graphics, x: number, y: number) {
  // Shadow
  g.ellipse(x + 6, y + 22, 6, 2);
  g.fill({ color: PALETTE.black, alpha: 0.08 });

  // Flask body (erlenmeyer shape — wide bottom, narrow top)
  // Bottom bulb
  g.roundRect(x + 1, y + 12, 10, 10, 3);
  g.fill({ color: 0xddeeff, alpha: 0.5 }); // glass

  // Neck
  g.rect(x + 3, y + 4, 6, 10);
  g.fill({ color: 0xddeeff, alpha: 0.4 });

  // Rim
  g.rect(x + 2, y + 3, 8, 2);
  g.fill({ color: 0xccddee, alpha: 0.6 });

  // Liquid inside
  g.roundRect(x + 2, y + 14, 8, 7, 2);
  g.fill({ color: 0x44ee88, alpha: 0.5 }); // green liquid

  // Bubble
  g.circle(x + 5, y + 15, 1);
  g.fill({ color: 0xffffff, alpha: 0.4 });
  g.circle(x + 7, y + 17, 0.7);
  g.fill({ color: 0xffffff, alpha: 0.3 });

  // Glass highlight
  g.rect(x + 8, y + 6, 1, 8);
  g.fill({ color: 0xffffff, alpha: 0.25 });
}

export function drawTestTubes(g: Graphics, x: number, y: number) {
  // Shadow
  g.ellipse(x + 10, y + 24, 9, 2);
  g.fill({ color: PALETTE.black, alpha: 0.08 });

  // Rack base
  g.roundRect(x, y + 18, 20, 5, 1);
  g.fill(0x8b7b60); // wood rack
  g.rect(x + 1, y + 18, 18, 1);
  g.fill(0x9a8a70);

  // Rack top bar
  g.rect(x + 1, y + 6, 18, 2);
  g.fill(0x8b7b60);

  // Test tubes
  const tubeColors = [0x44aaff, 0xff6688, 0xaaee44, 0xffaa33];
  for (let i = 0; i < 4; i++) {
    const tx = x + 3 + i * 4;
    // Glass tube
    g.rect(tx, y + 7, 3, 12);
    g.fill({ color: 0xddeeff, alpha: 0.35 });
    // Liquid
    g.rect(tx, y + 12, 3, 6);
    g.fill({ color: tubeColors[i], alpha: 0.5 });
    // Bottom round
    g.circle(tx + 1.5, y + 18, 1.5);
    g.fill({ color: tubeColors[i], alpha: 0.5 });
    // Highlight
    g.rect(tx + 2, y + 8, 0.5, 8);
    g.fill({ color: 0xffffff, alpha: 0.2 });
  }
}

export function drawWhiteboard(g: Graphics, x: number, y: number) {
  // Shadow
  g.rect(x + 2, y + 2, 36, 26);
  g.fill({ color: PALETTE.black, alpha: 0.1 });

  // Board frame
  g.roundRect(x, y, 36, 24, 2);
  g.fill(0x888898); // metal frame

  // White surface
  g.rect(x + 2, y + 2, 32, 20);
  g.fill(0xf0f0f5);

  // Scribbles (formulas/diagrams)
  g.rect(x + 4, y + 5, 12, 1);
  g.fill({ color: 0x2244cc, alpha: 0.5 });
  g.rect(x + 4, y + 8, 8, 1);
  g.fill({ color: 0x2244cc, alpha: 0.4 });
  g.rect(x + 4, y + 11, 14, 1);
  g.fill({ color: 0xcc2244, alpha: 0.4 });

  // Diagram circle
  g.circle(x + 26, y + 10, 4);
  g.stroke({ color: 0x22aa44, alpha: 0.4, width: 1 });
  // Arrow
  g.rect(x + 18, y + 14, 8, 1);
  g.fill({ color: 0x22aa44, alpha: 0.4 });

  // Marker tray
  g.rect(x + 4, y + 22, 28, 2);
  g.fill(0x777788);
  // Markers
  g.rect(x + 6, y + 22, 6, 1.5);
  g.fill(0x2244cc);
  g.rect(x + 14, y + 22, 6, 1.5);
  g.fill(0xcc2244);
  g.rect(x + 22, y + 22, 6, 1.5);
  g.fill(0x22aa44);
}

export function drawChair(g: Graphics, _x: number, _y: number) {
  // Placeholder — not used in current layout
}
