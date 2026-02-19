import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { PALETTE } from '../drawing/palette';
import { CANVAS_WIDTH, ROOF_Y } from '../layout/buildingLayout';

const NUNITO_FONT = 'Nunito, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';

export class RoofSign extends Container {
  private accentTop: Graphics;
  private accentBottom: Graphics;
  private _elapsed = 0;

  constructor() {
    super();

    const signWidth = 300;
    const signHeight = 40;
    const signX = (CANVAS_WIDTH - signWidth) / 2 + 30;
    const signY = ROOF_Y;

    const g = new Graphics();

    // Dark background with rounded corners
    g.roundRect(signX, signY, signWidth, signHeight, 6);
    g.fill(PALETTE.signBg);
    g.roundRect(signX, signY, signWidth, signHeight, 6);
    g.stroke({ color: PALETTE.signBorder, width: 1 });

    this.addChild(g);

    // Accent color top line (Gather green)
    this.accentTop = new Graphics();
    this.accentTop.rect(signX + 2, signY + 1, signWidth - 4, 1);
    this.accentTop.fill(PALETTE.signAccent);
    this.addChild(this.accentTop);

    // Accent color bottom line
    this.accentBottom = new Graphics();
    this.accentBottom.rect(signX + 2, signY + signHeight - 2, signWidth - 4, 1);
    this.accentBottom.fill(PALETTE.signAccent);
    this.addChild(this.accentBottom);

    // Title text — larger, bold, letter-spacing 4
    const style = new TextStyle({
      fontFamily: NUNITO_FONT,
      fontSize: 14,
      fill: PALETTE.signText,
      fontWeight: '800',
      letterSpacing: 4,
    });
    const text = new Text({ text: 'SAINT TOWER', style });
    text.x = signX + (signWidth - text.width) / 2;
    text.y = signY + (signHeight - 14) / 2;
    this.addChild(text);
  }

  update(deltaTime: number) {
    this._elapsed += deltaTime / 60;
    // Subtle animated glow on accent lines
    const glow = 0.7 + Math.sin(this._elapsed * 1.2) * 0.3;
    this.accentTop.alpha = glow;
    this.accentBottom.alpha = glow;
  }
}
