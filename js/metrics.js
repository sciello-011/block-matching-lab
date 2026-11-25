'use strict';
/* Metrics — SAD / MAD / MSD, window check, memoised evaluator. Pure, no DOM. */

const Metrics = (() => {
  const N = CONFIG.size;

  /** Error between the reference block and the candidate shifted by (dx,dy). */
  function error({ cur, prev, bx, by, B, metric }, dx, dy) {
    let sum = 0;
    const x0 = bx + dx, y0 = by + dy;
    for (let j = 0; j < B; j++) {
      const a = (by + j) * N + bx, b = (y0 + j) * N + x0;
      for (let i = 0; i < B; i++) {
        const d = cur[a + i] - prev[b + i];
        sum += metric === 2 ? d * d : Math.abs(d);
      }
    }
    return metric ? sum / (B * B) : sum;
  }

  /** Is shift (dx,dy) inside both the ±W window and the frame? */
  const inWindow = ({ bx, by, B, W }, dx, dy) =>
    Math.abs(dx) <= W && Math.abs(dy) <= W &&
    bx + dx >= 0 && by + dy >= 0 && bx + dx + B <= N && by + dy + B <= N;

  /** ev(dx,dy) → error, or -1 if out of range.
   *  ev.comps = unique computations, ev.reqs = total requests. */
  function createEvaluator(ctx) {
    const cache = new Map();
    const ev = (dx, dy) => {
      if (!inWindow(ctx, dx, dy)) return -1;
      ev.reqs++;
      const key = dx * 100 + dy;
      if (!cache.has(key)) { ev.comps++; cache.set(key, error(ctx, dx, dy)); }
      return cache.get(key);
    };
    ev.reqs = 0; ev.comps = 0;
    return ev;
  }

  return { error, inWindow, createEvaluator };
})();
