import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { PALETTE } from './palette';
import { CHARACTER_WIDTH, CHARACTER_HEIGHT } from './pokemonAvatars';

const NUNITO_FONT = 'Nunito, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';

export function createActiveGlow(x: number, y: number, w: number, h: number): Graphics {
  const glow = new Graphics();
  // Bigger, brighter green glow beneath active character (ground light)
  glow.ellipse(x + w / 2, y + h - 6, 16, 6);
  glow.fill({ color: PALETTE.statusWorking, alpha: 0.5 });
  return glow;
}

export function createReadyGlow(x: number, y: number, w: number, h: number): Graphics {
  const glow = new Graphics();
  // Subtle steady blue glow
  glow.ellipse(x + w / 2, y + h - 6, 14, 5);
  glow.fill({ color: PALETTE.statusReady, alpha: 0.3 });
  return glow;
}

export function createRoomLabel(text: string, x: number, y: number, color: number): Container {
  const container = new Container();

  const label = new Text({
    text,
    style: new TextStyle({
      fontFamily: NUNITO_FONT,
      fontSize: 12,
      fill: PALETTE.white,
      fontWeight: '700',
      letterSpacing: 1,
    }),
  });

  // Stronger pill bg with 1px border
  const padX = 8;
  const padY = 4;
  const pillW = label.width + padX * 2;
  const pillH = label.height + padY * 2;

  const bg = new Graphics();
  bg.roundRect(0, 0, pillW, pillH, 4);
  bg.fill({ color, alpha: 0.95 });
  bg.roundRect(0, 0, pillW, pillH, 4);
  bg.stroke({ color: PALETTE.white, width: 1, alpha: 0.15 });

  label.x = padX;
  label.y = padY;

  container.addChild(bg);
  container.addChild(label);
  container.x = x;
  container.y = y;

  return container;
}

/**
 * 3 green dots orbiting above agent head — working indicator
 */
export function createWorkingIndicator(): Container {
  const container = new Container();
  const cx = CHARACTER_WIDTH / 2;

  for (let i = 0; i < 3; i++) {
    const dot = new Graphics();
    dot.circle(0, 0, 2);
    dot.fill(PALETTE.statusWorking);
    dot.x = cx;
    dot.y = -8;
    dot.label = `dot${i}`;
    container.addChild(dot);
  }

  return container;
}

/**
 * Blue checkmark bubble to the right of character — ready indicator
 */
export function createReadyIndicator(): Container {
  const container = new Container();
  const rx = CHARACTER_WIDTH + 4;
  const ry = CHARACTER_HEIGHT / 2 - 4;

  // Small blue bubble
  const bg = new Graphics();
  bg.circle(rx, ry, 5);
  bg.fill({ color: PALETTE.statusReady, alpha: 0.8 });
  container.addChild(bg);

  // Checkmark
  const check = new Graphics();
  check.moveTo(rx - 3, ry);
  check.lineTo(rx - 1, ry + 2);
  check.lineTo(rx + 3, ry - 3);
  check.stroke({ color: PALETTE.white, width: 1.5 });
  container.addChild(check);

  return container;
}

/**
 * Animated "Z" letters floating up from sleeping agent — Zzz effect
 */
export function createZzzEffect(): Container {
  const container = new Container();
  const cx = CHARACTER_WIDTH / 2 + 6;

  const sizes = [7, 5.5, 4];
  const offsets = [{ x: 0, y: -4 }, { x: 4, y: -12 }, { x: 2, y: -20 }];

  for (let i = 0; i < 3; i++) {
    const z = new Text({
      text: 'z',
      style: new TextStyle({
        fontFamily: NUNITO_FONT,
        fontSize: sizes[i],
        fill: PALETTE.statusIdle,
        fontWeight: '700',
      }),
    });
    z.x = cx + offsets[i].x;
    z.y = offsets[i].y;
    z.alpha = 0.7 - i * 0.2;
    z.label = `z${i}`;
    container.addChild(z);
  }

  return container;
}

/**
 * Green ring expanding outward + flash — completion effect
 */
export function createCompletionFlash(): Container {
  const container = new Container();
  const cx = CHARACTER_WIDTH / 2;
  const cy = CHARACTER_HEIGHT / 2;

  const ring = new Graphics();
  ring.circle(cx, cy, 12);
  ring.stroke({ color: PALETTE.statusWorking, width: 2, alpha: 0.8 });
  ring.label = 'ring';
  container.addChild(ring);

  const flash = new Graphics();
  flash.circle(cx, cy, 8);
  flash.fill({ color: PALETTE.white, alpha: 0.4 });
  flash.label = 'flash';
  container.addChild(flash);

  return container;
}

