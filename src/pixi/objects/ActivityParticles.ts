import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { PALETTE } from '../drawing/palette';

interface Particle {
  graphics: Graphics | Text;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export class ActivityParticles extends Container {
  private particles: Particle[] = [];

  constructor() {
    super();
  }

  // Sparkle blue when task assigned
  emitTaskAssigned(x: number, y: number) {
    this.emitSparkles(x, y, 0x4488ff, 5);
  }

  // Green check when task completed
  emitTaskCompleted(x: number, y: number) {
    const text = new Text({
      text: '✓',
      style: new TextStyle({
        fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
        fontSize: 10,
        fill: PALETTE.statusActive,
      }),
    });
    text.x = x;
    text.y = y;
    this.addChild(text);

    this.particles.push({
      graphics: text,
      vx: 0,
      vy: -0.8,
      life: 60,
      maxLife: 60,
    });
  }

  // Red X when error
  emitError(x: number, y: number) {
    const text = new Text({
      text: '✕',
      style: new TextStyle({
        fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
        fontSize: 10,
        fill: PALETTE.healthCritical,
      }),
    });
    text.x = x;
    text.y = y;
    this.addChild(text);

    this.particles.push({
      graphics: text,
      vx: 0,
      vy: -0.5,
      life: 80,
      maxLife: 80,
    });
  }

  private emitSparkles(x: number, y: number, color: number, count: number) {
    for (let i = 0; i < count; i++) {
      const g = new Graphics();
      g.circle(0, 0, 1.5);
      g.fill({ color });
      g.x = x + (Math.random() - 0.5) * 10;
      g.y = y;
      this.addChild(g);

      this.particles.push({
        graphics: g,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -1 - Math.random() * 1.5,
        life: 40 + Math.random() * 20,
        maxLife: 50,
      });
    }
  }

  update(deltaTime: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.graphics.x += p.vx * deltaTime;
      p.graphics.y += p.vy * deltaTime;
      p.life -= deltaTime;
      p.graphics.alpha = Math.max(0, p.life / p.maxLife);

      if (p.life <= 0) {
        this.removeChild(p.graphics);
        p.graphics.destroy();
        this.particles.splice(i, 1);
      }
    }
  }
}
