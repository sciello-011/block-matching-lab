'use strict';
/* Benchmark — timing comparison, independent of the teaching simulation.
   Rows are generated from the algorithm registry; 'full' is the optimum baseline. */

const Benchmark = (() => {
  function measure(algo, ctx) {
    const { runs, warmup } = CONFIG.bench;
    for (let n = 0; n < warmup; n++) algo.run(ctx, false);
    let r; const t0 = performance.now();
    for (let n = 0; n < runs; n++) r = algo.run(ctx, false);
    return { ...r, ms: (performance.now() - t0) / runs };
  }

  function run() {
    const ctx = blockCtx(), mn = metricName(), reg = Algorithms.registry, out = {};
    for (const id in reg) out[id] = measure(reg[id], ctx);

    const fullComps = out.full.comps, optimum = out.full.best.s;
    const maxTime = Math.max(...Object.values(out).map(r => r.ms));
    const heads = ['Algorithm', mn + ' computations', 'Positions requested', 'Iterations', 'Avg time (ms)',
      'Best block', 'Min ' + mn, 'Motion vector', 'Reduction vs Full', mn + ' vs optimum'];

    let html = '<table><tr>' + heads.map(h => `<th>${h}</th>`).join('') + '</tr>';
    for (const id in out) {
      const r = out[id];
      html += `<tr><td>${reg[id].name}</td><td>${r.comps}</td><td>${r.reqs}</td><td>${r.iters}</td>` +
        `<td>${r.ms.toFixed(4)}</td><td>(${S.bx + r.best.x}, ${S.by + r.best.y})</td><td>${fmt(r.best.s)}</td>` +
        `<td>(${r.best.x}, ${r.best.y})</td><td>${((1 - r.comps / fullComps) * 100).toFixed(1)}%</td>` +
        `<td>${r.best.s === optimum ? 'optimal' : '+' + fmt(r.best.s - optimum)}</td></tr>`;
    }

    const bars = (title, value, max, cls, label) =>
      `<div style="flex:1;min-width:240px"><b>${title}</b>` + Object.keys(out).map(id =>
        `<div style="font-size:12px">${reg[id].name}: ${label(out[id])}</div>` +
        `<div class="bar ${cls}" style="width:${value(out[id]) / max * 100}%"></div>`).join('') + '</div>';

    html += '</table><div class="row" style="align-items:flex-start">' +
      bars(mn + ' computations', r => r.comps, fullComps, '', r => r.comps) +
      bars('Average time (ms)', r => r.ms, maxTime, 't', r => r.ms.toFixed(4)) + '</div>' +
      `<p class="muted">Frame ${S.frame}, block (${S.bx},${S.by}) ${S.B}×${S.B}, range ±${S.W}. “computations” counts unique positions; “positions requested” also counts repeat visits (e.g. a centre re-tested).</p>`;
    $('cmp').innerHTML = html;
  }

  return { run };
})();
