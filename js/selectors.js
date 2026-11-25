'use strict';
/* Selectors — values derived from state. */

const Sel = {
  /** Has the learner answered (or is the quiz off) for the current step? */
  revealed() {
    const t = S.steps[S.idx];
    return !t || S.mode === 'auto' || !t.q || S.picks[S.idx] !== undefined;
  },
  /** Best point as of step k; hides the current step's answer until revealed. */
  bestAt(k) {
    if (k < 0) return null;
    if (k === S.idx && !Sel.revealed()) return k > 0 ? S.steps[k - 1].best : null;
    return S.steps[k].best;
  },
  /** Map "x,y" → candidate for every point evaluated up to the current step. */
  evaluated() {
    const m = new Map();
    for (let k = 0; k <= S.idx; k++) S.steps[k].cands.forEach(q => m.set(q.x + ',' + q.y, q));
    return m;
  },
};
