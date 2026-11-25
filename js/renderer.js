'use strict';
/* Renderer — all canvas drawing. Reads state, never changes it. */

const Renderer = (() => {
  const { size: N, scale: SC } = CONFIG;

  function paintFrame(canvas, g) {
    const c = canvas.getContext('2d');
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const v = g[y * N + x];
        c.fillStyle = `rgb(${v},${v},${Math.min(255, v + 30)})`;
        c.fillRect(x * SC, y * SC, SC, SC);
      }
    return c;
  }

  const blockBox = (c, x, y, color, w, dash) => {
    c.strokeStyle = color; c.lineWidth = w; c.setLineDash(dash || []);
    c.strokeRect(x * SC + w / 2, y * SC + w / 2, S.B * SC - w, S.B * SC - w);
  };

  function arrow(c, x0, y0, x1, y1, color, w) {
    if (x0 === x1 && y0 === y1) return;
    c.strokeStyle = c.fillStyle = color; c.lineWidth = w; c.setLineDash([]);
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    const a = Math.atan2(y1 - y0, x1 - x0), h = 8 + w;
    c.beginPath(); c.moveTo(x1, y1);
    c.lineTo(x1 - h * Math.cos(a - .4), y1 - h * Math.sin(a - .4));
    c.lineTo(x1 - h * Math.cos(a + .4), y1 - h * Math.sin(a + .4));
    c.fill();
  }

  function drawCurrentFrame() {
    const c = paintFrame($('cc'), S.cur);
    c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 1; c.setLineDash([]);
    for (let k = 0; k <= N; k += S.B) {                 // block grid
      c.beginPath();
      c.moveTo(k * SC + .5, 0); c.lineTo(k * SC + .5, N * SC);
      c.moveTo(0, k * SC + .5); c.lineTo(N * SC, k * SC + .5);
      c.stroke();
    }
    blockBox(c, S.bx, S.by, COLORS.ref, 3);
  }

  function drawPreviousFrame(step) {
    const { bx, by, B, W } = S;
    const c = paintFrame($('pc'), S.prev);
    const x0 = Math.max(0, bx - W), y0 = Math.max(0, by - W);
    const x1 = Math.min(N, bx + B + W), y1 = Math.min(N, by + B + W);
    c.setLineDash([6, 4]); c.strokeStyle = COLORS.cur; c.lineWidth = 2;        // search area
    c.strokeRect(x0 * SC + 1, y0 * SC + 1, (x1 - x0) * SC - 2, (y1 - y0) * SC - 2);
    blockBox(c, bx, by, COLORS.ref, 2, [4, 3]);
    if (!step) return;

    // shade every pixel covered by an evaluated candidate
    c.setLineDash([]);
    const covered = new Uint8Array(N * N);
    Sel.evaluated().forEach(q => {
      for (let j = 0; j < B; j++) for (let i = 0; i < B; i++) covered[(by + q.y + j) * N + bx + q.x + i] = 1;
    });
    c.fillStyle = 'rgba(255,210,63,.35)';
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (covered[y * N + x]) c.fillRect(x * SC, y * SC, SC, SC);

    blockBox(c, bx, by, COLORS.ref, 2, [4, 3]);
    step.cands.forEach(q => blockBox(c, bx + q.x, by + q.y, COLORS.cand, 2));
    const best = Sel.bestAt(S.idx);
    if (best) {
      blockBox(c, bx + best.x, by + best.y, COLORS.best, 3);
      if (S.showMV) arrow(c, (bx + B / 2) * SC, (by + B / 2) * SC,
                          (bx + best.x + B / 2) * SC, (by + best.y + B / 2) * SC, COLORS.best, 3);
    }
  }

  function drawSearchGrid(step) {
    const W = S.W, n = 2 * W + 1, cs = Math.floor(CONFIG.gridCanvasPx / n);
    const g = $('gc'); g.width = g.height = cs * n;
    const c = g.getContext('2d');
    c.font = Math.max(9, cs / 3 | 0) + 'px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const evaluated = Sel.evaluated(), now = new Set(), best = step && Sel.bestAt(S.idx);
    if (step) step.cands.forEach(q => now.add(q.x + ',' + q.y));
    const centreOf = (x, y) => [(x + W + .5) * cs, (y + W + .5) * cs];
    const ctx = blockCtx();

    for (let y = -W; y <= W; y++)                        // cells
      for (let x = -W; x <= W; x++) {
        const key = x + ',' + y, X = (x + W) * cs, Y = (y + W) * cs;
        let fill = Metrics.inWindow(ctx, x, y) ? '#1c2230' : '#07090d';
        if (evaluated.has(key)) fill = '#3a3f4d';
        if (now.has(key)) fill = '#8a6d00';
        if (best && best.x === x && best.y === y) fill = '#16703f';
        c.fillStyle = fill; c.fillRect(X + 1, Y + 1, cs - 2, cs - 2);
        if (!x && !y) { c.strokeStyle = COLORS.ref; c.lineWidth = 2; c.strokeRect(X + 2, Y + 2, cs - 4, cs - 4); }
        if (evaluated.has(key) && cs >= 24) {
          c.fillStyle = '#fff'; c.fillText(fmt(evaluated.get(key).s, true), X + cs / 2, Y + cs / 2);
        }
      }
    if (!step || !S.showMV) return;

    let from = { x: 0, y: 0 };                           // search path
    for (let k = 0; k <= S.idx; k++) {
      const b = Sel.bestAt(k);
      if (b && (b.x !== from.x || b.y !== from.y)) {
        arrow(c, ...centreOf(from.x, from.y), ...centreOf(b.x, b.y), COLORS.cur, 2);
        from = { x: b.x, y: b.y };
      }
    }
    for (let k = 0; k <= S.idx; k++) {                   // waypoints
      const b = Sel.bestAt(k); if (!b) continue;
      const [X, Y] = centreOf(b.x, b.y);
      c.fillStyle = '#000'; c.strokeStyle = '#fff'; c.lineWidth = 1.5;
      c.beginPath(); c.arc(X, Y, cs / 9 + 1, 0, 7); c.fill(); c.stroke();
    }
    if (best && (best.x || best.y)) {                    // final motion vector
      arrow(c, ...centreOf(0, 0), ...centreOf(best.x, best.y), COLORS.best, 3);
      const [X, Y] = centreOf(best.x, best.y);
      c.fillStyle = COLORS.best;
      c.fillText(`MV (${best.x},${best.y})`, Math.min(g.width - 40, Math.max(40, X)), Math.max(10, Y - cs * .45));
    }
  }

  function drawAll() {
    const step = S.steps[S.idx];
    drawCurrentFrame(); drawPreviousFrame(step); drawSearchGrid(step);
  }

  return { drawAll };
})();
