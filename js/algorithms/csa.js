'use strict';
/* Ghanbari's Cross Search: X-shaped search with halving step size,
   then a final + (Greek) or X (St Andrew's) cross. */

function stepSizeQuestion(p, prevP, W) {
  const opts = [...new Set([1, p, prevP || W, prevP * 2].filter(v => v >= 1))].sort((a, b) => a - b);
  return {
    t: prevP ? 'What is p now?' : 'What is the starting p?',
    o: opts.map(v => 'p = ' + v), a: [opts.indexOf(p)],
    why: prevP ? `p is halved every round: ${prevP} → ${p}.` : `p starts at w/2 = ${p}.`,
  };
}

function crossSearch(ctx, trace) {
  const { B, W } = ctx, mn = metricName();
  const ev = Metrics.createEvaluator(ctx), steps = [];
  const threshold = [4 * B * B, 4, 16][ctx.metric];
  let iters = 1;
  const record = makeRecorder(ev, steps, () => iters);

  // Step 1: stationary-block test
  const s0 = ev(0, 0), stationary = s0 < threshold;
  trace && record({
    title: 'Step 1: stationary-block test', txt: 'Ghanbari first checks whether the block barely changed.',
    cands: [{ x: 0, y: 0, s: s0 }], center: { x: 0, y: 0 }, best: { x: 0, y: 0, s: s0 },
    q: { t: `Is ${fmt(s0)} below ${fmt(threshold)}?`, o: ['Yes, block did not move', 'No, start searching'],
         a: [stationary ? 0 : 1],
         why: stationary ? `${fmt(s0)} < ${fmt(threshold)}: non-moving block, search ends.`
                         : `${fmt(s0)} ≥ ${fmt(threshold)}: the block moved, so continue.` },
  });
  let m = { x: 0, y: 0, s: s0 };
  if (stationary) return makeResult(m, ev, 1, steps);

  // Steps 2–5: X-shaped search, halving p each round
  let p = Math.max(1, W >> 1), prevP = 0, i, j;
  for (;;) {
    iters++; i = m.x; j = m.y;
    trace && record({
      title: 'Choose the step size p',
      txt: prevP ? `The last step size was ${prevP}.` : `The maximum displacement is w = ${W}.`,
      cands: [], center: { x: i, y: j }, best: { ...m }, q: stepSizeQuestion(p, prevP, W),
    });
    const corners = score(ev, [[0, 0, 'Centre'], [-p, -p, 'Top-left'], [-p, p, 'Bottom-left'],
      [p, -p, 'Top-right'], [p, p, 'Bottom-right']].map(([a, b, n]) => ({ x: i + a, y: j + b, n })));
    const b = lowest(corners);
    m = pt(b);
    trace && record({
      title: `X-cross, step size p = ${p}`, txt: `Test the centre and the 4 diagonal corners at distance ${p}.`,
      cands: corners, center: { x: i, y: j }, best: { ...m },
      q: { t: 'Which corner has the lowest SAD?', o: corners.map(q => q.n),
           a: corners.map((q, n) => q.s === b.s ? n : -1).filter(n => n >= 0),
           why: `Minimum ${mn} ${fmt(b.s)} at (${b.x},${b.y}).` +
                (p > 1 ? ` Step size halves to ${p >> 1}.` : ' p = 1, so go to the final stage.') },
    });
    if (p === 1) break;
    prevP = p; p >>= 1;
  }

  // Steps 6–8: final Greek (+) or St Andrew's (X) cross
  iters++;
  const greek = (m.x === i && m.y === j) || (m.x === i - 1 && m.y === j - 1) || (m.x === i + 1 && m.y === j + 1);
  const offsets = greek ? [[-1, 0], [0, -1], [1, 0], [0, 1]] : [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  const c0 = { ...m };
  const finalPts = [c0, ...score(ev, offsets.map(([a, b]) => ({ x: c0.x + a, y: c0.y + b })))];
  const winner = lowest(finalPts);
  trace && record({
    title: 'Final stage: ' + (greek ? 'Greek cross (+)' : 'St Andrew’s cross (X)'),
    txt: `Search the end points of the chosen cross around (${c0.x},${c0.y}).`,
    cands: finalPts, center: { x: c0.x, y: c0.y }, best: pt(winner),
    q: { t: 'Which cross comes next?', o: ['Plus (+)', 'Cross (X)'], a: [greek ? 0 : 1],
         why: greek ? 'The minimum was the centre or on the (i−1,j−1)/(i+1,j+1) diagonal → Greek cross (+).'
                    : 'The minimum was on the other diagonal → St Andrew’s cross (X).' },
  });
  return makeResult(winner, ev, iters, steps);
}

registerAlgorithm('csa', 'Ghanbari Cross Search', crossSearch);