export function animateGlow(glow: Graphics, time: number) {
  glow.alpha = 0.5 + Math.sin(time * 2.5) * 0.25;
}

export function animateReadyGlow(glow: Graphics, time: number) {
  glow.alpha = 0.25 + Math.sin(time * 1.2) * 0.1;
}

export function animateWorkingIndicator(container: Container, time: number) {
  const cx = CHARACTER_WIDTH / 2;
  for (let i = 0; i < 3; i++) {
    const dot = container.getChildByLabel(`dot${i}`);
    if (dot) {
      const angle = time * 3 + (i * Math.PI * 2) / 3;
      dot.x = cx + Math.cos(angle) * 7;
      dot.y = -8 + Math.sin(angle) * 3;
    }
  }
}

export function animateZzz(container: Container, time: number) {
  for (let i = 0; i < 3; i++) {
    const z = container.getChildByLabel(`z${i}`);
    if (z) {
      const phase = (time * 0.8 + i * 0.5) % 2;
      z.alpha = Math.max(0, 0.7 - i * 0.2 - phase * 0.3);
      z.y = -4 - i * 8 - Math.sin(phase * Math.PI) * 4;
    }
  }
}

/**
 * Large amber pulsing notification badge — "unread response" indicator
 * Floats above character, bounces gently, very visible
 */
export function createUnreadBadge(): Container {
  const container = new Container();
  const cx = CHARACTER_WIDTH / 2;
  const cy = -14;

  // Large outer glow
  const glow = new Graphics();
  glow.circle(cx, cy, 16);
  glow.fill({ color: PALETTE.statusIdle, alpha: 0.2 });
  glow.label = 'glow';
  container.addChild(glow);

  // Pulsing ring
  const ring = new Graphics();
  ring.circle(cx, cy, 11);
  ring.stroke({ color: PALETTE.statusIdle, width: 1.5, alpha: 0.6 });
  ring.label = 'ring';
  container.addChild(ring);

  // Badge circle (larger)
  const badge = new Graphics();
  badge.circle(cx, cy, 8);
  badge.fill({ color: PALETTE.statusIdle, alpha: 0.95 });
  badge.circle(cx, cy, 8);
  badge.stroke({ color: 0xffffff, width: 1, alpha: 0.3 });
  badge.label = 'badge';
  container.addChild(badge);

  // Chat bubble icon (speech lines)
  const icon = new Graphics();
  // Three horizontal lines like a message
  icon.rect(cx - 4, cy - 3, 8, 1.5);
  icon.fill(PALETTE.white);
  icon.rect(cx - 4, cy - 0.5, 6, 1.5);
  icon.fill(PALETTE.white);
  icon.rect(cx - 4, cy + 2, 4, 1.5);
  icon.fill(PALETTE.white);
  container.addChild(icon);

  return container;
}

export function animateUnreadBadge(container: Container, time: number) {
  const glow = container.getChildByLabel('glow');
  const ring = container.getChildByLabel('ring');
  const badge = container.getChildByLabel('badge');

  // Bounce up and down
  const bounce = Math.sin(time * 2.5) * 3;
  container.y = bounce;

  // Pulse glow
  if (glow) {
    glow.alpha = 0.15 + Math.sin(time * 3) * 0.12;
    glow.scale.set(1 + Math.sin(time * 3) * 0.15);
  }

  // Ring pulse
  if (ring) {
    ring.alpha = 0.4 + Math.sin(time * 3 + 0.5) * 0.3;
    ring.scale.set(1 + Math.sin(time * 3) * 0.08);
  }

  // Badge subtle pulse
  if (badge) {
    badge.alpha = 0.85 + Math.sin(time * 3) * 0.15;
  }
}

export function animateCompletionFlash(container: Container, time: number, startTime: number): boolean {
  const elapsed = time - startTime;
  if (elapsed > 1.5) return true; // done

  const ring = container.getChildByLabel('ring');
  const flash = container.getChildByLabel('flash');

  if (ring) {
    const scale = 1 + elapsed * 2;
    ring.scale.set(scale);
    ring.alpha = Math.max(0, 1 - elapsed);
  }

  if (flash) {
    flash.alpha = Math.max(0, 0.6 - elapsed * 0.8);
  }

  return false;
}

/**
 * Draw a pixel-art envelope shape into a Graphics object
 * Body: 14x10 rounded rect, Flap: V-shape on top, all filled solid
 */
