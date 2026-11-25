'use strict';
/* Controller — timers, user actions and event wiring. The only module that mutates state. */

const Controller = (() => {
  const N = CONFIG.size;

  /* ----- timers ----- */
  const stopTimer = () => { clearInterval(S.timer); S.timer = null; };

  function startTimer() {
    stopTimer();
    const delay = (1100 - 100 * $('sp').value) / (S.alg === 'full' ? 5 : 1);
    S.timer = setInterval(() => {
      if (S.idx >= S.steps.length - 1) { stopTimer(); Panels.render(); return; }
      S.idx++; Panels.render();
    }, delay);
    Panels.render();
  }

  const scheduleBenchmark = () => {
    clearTimeout(S.benchTimer);
    S.benchTimer = setTimeout(Benchmark.run, CONFIG.bench.debounceMs);
  };

  /* ----- actions ----- */
  function resetDemo() {
    stopTimer();
    S.steps = runAlgorithm(S.alg, true).steps;
    S.idx = -1; S.picks = [];
    Panels.render();
  }

  function setFrame(k) {
    S.frame = Math.max(1, Math.min(CONFIG.frameCount - 1, k));
    S.cur = S.frames[S.frame]; S.prev = S.frames[S.frame - 1];
    $('fr').value = S.frame;
    resetDemo(); scheduleBenchmark();
  }

  /** Choose the grid block with the largest zero-shift error, i.e. the most motion. */
  function autoPickBlock() {
    let worst = -1, pick = { bx: S.bx, by: S.by };
    for (let y = 0; y <= N - S.B; y += S.B)
      for (let x = 0; x <= N - S.B; x += S.B) {
        const e = Metrics.error(blockCtx({ bx: x, by: y }), 0, 0);
        if (e > worst) { worst = e; pick = { bx: x, by: y }; }
      }
    S.bx = pick.bx; S.by = pick.by;
  }

  function loadScene() {
    S.frames = Scenes.renderFrames(S.scene);
    S.cur = S.frames[S.frame]; S.prev = S.frames[S.frame - 1];
    autoPickBlock();
    setFrame(S.frame);
  }

  function clickBlock(e) {
    const r = e.target.getBoundingClientRect();
    S.bx = Math.min(N - S.B, Math.floor((e.clientX - r.left) / r.width * N / S.B) * S.B);
    S.by = Math.min(N - S.B, Math.floor((e.clientY - r.top) / r.height * N / S.B) * S.B);
    resetDemo(); scheduleBenchmark();
  }

  function applyParams() {
    S.metric = +$('ms').value; S.B = +$('bs').value; S.W = +$('ws').value;
    S.bx = Math.min(N - S.B, Math.floor(S.bx / S.B) * S.B);
    S.by = Math.min(N - S.B, Math.floor(S.by / S.B) * S.B);
    resetDemo(); Benchmark.run();
  }

  function togglePlayback() {
    if (S.playTimer) { clearInterval(S.playTimer); S.playTimer = null; $('play').textContent = 'Play'; return; }
    $('play').textContent = 'Pause video';
    S.playTimer = setInterval(() => setFrame(S.frame >= CONFIG.frameCount - 1 ? 1 : S.frame + 1), CONFIG.playIntervalMs);
  }

  function showTooltip(e) {
    const g = $('gc'), r = g.getBoundingClientRect(), n = 2 * S.W + 1, tip = $('tip');
    const x = Math.floor((e.clientX - r.left) / r.width * n) - S.W;
    const y = Math.floor((e.clientY - r.top) / r.height * n) - S.W;
    if (x < -S.W || y < -S.W || x > S.W || y > S.W) { tip.style.display = 'none'; return; }
    const q = Sel.evaluated().get(x + ',' + y);
    tip.textContent = `shift (${x},${y}): ` +
      (!Metrics.inWindow(blockCtx(), x, y) ? 'outside frame' : q ? metricName() + ' = ' + fmt(q.s) : 'not evaluated yet');
    tip.style.display = 'block';
    tip.style.left = e.clientX + 14 + 'px'; tip.style.top = e.clientY + 14 + 'px';
  }

  /* ----- DOM setup + wiring ----- */
  function buildSelectors() {
    Scenes.list.forEach((s, i) => $('sc').add(new Option(s[0], i)));
    const tabs = $('tabs');
    for (const id in Algorithms.registry) {
      const b = document.createElement('button');
      b.dataset.a = id; b.textContent = Algorithms.registry[id].name;
      b.onclick = () => { S.alg = id; resetDemo(); };
      tabs.appendChild(b);
    }
  }

  function bindEvents() {
    $('mvt').onchange = e => { S.showMV = e.target.checked; Renderer.drawAll(); };
    $('gc').onmousemove = showTooltip;
    $('gc').onmouseleave = () => $('tip').style.display = 'none';
    $('cc').onclick = clickBlock; $('pc').onclick = clickBlock;
    $('qb').onclick = e => {
      const b = e.target.closest('button[data-n]');
      if (!b || S.picks[S.idx] !== undefined) return;
      S.picks[S.idx] = +b.dataset.n; Panels.render();
    };
    $('st').onclick = () => { S.idx = 0; S.mode === 'auto' ? startTimer() : Panels.render(); };
    $('pa').onclick = () => { S.timer ? stopTimer() : startTimer(); Panels.render(); };
    $('nx').onclick = () => { if (S.idx < S.steps.length - 1) { S.idx++; Panels.render(); } };
    $('pv').onclick = () => { stopTimer(); if (S.idx > 0) { S.idx--; Panels.render(); } };
    $('rs').onclick = resetDemo;
    $('md').onchange = e => { S.mode = e.target.value; stopTimer(); Panels.render(); };
    $('sp').oninput = () => { if (S.timer) startTimer(); };
    $('play').onclick = togglePlayback;
    $('fp').onclick = () => setFrame(S.frame - 1);
    $('fn').onclick = () => setFrame(S.frame + 1);
    $('fr').oninput = e => setFrame(+e.target.value);
    $('sc').onchange = e => { S.scene = +e.target.value; loadScene(); };
    $('ab').onclick = () => { autoPickBlock(); resetDemo(); Benchmark.run(); };
    ['ms', 'bs', 'ws'].forEach(id => $(id).onchange = applyParams);
  }

  return { buildSelectors, bindEvents, loadScene };
})();
