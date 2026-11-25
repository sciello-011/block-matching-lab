'use strict';
/* Panels — text UI: info table, log, quiz box and control enable/disable states. */

const Panels = (() => {
  const candList = cands => cands.map(q => `(${q.x},${q.y})=${fmt(q.s)}`).join(' ');

  function renderInfoPanel() {
    const step = S.steps[S.idx], best = Sel.bestAt(S.idx);
    const row = (a, b) => `<tr><td>${a}</td><td>${b}</td></tr>`;
    $('pn').innerHTML = row('Algorithm', algoName(S.alg)) + (step
      ? row('Step / iteration', `${S.idx + 1}/${S.steps.length} · iter ${step.it}`)
        + row('Search centre', `(${step.center.x}, ${step.center.y})`)
        + row('Candidates this step', candList(step.cands) || 'none')
        + row('Positions requested', step.reqs)
        + row(metricName() + ' computations', step.comps)
        + row('Lowest ' + metricName() + ' so far', best ? fmt(best.s) : '–')
        + row('Best match (frame coords)', best ? `(${S.bx + best.x}, ${S.by + best.y})` : '–')
        + row('Motion vector', best ? `(${best.x}, ${best.y})` : '–')
      : row('Status', 'Press Start') + row('Reference block', `(${S.bx}, ${S.by}) size ${S.B}×${S.B}`)
        + row('Search range', '± ' + S.W));
  }

  function renderLog() {
    let html = '';
    for (let k = 0; k <= S.idx; k++) {
      const t = S.steps[k];
      html += `<div><b>#${k + 1}</b> ${t.title}: ${candList(t.cands)} ` +
        (Sel.bestAt(k) === t.best ? `→ best <b>${fmt(t.best.s)}</b> @(${t.best.x},${t.best.y})` : '→ waiting for your answer') + '</div>';
    }
    const log = $('log');
    log.innerHTML = html || '<span class="muted">No comparisons yet.</span>';
    log.scrollTop = log.scrollHeight;
    $('pg').value = S.steps.length ? (S.idx + 1) / S.steps.length * 100 : 0;
  }

  function renderQuestionBox() {
    const step = S.steps[S.idx], box = $('qb');
    if (!step) {
      box.innerHTML = '<p class="muted">Pick a video, click a block in the current frame, choose an algorithm, then press Start.</p>';
      return;
    }
    let html = `<h4>${step.title}</h4><p>${step.txt}</p>`;
    const pick = S.picks[S.idx], answered = pick !== undefined;
    if (S.mode === 'guided' && step.q) {
      html += `<p><b>${step.q.t}</b></p><div class="opts">` + step.q.o.map((label, n) => {
        const cls = answered ? (step.q.a.includes(n) ? 'ok' : n === pick ? 'no' : '') : '';
        return `<button data-n="${n}" class="${cls}" ${answered ? 'disabled' : ''}>${label}</button>`;
      }).join('') + '</div>';
      if (answered) html += `<p>${step.q.a.includes(pick) ? '✅ Correct. ' : '❌ Not quite. '}${step.q.why}</p>`;
    } else if (step.q) {
      html += `<p class="muted">${step.q.why}</p>`;
    }
    if (S.idx === S.steps.length - 1 && Sel.revealed()) {
      const r = runAlgorithm(S.alg, false);
      html += `<p><b>Finished.</b> Best block at (${S.bx + r.best.x}, ${S.by + r.best.y}), ${metricName()} ${fmt(r.best.s)}, motion vector (${r.best.x}, ${r.best.y}), ${r.comps} ${metricName()} computations. See the comparison below.</p>`;
    }
    box.innerHTML = html;
  }

  function updateControls() {
    const last = S.idx >= S.steps.length - 1, step = S.steps[S.idx];
    const mustAnswer = S.mode === 'guided' && step && step.q && S.picks[S.idx] === undefined;
    $('nx').disabled = last || mustAnswer;
    $('pv').disabled = S.idx <= 0;
    $('pa').textContent = S.timer ? 'Pause' : 'Resume';
    $('pa').disabled = S.mode !== 'auto' || S.idx < 0 || last;
    $('st').disabled = S.idx >= 0;
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.a === S.alg));
    $('fl').textContent = `frame ${S.frame}/${CONFIG.frameCount - 1}`;
  }

  /** Redraw everything that depends on state. */
  function render() {
    Renderer.drawAll();
    renderInfoPanel(); renderLog(); renderQuestionBox(); updateControls();
  }

  return { render };
})();
