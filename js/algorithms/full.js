'use strict';
/* Full Search: every shift in the window; ties → closest to (0,0).
   The benchmark uses this one (id 'full') as the optimum baseline. */

function fullSearch(ctx, trace) {
  const W = ctx.W, ev = Metrics.createEvaluator(ctx), steps = [];
  let best = { x: 0, y: 0, s: Infinity, d: 1e9 }, n = 0;
  for (let y = -W; y <= W; y++)
    for (let x = -W; x <= W; x++) {
      const s = ev(x, y);
      if (s < 0) continue;
      n++;
      const d = x * x + y * y;
      if (s < best.s || (s === best.s && d < best.d)) best = { x, y, s, d };
      trace && steps.push({
        it: 1, title: 'Candidate ' + n, txt: 'Compute this SAD and keep the position if it beats the best so far.',
        cands: [{ x, y, s }], center: { x, y }, best: pt(best), comps: ev.comps, reqs: ev.reqs });
    }
  return makeResult(best, ev, 1, steps);
}

registerAlgorithm('full', 'Full Search', fullSearch);
