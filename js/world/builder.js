// 커스텀 까비 빌더 — 파츠를 넘기며 나만의 까비를 만든다 (DOM 오버레이)

import { TRAIT_CATEGORIES, DEFAULT_TRAITS, getOption, randomTraits, drawCustomChar } from "./traits.js";

export function initBuilder({ root, onDone, onCancel, initial }) {
  let traits = { ...DEFAULT_TRAITS, ...(initial ?? {}) };
  let raf = 0, tick = 0;

  root.innerHTML = `
    <h1>커스텀 까비</h1>
    <p class="sub">파츠를 골라 나만의 까비를 만들어 보세요 — NFT 트레이트와 같은 구조예요!</p>
    <div id="builderBody">
      <canvas id="builderPreview" width="120" height="130"></canvas>
      <div id="builderRows"></div>
    </div>
    <div id="builderBtns">
      <button id="btnRandom" type="button">🎲 랜덤</button>
      <button id="btnDone" type="button">✅ 이 모습으로 입장</button>
      <button id="btnBack" type="button">← 뒤로</button>
    </div>
  `;

  const rowsEl = root.querySelector("#builderRows");
  const labels = {};

  function shift(catKey, dir) {
    const cat = TRAIT_CATEGORIES.find((c) => c.key === catKey);
    const idx = cat.options.findIndex((o) => o.id === traits[catKey]);
    traits[catKey] = cat.options[(idx + dir + cat.options.length) % cat.options.length].id;
    refreshLabels();
  }

  function refreshLabels() {
    for (const c of TRAIT_CATEGORIES) {
      const o = getOption(c.key, traits[c.key]);
      labels[c.key].textContent = `${o.ko} (${o.name})`;
    }
  }

  for (const c of TRAIT_CATEGORIES) {
    const row = document.createElement("div");
    row.className = "builder-row";
    const prev = document.createElement("button"); prev.type = "button"; prev.textContent = "◀";
    const next = document.createElement("button"); next.type = "button"; next.textContent = "▶";
    const catName = document.createElement("span"); catName.className = "cat"; catName.textContent = c.label;
    const value = document.createElement("span"); value.className = "val";
    prev.addEventListener("click", () => shift(c.key, -1));
    next.addEventListener("click", () => shift(c.key, 1));
    row.append(catName, prev, value, next);
    rowsEl.append(row);
    labels[c.key] = value;
  }
  refreshLabels();

  root.querySelector("#btnRandom").addEventListener("click", () => { traits = randomTraits(); refreshLabels(); });
  root.querySelector("#btnDone").addEventListener("click", () => { stop(); onDone({ ...traits }); });
  root.querySelector("#btnBack").addEventListener("click", () => { stop(); onCancel(); });

  // 미리보기 — 월드와 같은 그리기 코드를 그대로 사용 (한 벌만 유지)
  const pcv = root.querySelector("#builderPreview");
  const pctx = pcv.getContext("2d");
  pctx.imageSmoothingEnabled = false;
  function loop() {
    tick++;
    pctx.clearRect(0, 0, pcv.width, pcv.height);
    pctx.save();
    pctx.translate(pcv.width / 2, pcv.height - 14);
    pctx.scale(2.2, 2.2);
    drawCustomChar(pctx, traits, tick);
    pctx.restore();
    raf = requestAnimationFrame(loop);
  }
  loop();

  function stop() { cancelAnimationFrame(raf); }
}
