'use strict';
/* State — the single mutable application state, plus tiny helpers that read it. */

const S = {
  metric: 0, showMV: true,
  scene: 0, frames: [], frame: 6, cur: null, prev: null,
  bx: 24, by: 24, B: 8, W: 4,          // reference block position / size, search range
  alg: 'ota', mode: 'guided',
  steps: [], idx: -1, picks: [],       // teaching steps, current step, guided answers
  timer: null, playTimer: null, benchTimer: null,
};

/** Snapshot of everything an algorithm or metric needs (override fields via `over`). */
const blockCtx = (over = {}) => ({
  cur: S.cur, prev: S.prev, bx: S.bx, by: S.by, B: S.B, W: S.W, metric: S.metric, ...over,
});

const metricName = () => METRIC_NAMES[S.metric];

/** Format a metric value. `short` shortens large/fractional numbers (grid cells). */
const fmt = (v, short) =>
  !S.metric ? '' + v : short && v >= 100 ? '' + Math.round(v) : v.toFixed(short ? 1 : 2);
