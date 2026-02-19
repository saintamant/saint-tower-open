import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { PALETTE } from '../drawing/palette';

const SANS_FONT = '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';

export class RoomHUD extends Container {
  private taskText: Text;
  private errorText: Text;
  private agentDots: Graphics;
  private errorFlash = 0;

  constructor() {
    super();

    this.taskText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: SANS_FONT,
        fontSize: 7,
        fill: PALETTE.white,
        fontWeight: '500',
      }),
    });
    this.taskText.alpha = 0.8;
    this.addChild(this.taskText);

    this.errorText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: SANS_FONT,
        fontSize: 7,
        fill: PALETTE.healthCritical,
        fontWeight: '500',
      }),
    });
    this.errorText.x = 0;
    this.errorText.y = 10;
    this.errorText.visible = false;
    this.addChild(this.errorText);

    this.agentDots = new Graphics();
    this.agentDots.y = 20;
    this.addChild(this.agentDots);
  }

  setStats(activeTasks: number, errors: number, activeAgentCount: number) {
    this.taskText.text = activeTasks > 0 ? `${activeTasks} tasks` : '';

    if (errors > 0) {
      this.errorText.text = `${errors} err`;
      this.errorText.visible = true;
    } else {
      this.errorText.visible = false;
    }

    this.agentDots.clear();
    for (let i = 0; i < activeAgentCount; i++) {
      this.agentDots.circle(i * 7 + 2, 2, 2);
      this.agentDots.fill({ color: PALETTE.statusActive, alpha: 0.8 });
    }
  }

  update(deltaTime: number) {
    if (this.errorText.visible) {
      this.errorFlash += deltaTime / 60;
      this.errorText.alpha = 0.5 + Math.sin(this.errorFlash * 3) * 0.3;
    }
  }
}
