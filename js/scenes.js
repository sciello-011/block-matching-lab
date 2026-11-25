'use strict';
/* Scenes — procedural pixel-art frames.
   To add a scene: push [name, draw(grid, t)] onto `list` (t runs 0→1). */

const Scenes = (() => {
  const N = CONFIG.size;
  const clamp = v => Math.max(0, Math.min(255, v));

  const fillRect = (g, x, y, w, h, v) => {
    for (let j = Math.round(y); j < Math.round(y + h); j++)
      for (let i = Math.round(x); i < Math.round(x + w); i++)
        if (i >= 0 && j >= 0 && i < N && j < N) g[j * N + i] = clamp(v);
  };
  const fillDisc = (g, cx, cy, r, v) => {
    for (let j = -r; j <= r; j++)
      for (let i = -r; i <= r; i++) {
        const x = Math.round(cx + i), y = Math.round(cy + j);
        if (i * i + j * j <= r * r && x >= 0 && y >= 0 && x < N && y < N) g[y * N + x] = v;
      }
  };
  const drawMan = (g, x, y, phase, v, swing = 2) => {
    const o = Math.round(swing * Math.sin(phase));
    fillDisc(g, x + 4, y + 3, 3, v);                 // head
    fillRect(g, x + 2, y + 6, 5, 8, v - 50);         // torso
    fillRect(g, x + 2 + o, y + 14, 2, 7, v - 90);    // legs
    fillRect(g, x + 5 - o, y + 14, 2, 7, v - 90);
    fillRect(g, x + 1 - o, y + 7, 1, 6, v - 20);     // arms
    fillRect(g, x + 7 + o, y + 7, 1, 6, v - 20);
  };

  const list = [
    ['Walking character', (g, t) => drawMan(g, 4 + t * 44, 30, t * 50, 235)],
    ['Running character', (g, t) => drawMan(g, 2 + t * 52, 30, t * 100, 250, 4)],
    ['Jumping character', (g, t) => drawMan(g, 10 + t * 32, 32 - 26 * Math.sin(t * Math.PI), t * 30, 240)],
    ['Bouncing ball', (g, t) => {
      const x = 8 + t * 46, y = 44 - Math.abs(Math.sin(t * Math.PI * 3)) * 34;
      fillDisc(g, x, y, 5, 250); fillDisc(g, x - 1, y - 1, 2, 120);
    }],
    ['Moving car', (g, t) => {
      const x = -14 + t * 80;
      fillRect(g, x, 40, 22, 6, 230); fillRect(g, x + 5, 35, 11, 5, 200);
      fillRect(g, x + 7, 36, 3, 3, 90); fillRect(g, x + 12, 36, 3, 3, 90);
      fillDisc(g, x + 5, 47, 3, 30); fillDisc(g, x + 17, 47, 3, 30);
    }],
    ['Flying bird', (g, t) => {
      const x = 4 + t * 50, y = 16 + 6 * Math.sin(t * Math.PI * 4), up = Math.sin(t * Math.PI * 24) > 0;
      fillRect(g, x, y, 9, 4, 240); fillRect(g, x + 9, y + 1, 3, 2, 200);
      fillRect(g, x + 2, up ? y - 4 : y + 4, 5, 4, 250);
    }],
    ['Moving platform', (g, t) => {
      const x = 8 + 11 * (1 - Math.cos(t * Math.PI * 2));
      fillRect(g, x, 40, 22, 5, 220); fillRect(g, x + 8, 32, 8, 8, 160); fillRect(g, x + 10, 34, 4, 4, 230);
    }],
    ['Diagonal object', (g, t) => {
      const x = 4 + t * 46;
      fillRect(g, x, x, 9, 9, 235); fillRect(g, x + 2, x + 2, 5, 5, 100);
    }],
    ['Rotating object', (g, t) => {
      const a = t * Math.PI * 2;
      for (let r = 0; r <= 20; r += 2) fillDisc(g, 32 + r * Math.cos(a), 32 + r * Math.sin(a), 2, r % 4 ? 230 : 130);
      fillDisc(g, 32, 32, 3, 250);
    }],
    ['Multiple objects', (g, t) => {
      fillDisc(g, 6 + t * 46, 14, 4, 250);
      fillRect(g, 48, 4 + t * 40, 7, 7, 220);
      fillRect(g, 50 - t * 44, 50, 8, 8, 200); fillRect(g, 52 - t * 44, 52, 4, 4, 90);
    }],
  ];

  /** Textured background with a striped "ground" strip. */
  function fillBackground(g) {
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++)
        g[y * N + x] = y >= 52
          ? 110 + ((x >> 1) % 2) * 20
          : 70 + ((x * 5 + y * 11 + (((x >> 3) + (y >> 3)) & 1) * 37 + ((x * y) % 23)) % 40);
  }

  function renderFrames(sceneIndex) {
    const frames = [];
    for (let k = 0; k < CONFIG.frameCount; k++) {
      const g = new Uint8Array(N * N);
      fillBackground(g);
      list[sceneIndex][1](g, k / CONFIG.frameCount);
      frames.push(g);
    }
    return frames;
  }

  return { list, renderFrames };
})();
