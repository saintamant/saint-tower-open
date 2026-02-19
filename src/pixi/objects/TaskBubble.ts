import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { PALETTE } from '../drawing/palette';

const SANS_FONT = '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
const MAX_CHARS = 20;
const BUBBLE_PADDING = 5;
const FONT_SIZE = 7;
const BOB_SPEED = 1.5;
const BOB_RANGE = 1;
const HIDE_AFTER = 30;

export class TaskBubble extends Container {
  private bg: Graphics;
  private taskLabel: Text;
  private dotIndicator: Text;
  private _elapsed = 0;
  private _showTimer = 0;
  private _collapsed = false;
  private borderColor: number;

  constructor(borderColor: number = PALETTE.bubbleBorder) {
    super();
    this.borderColor = borderColor;

    this.bg = new Graphics();
    this.addChild(this.bg);

    this.taskLabel = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: SANS_FONT,
        fontSize: FONT_SIZE,
        fill: PALETTE.textDark,
      }),
    });
    this.taskLabel.x = BUBBLE_PADDING + 1;
    this.taskLabel.y = BUBBLE_PADDING;
    this.addChild(this.taskLabel);

    this.dotIndicator = new Text({
      text: '...',
      style: new TextStyle({
        fontFamily: SANS_FONT,
        fontSize: FONT_SIZE,
        fill: PALETTE.textDim,
      }),
    });
    this.dotIndicator.visible = false;
    this.addChild(this.dotIndicator);

    this.visible = false;
  }

  setTask(task: string | null) {
    if (!task) {
      this.visible = false;
      return;
    }

    this.visible = true;
    this._collapsed = false;
    this._showTimer = 0;

    const truncated = task.length > MAX_CHARS
      ? task.substring(0, MAX_CHARS) + '...'
      : task;

    this.taskLabel.text = truncated;
    this.taskLabel.visible = true;
    this.dotIndicator.visible = false;

    this.drawBubble();
  }

  private drawBubble() {
    this.bg.clear();

    const textWidth = this.taskLabel.width;
    const textHeight = this.taskLabel.height;
    const w = textWidth + BUBBLE_PADDING * 2 + 2;
    const h = textHeight + BUBBLE_PADDING * 2;

    // White bubble (Gather style)
    this.bg.roundRect(0, 0, w, h, 4);
    this.bg.fill({ color: PALETTE.bubbleBg, alpha: 0.95 });
    this.bg.roundRect(0, 0, w, h, 4);
    this.bg.stroke({ color: this.borderColor, width: 1, alpha: 0.5 });

    // Pointer triangle
    const cx = w / 2;
    this.bg.moveTo(cx - 3, h);
    this.bg.lineTo(cx, h + 4);
    this.bg.lineTo(cx + 3, h);
    this.bg.fill({ color: PALETTE.bubbleBg, alpha: 0.95 });

    this.dotIndicator.x = (w - this.dotIndicator.width) / 2;
    this.dotIndicator.y = BUBBLE_PADDING;
  }

  update(deltaTime: number) {
    if (!this.visible) return;

    this._elapsed += deltaTime / 60;
    this._showTimer += deltaTime / 60;

    // Subtle bobbing
    this.y = -32 + Math.sin(this._elapsed * BOB_SPEED) * BOB_RANGE;

    // Collapse after HIDE_AFTER seconds
    if (!this._collapsed && this._showTimer > HIDE_AFTER) {
      this._collapsed = true;
      this.taskLabel.visible = false;
      this.dotIndicator.visible = true;

      this.bg.clear();
      const w = this.dotIndicator.width + BUBBLE_PADDING * 2;
      const h = this.dotIndicator.height + BUBBLE_PADDING * 2;
      this.bg.roundRect(0, 0, w, h, 4);
      this.bg.fill({ color: PALETTE.bubbleBg, alpha: 0.95 });
      this.bg.roundRect(0, 0, w, h, 4);
      this.bg.stroke({ color: this.borderColor, width: 1, alpha: 0.3 });
    }
  }
}