function drawEnvelope(g: Graphics, cx: number, cy: number, color: number) {
  // Envelope body
  g.roundRect(cx - 7, cy - 4, 14, 10, 1);
  g.fill({ color, alpha: 0.95 });
  g.roundRect(cx - 7, cy - 4, 14, 10, 1);
  g.stroke({ color: 0xffffff, width: 0.8, alpha: 0.5 });

  // Flap (V on top)
  g.moveTo(cx - 7, cy - 4);
  g.lineTo(cx, cy + 1);
  g.lineTo(cx + 7, cy - 4);
  g.stroke({ color: 0xffffff, width: 0.8, alpha: 0.6 });
}

/**
 * Teal envelope that floats up from sprite — send indicator (~2s)
 */
export function createSendFlash(): Container {
  const container = new Container();
  const cx = CHARACTER_WIDTH / 2 + 14;
  const cy = CHARACTER_HEIGHT / 2 - 8;

  // Glow behind envelope
  const glow = new Graphics();
  glow.circle(cx, cy, 12);
  glow.fill({ color: PALETTE.accentTeal, alpha: 0.25 });
  glow.label = 'glow';
  container.addChild(glow);

  // Envelope
  const env = new Graphics();
  drawEnvelope(env, cx, cy, PALETTE.accentTeal);
  env.label = 'env';
  container.addChild(env);

  // Small up-arrow above envelope
  const arrow = new Graphics();
  arrow.moveTo(cx - 3, cy - 8);
  arrow.lineTo(cx, cy - 12);
  arrow.lineTo(cx + 3, cy - 8);
  arrow.fill({ color: PALETTE.accentTeal, alpha: 0.8 });
  arrow.label = 'arrow';
  container.addChild(arrow);

  return container;
}

export function animateSendFlash(container: Container, progress: number): boolean {
  const DURATION = 2.0;
  if (progress > DURATION) return true;

  const t = progress / DURATION; // 0→1

  // Float up 24px over the full duration
  container.y = -t * 24;

  // Fade: full opacity for first 60%, then fade out
  if (t < 0.6) {
    container.alpha = 1;
  } else {
    container.alpha = 1 - (t - 0.6) / 0.4;
  }

  // Gentle pulse on the glow
  const glow = container.getChildByLabel('glow');
  if (glow) {
    glow.alpha = 0.2 + Math.sin(progress * 6) * 0.15;
    glow.scale.set(1 + Math.sin(progress * 6) * 0.1);
  }

  return false;
}

/**
 * Teal envelope that drops from above with bounce — receive indicator (~2.5s)
 */
export function createReceiveFlash(): Container {
  const container = new Container();
  const cx = CHARACTER_WIDTH / 2;
  const cy = -18;

  // Glow behind envelope
  const glow = new Graphics();
  glow.circle(cx, cy, 14);
  glow.fill({ color: PALETTE.accentTeal, alpha: 0.2 });
  glow.label = 'glow';
  container.addChild(glow);

  // Envelope
  const env = new Graphics();
  drawEnvelope(env, cx, cy, PALETTE.accentTeal);
  env.label = 'env';
  container.addChild(env);

  // Small down-arrow below envelope
  const arrow = new Graphics();
  arrow.moveTo(cx - 3, cy + 9);
  arrow.lineTo(cx, cy + 13);
  arrow.lineTo(cx + 3, cy + 9);
  arrow.fill({ color: PALETTE.accentTeal, alpha: 0.8 });
  arrow.label = 'arrow';
  container.addChild(arrow);

  return container;
}

export function animateReceiveFlash(container: Container, progress: number): boolean {
  const DURATION = 2.5;
  if (progress > DURATION) return true;

  const t = progress / DURATION; // 0→1

  if (t < 0.15) {
    // Drop in from above: y -20 → 0, scale up
    const p = t / 0.15;
    container.y = -20 * (1 - p);
    container.scale.set(0.5 + p * 0.5);
    container.alpha = p;
  } else if (t < 0.25) {
    // Bounce: slight overshoot down then back
    const p = (t - 0.15) / 0.1;
    container.y = Math.sin(p * Math.PI) * 3;
    container.scale.set(1.0 + Math.sin(p * Math.PI) * 0.15);
    container.alpha = 1;
  } else if (t < 0.7) {
    // Hold steady
    container.y = 0;
    container.scale.set(1);
    container.alpha = 1;
  } else {
    // Fade out
    const p = (t - 0.7) / 0.3;
    container.alpha = 1 - p;
    container.y = -p * 8;
  }

  // Pulse glow throughout
  const glow = container.getChildByLabel('glow');
  if (glow) {
    glow.alpha = 0.15 + Math.sin(progress * 5) * 0.12;
    glow.scale.set(1 + Math.sin(progress * 5) * 0.08);
  }

  return false;
}
