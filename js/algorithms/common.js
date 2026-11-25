'use strict';
/* Algorithm registry + helpers shared by every search algorithm.

   To add an algorithm: create js/algorithms/<name>.js, write
   fn(ctx, trace) → { best:{x,y,s}, comps, reqs, iters, steps }, call
   registerAlgorithm(id, 'Display name', fn), then add a <script> tag in index.html.
   A tab and a benchmark row appear automatically.
   (trace=true records teaching steps; trace=false is the pure benchmark path.) */

const Algorithms = { registry: {} };

const registerAlgorithm = (id, name, run) => { Algorithms.registry[id] = { name, run }; };
const algoName = id => Algorithms.registry[id].name;
const runAlgorithm = (id, trace) => Algorithms.registry[id].run(blockCtx(), trace);

/** Evaluate points, dropping those outside the window. */
const score = (ev, pts) => pts.map(p => ({ ...p, s: ev(p.x, p.y) })).filter(p => p.s >= 0);
/** First point with the lowest score (centre-first on ties). */
const lowest = pts => pts.reduce((b, p) => p.s < b.s ? p : b, pts[0]);
/** Strip a point down to {x,y,s}. */
const pt = p => ({ x: p.x, y: p.y, s: p.s });

const makeResult = (best, ev, iters, steps) =>
  ({ best: pt(best), comps: ev.comps, reqs: ev.reqs, iters, steps });

/** Returns record(step), which stamps running counters onto a step and stores it. */
const makeRecorder = (ev, steps, getIter) => step => {
  step.comps = ev.comps; step.reqs = ev.reqs; step.it = getIter(); steps.push(step);
};
