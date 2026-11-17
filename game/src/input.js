// STORMKEEPER — input: mouse drags for clouds and storms, keys for the rest.
// Dragging is the whole game, so the pointer handling is forgiving: a grab
// within a cloud's halo counts, and releasing anywhere drops it. Buttons on
// the HUD and panels are real hit areas, so mouse-only play works end to end.

export class Input {
  constructor(canvas, hooks) {
    this.canvas = canvas;
    this.hooks = hooks; // {onGrab, onDrag, onDrop, onClick, onKey}
    this.dragging = null; // {what: 'cloud'|'storm', item, dx, dy}
    this.mouse = { x: 0, y: 0, down: false };
    canvas.addEventListener('pointerdown', (e) => this.pointerDown(e));
    canvas.addEventListener('pointermove', (e) => this.pointerMove(e));
    canvas.addEventListener('pointerup', (e) => this.pointerUp(e));
    canvas.addEventListener('pointerleave', (e) => this.pointerUp(e));
    window.addEventListener('keydown', (e) => this.keyDown(e));
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  pos(e) {
    const r = this.canvas.getBoundingClientRect();
    const sx = this.canvas.width / r.width;
    const sy = this.canvas.height / r.height;
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
  }

  pointerDown(e) {
    const p = this.pos(e);
    this.mouse.x = p.x; this.mouse.y = p.y; this.mouse.down = true;
    const grab = this.hooks.onGrab(p.x, p.y);
    if (grab) {
      this.dragging = { what: grab.what, item: grab.item, dx: grab.item.x - p.x, dy: grab.item.y - p.y };
    } else {
      this.hooks.onClick(p.x, p.y);
    }
  }

  pointerMove(e) {
    const p = this.pos(e);
    this.mouse.x = p.x; this.mouse.y = p.y;
    if (this.dragging) {
      const d = this.dragging;
      d.item.x = p.x + d.dx;
      d.item.y = p.y + d.dy;
      this.hooks.onDrag(d.what, d.item);
    }
  }

  pointerUp(e) {
    const p = this.pos(e);
    this.mouse.x = p.x; this.mouse.y = p.y; this.mouse.down = false;
    if (this.dragging) {
      this.hooks.onDrop(this.dragging.what, this.dragging.item);
      this.dragging = null;
    }
  }

  keyDown(e) {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
    this.hooks.onKey(k, e);
  }
}
