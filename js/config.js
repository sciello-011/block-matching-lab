'use strict';
/* Config — constants, colours and name tables. No logic. */

const $ = id => document.getElementById(id);

const CONFIG = {
  size: 64,              // frames are size × size pixels
  scale: 4,              // canvas pixels per frame pixel
  frameCount: 24,        // frames per scene (~4 s at 6 fps)
  playIntervalMs: 167,
  gridCanvasPx: 440,
  bench: { runs: 300, warmup: 20, debounceMs: 250 },
};

const COLORS = { ref: '#ff4d6d', cand: '#ffd23f', best: '#3ddc84', cur: '#4cc9f0' };
const METRIC_NAMES = ['SAD', 'MAD', 'MSD'];
