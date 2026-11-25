'use strict';
/* One-at-a-Time search: horizontal stage, then vertical stage. */

function oneAtATime(ctx, trace) {
  const ev = Metrics.createEvaluator(ctx), steps = [];
  let iters = 0, centre = { x: 0, y: 0 }, best;
  const record = makeRecorder(ev, steps, () => iters);
  const mn = metricName();

  for (const vertical of [false, true]) {
    iters++;
    const names = vertical ? ['Up', 'Down', 'Stay'] : ['Left', 'Right', 'Stay'];
    const pts = score(ev, [0, -1, 1].map(k => ({
      x: centre.x + (vertical ? 0 : k), y: centre.y + (vertical ? k : 0), k })));
    best = lowest(pts);
    const answer = best.k === 0 ? 2 : best.k < 0 ? 0 : 1;

    trace && record({
      title: (vertical ? 'Vertical' : 'Horizontal') + ' stage: test 3 points',
      txt: 'Compare the centre with its ' + (vertical ? 'upper and lower' : 'left and right') + ' neighbours.',
      cands: pts, center: { ...centre }, best: pt(best),
      q: { t: 'Which way should we move?', o: names, a: [answer],
           why: `The lowest ${mn} is ${fmt(best.s)}, so: ${names[answer]}.` },
    });

    if (best.k) {                         // walk in the improving direction
      const dir = best.k;
      for (;;) {
        iters++;
        const nx = vertical ? best.x : best.x + dir, ny = vertical ? best.y + dir : best.y;
        const s = ev(nx, ny);
        if (s < 0) {
          trace && record({ title: 'Window edge', txt: 'The next point is outside the search window, so this stage stops.',
            cands: [], center: pt(best), best: pt(best) });
          break;
        }
        const better = s < best.s;
        trace && record({
          title: 'Keep walking the same way', txt: `Test the next point (${nx},${ny}).`,
          cands: [{ x: nx, y: ny, s }], center: { x: best.x, y: best.y },
          best: better ? { x: nx, y: ny, s } : pt(best),
          q: { t: 'Which way now?', o: names, a: [better ? (dir < 0 ? 0 : 1) : 2],
               why: better ? `${fmt(s)} is lower than ${fmt(best.s)}, so keep going: ${names[dir < 0 ? 0 : 1]}.`
                           : `${fmt(s)} is not lower than ${fmt(best.s)}, so stay.` },
        });
        if (!better) break;
        best = { x: nx, y: ny, s, k: dir };
      }
    }
    centre = { x: best.x, y: best.y };

    if (!vertical && trace) record({
      title: 'Horizontal stage finished', txt: 'The best horizontal point is settled.',
      cands: [], center: pt(best), best: pt(best),
      q: { t: 'Change to vertical?', o: ['Yes, go vertical', 'No, stay horizontal'], a: [0],
           why: 'The horizontal search stopped, so we switch to vertical.' },
    });
  }
  return makeResult(best, ev, iters, steps);
}

registerAlgorithm('ota', 'One-at-a-Time Search', oneAtATime);
