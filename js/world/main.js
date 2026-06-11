// 까비 월드 — 메인 루프·플레이어·렌더
// 물리 값과 충돌 방식은 kkabbi-adventure.html에서 그대로 이식 (손맛 유지)

import {
  W, H, GROUND_Y, GRAV, MAX_FALL, JUMPS_MAX, WORLD_SPEED_MULT,
  CHARACTERS, CHAR_KEYS, CUSTOM_STATS, PLAYER_W, PLAYER_H, CHAR_DRAW_W,
  PORTAL_W, PORTAL_H, INTERACT_RANGE, FADE_FRAMES, BANNER_FRAMES, BUBBLE_FRAMES,
  PARALLAX_FAR, PARALLAX_NEAR, PARALLAX_CLOUD, AMBIENT_COUNT,
} from "./config.js";
import { MAPS, FIRST_MAP } from "./maps.js";
import { loadSave, updateSave } from "./save.js";
import { DEFAULT_TRAITS, drawCustomChar, toNftAttributes } from "./traits.js";
import { initBuilder } from "./builder.js";
import { initChat } from "./chat.js";

const charStats = (cls) => (cls === "custom" ? CUSTOM_STATS : CHARACTERS[cls]);

const cv = document.getElementById("game");
const ctx = cv.getContext("2d");
const overlay = document.getElementById("overlay");
const DEBUG = new URLSearchParams(location.search).has("debug");

// ── 캐릭터 이미지 ──────────────────────────────────────────
const charImg = {}, charReady = {};
for (const k of CHAR_KEYS) {
  const img = new Image();
  img.onload = () => { charReady[k] = true; };
  img.src = CHARACTERS[k].img;
  charImg[k] = img;
}

// ── 입력 ──────────────────────────────────────────────────
const keys = {};
let justJump = false, justUp = false;
addEventListener("keydown", (e) => {
  if (e.target instanceof HTMLInputElement) return; // 채팅 입력 중에는 게임 키 무시
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
  if (!keys[e.code]) {
    if (e.code === "Space" || e.code === "KeyZ") justJump = true;
    if (e.code === "ArrowUp") justUp = true;
    if (e.code === "KeyP" && state === "world") takePhoto();
    if (e.code === "Enter" && state === "world") chatApi?.focusInput();
  }
  keys[e.code] = true;
});

// ── 인증샷 부스 — 현재 화면 + 프레임 + 트레이트 목록을 PNG로 다운로드 ──
function takePhoto() {
  const shot = document.createElement("canvas");
  shot.width = W; shot.height = H;
  const g = shot.getContext("2d");
  g.drawImage(cv, 0, 0); // 플래시가 그려지기 전의 현재 프레임

  // 프레임
  g.strokeStyle = "#ff9a56"; g.lineWidth = 10; g.strokeRect(5, 5, W - 10, H - 10);
  g.fillStyle = "rgba(10,8,24,.78)"; g.fillRect(10, H - 64, W - 20, 54);
  const d = new Date(); // 로컬 날짜 (toISOString은 UTC라 하루 어긋날 수 있음)
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  g.fillStyle = "#ffe8c0"; g.font = "bold 16px 'Courier New'"; g.textAlign = "left";
  g.fillText(`KKABBI WORLD · ${map.name} · ${date}`, 24, H - 42);
  g.font = "10px 'Courier New'"; g.fillStyle = "#bfae90";
  if (player.cls === "custom") {
    const attrs = toNftAttributes(save.custom ?? DEFAULT_TRAITS)
      .filter((a) => !["None", "Bare", "Basic", "Barefoot"].includes(a.value))
      .map((a) => `${a.trait_type}: ${a.value}`).join(" · ");
    g.fillText(attrs || "Original Kkabbi", 24, H - 24);
  } else {
    g.fillText(`Preset: ${CHARACTERS[player.cls].name} · opensea.io/SpaceKkabbi`, 24, H - 24);
  }

  const a = document.createElement("a");
  a.download = `kkabbi-world-${date}-${Date.now() % 100000}.png`;
  a.href = shot.toDataURL("image/png");
  a.click();

  flashT = 10; toastT = 120; toastMsg = "📸 인증샷이 저장됐어요!";
}
addEventListener("keyup", (e) => { keys[e.code] = false; });

// ── 상태 ──────────────────────────────────────────────────
let state = "select"; // select | builder | world
let flashT = 0, toastT = 0, toastMsg = "";
let chatApi = null;
let myBubble = null; // { text, t } — 내가 보낸 채팅을 머리 위 말풍선으로
let save = loadSave();
let mapId = null, map = null;
let player = null;
let cam = { x: 0 };
let fade = 0, fadeDir = 0, pendingWarp = null; // 맵 전환 페이드
let bannerT = 0;
let bubble = null; // { npc, lineIdx, t }
let ambient = [];
let cloudOffsets = [];
let tick = 0;

// ── 캐릭터 선택 (HTML 오버레이) ────────────────────────────
const SELECT_COUNT = CHAR_KEYS.length + 1; // 프리셋 4종 + 커스텀 까비
let selIdx = save.lastChar === "custom" ? CHAR_KEYS.length : Math.max(0, CHAR_KEYS.indexOf(save.lastChar ?? ""));
function renderSelect() {
  document.querySelectorAll(".char-card").forEach((el, i) => el.classList.toggle("selected", i === selIdx));
}
document.querySelectorAll(".char-card").forEach((el, i) => {
  el.addEventListener("click", () => { selIdx = i; renderSelect(); });
});
addEventListener("keydown", (e) => {
  if (state !== "select") return;
  if (e.code === "ArrowLeft") { selIdx = (selIdx + SELECT_COUNT - 1) % SELECT_COUNT; renderSelect(); }
  if (e.code === "ArrowRight") { selIdx = (selIdx + 1) % SELECT_COUNT; renderSelect(); }
  if (e.code === "Enter" || e.code === "Space") confirmSelect();
});
document.getElementById("startBtn").addEventListener("click", confirmSelect);
renderSelect();

function confirmSelect() {
  if (state !== "select") return;
  if (selIdx === CHAR_KEYS.length) openBuilder();
  else startWorld(CHAR_KEYS[selIdx]);
}

function startWorld(charKey) {
  save = updateSave({ lastChar: charKey });
  enterMap(save.lastMap && MAPS[save.lastMap] ? save.lastMap : FIRST_MAP, null, charKey);
  overlay.classList.add("hidden");
  state = "world";

  // 채팅 시작 (한 번만) — 접속자끼리만, 저장 없음
  if (!chatApi) {
    if (!save.nick) save = updateSave({ nick: `까비${1000 + Math.floor(Math.random() * 9000)}` });
    document.getElementById("chat").classList.remove("hidden");
    chatApi = { focusInput: () => {} }; // 연결 전 임시
    initChat({
      getNick: () => save.nick,
      setNick: (n) => { save = updateSave({ nick: n }); },
      getMapName: () => map?.name ?? "",
      onSelfMessage: (text) => { myBubble = { text, t: BUBBLE_FRAMES }; },
    }).then((api) => { chatApi = api; });
  }
}

// ── 커스텀 까비 빌더 ──────────────────────────────────────
const builderEl = document.getElementById("builder");
function openBuilder() {
  state = "builder";
  overlay.classList.add("hidden");
  builderEl.classList.remove("hidden");
  initBuilder({
    root: builderEl,
    initial: save.custom,
    onDone: (traits) => {
      save = updateSave({ custom: traits });
      builderEl.classList.add("hidden");
      startWorld("custom");
    },
    onCancel: () => {
      builderEl.classList.add("hidden");
      overlay.classList.remove("hidden");
      state = "select";
    },
  });
}

// ── 맵 진입 ───────────────────────────────────────────────
function enterMap(id, spawnX, charKey) {
  mapId = id;
  map = MAPS[id];
  const key = charKey ?? player.cls;
  const x = spawnX ?? map.spawnX;
  player = {
    cls: key, x, y: GROUND_Y - PLAYER_H, w: PLAYER_W, h: PLAYER_H,
    vx: 0, vy: 0, onGround: false, face: 1, jumps: JUMPS_MAX, walkT: 0,
  };
  cam.x = clampCam(x);
  bannerT = BANNER_FRAMES;
  bubble = null;
  initAmbient();
  save = updateSave({ lastMap: id });
}

function clampCam(px) {
  return Math.max(0, Math.min(map.w - W, px - W / 2));
}

// ── 물리 (어드벤처와 동일) ─────────────────────────────────
function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function moveX(e) {
  e.x += e.vx;
  for (const p of map.platforms) {
    if (overlap(e, p)) { if (e.vx > 0) e.x = p.x - e.w; else if (e.vx < 0) e.x = p.x + p.w; }
  }
  if (e.x < 0) e.x = 0;
  if (e.x + e.w > map.w) e.x = map.w - e.w;
}
function moveY(e) {
  e.vy += GRAV; if (e.vy > MAX_FALL) e.vy = MAX_FALL;
  e.y += e.vy; e.onGround = false;
  for (const p of map.platforms) {
    if (overlap(e, p)) {
      if (e.vy > 0) { e.y = p.y - e.h; e.vy = 0; e.onGround = true; }
      else if (e.vy < 0) { e.y = p.y + p.h; e.vy = 0; }
    }
  }
}

// ── 업데이트 ──────────────────────────────────────────────
function nearPortal() {
  const cx = player.x + player.w / 2;
  return map.portals.find((pt) => Math.abs(cx - pt.x) < PORTAL_W / 2 + 8) ?? null;
}
function nearNpc() {
  const cx = player.x + player.w / 2;
  return map.npcs.find((n) => Math.abs(cx - n.x) < INTERACT_RANGE && player.y + player.h > GROUND_Y - 60) ?? null;
}

function update() {
  tick++;
  if (state !== "world") return;

  // 맵 전환 페이드 중에는 입력 정지
  if (fadeDir !== 0) {
    fade += fadeDir;
    if (fadeDir > 0 && fade >= FADE_FRAMES) {
      enterMap(pendingWarp.to, pendingWarp.toX, null);
      fadeDir = -1;
    } else if (fadeDir < 0 && fade <= 0) { fade = 0; fadeDir = 0; pendingWarp = null; }
    return;
  }

  const c = charStats(player.cls);
  const dir = (keys["ArrowLeft"] || keys["KeyA"] ? -1 : 0) + (keys["ArrowRight"] || keys["KeyD"] ? 1 : 0);
  if (dir !== 0) player.face = dir;
  player.vx = dir * c.moveSpd * WORLD_SPEED_MULT;

  // ↑키: 포탈/NPC가 가까우면 상호작용, 아니면 점프 (메이플의 ↑포탈 + 어드벤처의 ↑점프 절충)
  if (justUp) {
    const pt = nearPortal();
    const npc = nearNpc();
    if (pt) { pendingWarp = pt; fadeDir = 1; fade = 0; justUp = false; justJump = false; }
    else if (npc) {
      const next = bubble && bubble.npc === npc ? (bubble.lineIdx + 1) % npc.lines.length : 0;
      bubble = { npc, lineIdx: next, t: BUBBLE_FRAMES };
      justUp = false; justJump = false;
    } else justJump = true;
    justUp = false;
  }

  if (player.onGround) player.jumps = JUMPS_MAX;
  if (justJump && player.jumps > 0) { player.vy = c.jumpV; player.jumps--; }
  justJump = false;

  moveX(player);
  moveY(player);
  if ((player.vx !== 0 && player.onGround)) player.walkT++; else player.walkT = 0;

  // 떨어질 곳이 없는 평화 월드지만, 혹시 모를 탈출 대비
  if (player.y > H + 60) { player.x = map.spawnX; player.y = GROUND_Y - PLAYER_H; player.vy = 0; }

  cam.x += (clampCam(player.x + player.w / 2) - cam.x) * 0.12; // 부드러운 카메라 추적

  if (bannerT > 0) bannerT--;
  if (bubble && --bubble.t <= 0) bubble = null;
  if (myBubble && --myBubble.t <= 0) myBubble = null;
  updateAmbient();
}

// ── 분위기 파티클 ─────────────────────────────────────────
function initAmbient() {
  ambient = [];
  for (let i = 0; i < AMBIENT_COUNT; i++) ambient.push(spawnAmbient(true));
  cloudOffsets = [0.15, 0.45, 0.75].map((f) => ({ f, y: 40 + Math.random() * 60, s: 0.8 + Math.random() * 0.6 }));
}
function spawnAmbient(anywhere) {
  const x = cam.x + Math.random() * W;
  const y = anywhere ? Math.random() * H : -10;
  return { x, y, ph: Math.random() * 6.28, sp: 0.3 + Math.random() * 0.6 };
}
function updateAmbient() {
  const kind = map.theme.ambient;
  for (let i = 0; i < ambient.length; i++) {
    const a = ambient[i];
    a.ph += 0.03;
    if (kind === "fireflies") { a.x += Math.cos(a.ph) * 0.4; a.y += Math.sin(a.ph * 0.7) * 0.3; }
    else { a.y += a.sp; a.x += Math.sin(a.ph) * 0.5; }
    if (a.y > H + 10 || a.x < cam.x - 20 || a.x > cam.x + W + 20) ambient[i] = spawnAmbient(kind === "fireflies");
  }
}

// ── 렌더 ──────────────────────────────────────────────────
function rect(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), w, h); }

function drawSky() {
  const t = map.theme;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, t.sky[0]); g.addColorStop(0.55, t.sky[1]); g.addColorStop(1, t.sky[2]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (t.moon) {
    rect(t.moon.x * W - t.moon.r, t.moon.y - t.moon.r, t.moon.r * 2, t.moon.r * 2, t.moon.col);
    rect(t.moon.x * W - t.moon.r + 8, t.moon.y - t.moon.r - 8, t.moon.r * 2 - 16, 8, t.moon.col);
    rect(t.moon.x * W - t.moon.r + 8, t.moon.y + t.moon.r, t.moon.r * 2 - 16, 8, t.moon.col);
    // 별
    for (let i = 0; i < 40; i++) {
      const sx = (i * 137 + 31) % W, sy = (i * 89 + 17) % (H * 0.55);
      ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(tick * 0.02 + i));
      rect(sx, sy, 2, 2, "#cfd8ff");
    }
    ctx.globalAlpha = 1;
  }
  if (t.sun) {
    const s = t.sun;
    ctx.globalAlpha = 0.25; rect(s.x * W - s.r * 1.6, s.y - s.r * 1.6, s.r * 3.2, s.r * 3.2, s.col); ctx.globalAlpha = 1;
    rect(s.x * W - s.r, s.y - s.r, s.r * 2, s.r * 2, s.col);
  }
  if (t.clouds) {
    ctx.globalAlpha = 0.35;
    for (const cl of cloudOffsets) {
      const cx = ((cl.f * map.w - cam.x * PARALLAX_CLOUD + tick * 0.1 * cl.s) % (W + 200)) - 100;
      rect(cx, cl.y, 90 * cl.s, 16, "#fff4e0"); rect(cx + 18, cl.y - 10, 54 * cl.s, 12, "#fff4e0");
    }
    ctx.globalAlpha = 1;
  }
}

function ridgePath(seed, baseY, amp) {
  ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 16) {
    const wx = x + cam.x;
    const y = baseY - Math.abs(Math.sin(wx * 0.004 + seed) * amp) - Math.abs(Math.sin(wx * 0.013 + seed * 2) * amp * 0.4);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
}
function drawRidges() {
  ctx.save();
  ctx.translate(-(cam.x * PARALLAX_FAR) % 16, 0);
  ctx.fillStyle = map.theme.ridge2; ridgePath(1.7, 360, 90);
  ctx.restore();
  ctx.save();
  ctx.translate(-(cam.x * PARALLAX_NEAR) % 16, 0);
  ctx.fillStyle = map.theme.ridge1; ridgePath(4.2, 410, 70);
  ctx.restore();
}

// ── 코드 픽셀 소품들 ──────────────────────────────────────
function drawProp(p) {
  const gy = (p.y ?? GROUND_Y);
  if (p.type === "house") {
    const { x, w, h } = p;
    rect(x, gy - h, w, h, p.col);                                  // 벽
    rect(x + w * 0.4, gy - h * 0.45, w * 0.2, h * 0.45, "#2a1a20"); // 문
    rect(x + w * 0.12, gy - h * 0.75, w * 0.18, h * 0.2, "#ffe8a0"); // 창(불빛)
    rect(x + w * 0.7, gy - h * 0.75, w * 0.18, h * 0.2, "#ffe8a0");
    for (let i = 0; i < 4; i++) rect(x - 10 + i * 5, gy - h - 26 + i * 7, w + 20 - i * 10, 8, p.roof); // 지붕
  } else if (p.type === "well") {
    rect(p.x - 18, gy - 30, 36, 30, "#6a6a7a"); rect(p.x - 22, gy - 34, 44, 6, "#8a8a9a");
    rect(p.x - 20, gy - 70, 4, 40, "#4a3424"); rect(p.x + 16, gy - 70, 4, 40, "#4a3424");
    rect(p.x - 26, gy - 78, 52, 8, "#7a4a2a");
  } else if (p.type === "lamp") {
    rect(p.x - 2, gy - 64, 4, 64, "#3a3a4a");
    rect(p.x - 7, gy - 76, 14, 14, "#ffd86a");
    ctx.globalAlpha = 0.18; rect(p.x - 18, gy - 87, 36, 36, "#ffd86a"); ctx.globalAlpha = 1;
  } else if (p.type === "fence") {
    for (let i = 0; i < p.w; i += 18) rect(p.x + i, gy - 26, 5, 26, "#6a4a32");
    rect(p.x, gy - 22, p.w, 4, "#7a5a3e"); rect(p.x, gy - 12, p.w, 4, "#7a5a3e");
  } else if (p.type === "sign") {
    rect(p.x - 2, gy - 38, 4, 38, "#5a3a26");
    rect(p.x - 34, gy - 56, 68, 22, "#8a5a36"); rect(p.x - 34, gy - 56, 68, 3, "#a87a4e");
    ctx.fillStyle = "#ffe8c0"; ctx.font = "9px 'Courier New'"; ctx.textAlign = "center";
    ctx.fillText(p.text.length > 10 ? "안내판" : p.text, p.x, gy - 41);
  } else if (p.type === "tree") {
    const h = p.h;
    rect(p.x - 7, gy - h * 0.5, 14, h * 0.5, "#4a3424");
    rect(p.x - h * 0.32, gy - h, h * 0.64, h * 0.55, map.theme.ambient === "fireflies" ? "#1c3a30" : "#2e6a3a");
    rect(p.x - h * 0.22, gy - h - h * 0.18, h * 0.44, h * 0.25, map.theme.ambient === "fireflies" ? "#244a3a" : "#3a8a4a");
  } else if (p.type === "flowers") {
    for (let i = 0; i < 5; i++) {
      const fx = p.x + i * 9 - 18;
      rect(fx, gy - 8, 2, 8, "#3a7a3a");
      rect(fx - 2, gy - 12, 6, 5, ["#ff8ab0", "#ffd86a", "#caa3ff"][i % 3]);
    }
  } else if (p.type === "mushroom") {
    rect(p.x - 3, gy - 10, 6, 10, "#e8e0d0");
    rect(p.x - 9, gy - 16, 18, 7, "#c84a5a"); rect(p.x - 5, gy - 14, 3, 2, "#ffe8e8"); rect(p.x + 3, gy - 14, 3, 2, "#ffe8e8");
  }
}

function drawNpc(n) {
  // 촌장 까비 — 코드 픽셀 (둥근 몸 + 귀 + 지팡이), 살짝 둥실거림
  const bob = Math.sin(tick * 0.05) * 2;
  const x = n.x, y = GROUND_Y - 34 + bob;
  rect(x - 12, y, 24, 26, "#f0c060");          // 몸
  rect(x - 12, y, 24, 8, "#e8a84a");           // 머리색
  rect(x - 10, y - 8, 7, 10, "#f0c060"); rect(x + 3, y - 8, 7, 10, "#f0c060"); // 귀
  rect(x - 6, y + 8, 4, 4, "#2a1a10"); rect(x + 2, y + 8, 4, 4, "#2a1a10");    // 눈
  rect(x - 2, y + 15, 4, 3, "#c0502a");        // 입
  rect(x + 14, y - 6, 3, 34, "#7a5a3e");       // 지팡이
  rect(x + 11, y - 12, 9, 8, "#6ae8c0");
  if (Math.abs(player.x + player.w / 2 - n.x) < INTERACT_RANGE && !bubble) {
    ctx.fillStyle = "#fff"; ctx.font = "10px 'Courier New'"; ctx.textAlign = "center";
    ctx.fillText("↑ 말 걸기", x, y - 18);
  }
}

function drawPortal(pt) {
  const x = pt.x, baseY = GROUND_Y;
  for (let i = 0; i < 7; i++) {
    const ph = tick * 0.08 + i * 0.9;
    const rx = Math.sin(ph) * (PORTAL_W / 2 - 4);
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(ph * 1.3);
    rect(x + rx - 3, baseY - 10 - i * (PORTAL_H / 7), 6, 6, i % 2 ? "#5ab0ff" : "#a0e0ff");
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#bfe3ff"; ctx.font = "10px 'Courier New'"; ctx.textAlign = "center";
  ctx.fillText(pt.label, x, baseY - PORTAL_H - 8);
  if (nearPortal() === pt) ctx.fillText("↑ 이동", x, baseY + 16);
}

function drawPlayer() {
  const pl = player;
  const cx = pl.x + pl.w / 2, bottom = pl.y + pl.h + 1;
  // 어드벤처와 같은 squash & stretch 워크 사이클
  const ph = pl.walkT * 0.35;
  let bob = 0, tilt = 0, sx = 1, sy = 1;
  if (!pl.onGround) { bob = -1; sy = 1.07; sx = 0.95; }
  else if (pl.vx !== 0) {
    bob = -Math.abs(Math.sin(ph)) * 3; tilt = Math.sin(ph) * 0.13;
    sx = 1 + Math.sin(ph * 2) * 0.04; sy = 1 - Math.sin(ph * 2) * 0.04;
  }
  ctx.save(); ctx.translate(cx, bottom + bob);
  if (pl.face < 0) ctx.scale(-1, 1);
  ctx.rotate(tilt); ctx.scale(sx, sy);
  if (pl.cls === "custom") {
    ctx.scale(1.35, 1.35); // 커스텀 까비를 PNG 캐릭터와 비슷한 크기로
    drawCustomChar(ctx, save.custom ?? DEFAULT_TRAITS, tick);
  } else if (charReady[pl.cls]) {
    const img = charImg[pl.cls];
    const dw = CHAR_DRAW_W, dh = dw * img.height / img.width;
    ctx.drawImage(img, -dw / 2, -dh, dw, dh);
  } else {
    ctx.fillStyle = CHARACTERS[pl.cls].col;
    ctx.fillRect(-pl.w / 2, -pl.h, pl.w, pl.h);
  }
  ctx.restore();
  if (DEBUG) { ctx.strokeStyle = "#ff2ed1"; ctx.strokeRect(pl.x, pl.y, pl.w, pl.h); }
}

function drawBubble() {
  if (!bubble) return;
  const text = bubble.npc.lines[bubble.lineIdx];
  const x = bubble.npc.x, y = GROUND_Y - 96;
  ctx.font = "11px 'Courier New'";
  const w = Math.max(80, ctx.measureText(text).width + 20);
  ctx.fillStyle = "rgba(255,255,255,.94)";
  ctx.fillRect(x - w / 2, y - 26, w, 30);
  ctx.fillRect(x - 5, y + 4, 10, 7);
  ctx.fillStyle = "#2a2030"; ctx.textAlign = "center";
  ctx.fillText(text, x, y - 7);
  ctx.fillStyle = "#9a8aa0"; ctx.font = "8px 'Courier New'";
  ctx.fillText(`${bubble.npc.name} · ↑ 다음`, x, y + 1 + 16);
}

function draw() {
  if (state !== "world") return;
  drawSky();
  drawRidges();

  ctx.save();
  ctx.translate(-Math.round(cam.x), 0);

  for (const p of map.props) drawProp(p);
  for (const n of map.npcs) drawNpc(n);
  for (const pt of map.portals) drawPortal(pt);

  for (const p of map.platforms) {
    rect(p.x, p.y, p.w, p.h, map.theme.platBody);
    rect(p.x, p.y, p.w, 4, map.theme.platTop);
    if (DEBUG) { ctx.strokeStyle = "#39ff14"; ctx.strokeRect(p.x, p.y, p.w, p.h); }
  }

  drawPlayer();
  drawBubble();

  // 내 채팅 말풍선 (메이플처럼 머리 위에)
  if (myBubble) {
    const x = player.x + player.w / 2, y = player.y - 18;
    ctx.font = "11px 'Courier New'";
    const bw = Math.max(40, ctx.measureText(myBubble.text).width + 16);
    ctx.globalAlpha = Math.min(1, myBubble.t / 30);
    ctx.fillStyle = "rgba(255,255,255,.94)";
    ctx.fillRect(x - bw / 2, y - 20, bw, 24);
    ctx.fillRect(x - 4, y + 3, 8, 6);
    ctx.fillStyle = "#2a2030"; ctx.textAlign = "center";
    ctx.fillText(myBubble.text, x, y - 4);
    ctx.globalAlpha = 1;
  }

  // 분위기 파티클 (월드 좌표)
  for (const a of ambient) {
    if (map.theme.ambient === "fireflies") {
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(a.ph * 2);
      rect(a.x, a.y, 3, 3, "#d8ff7a");
    } else if (map.theme.ambient === "petals") {
      ctx.globalAlpha = 0.8; rect(a.x, a.y, 4, 3, "#ffb0c8");
    } else {
      ctx.globalAlpha = 0.7; rect(a.x, a.y, 4, 3, "#d8a05a");
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // 맵 이름 배너
  if (bannerT > 0) {
    const a = Math.min(1, bannerT / 40);
    ctx.globalAlpha = a;
    ctx.fillStyle = "rgba(10,8,24,.7)"; ctx.fillRect(W / 2 - 130, 38, 260, 44);
    ctx.fillStyle = "#ffe8c0"; ctx.font = "bold 20px 'Courier New'"; ctx.textAlign = "center";
    ctx.fillText(map.name, W / 2, 66);
    ctx.globalAlpha = 1;
  }

  // 조작 안내 (항상 은은하게)
  ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.font = "10px 'Courier New'"; ctx.textAlign = "left";
  ctx.fillText("이동 ←→ · 점프 Space/Z(2단) · 포탈/대화 ↑ · 인증샷 P · 채팅 Enter", 10, H - 10);

  // 인증샷 플래시·토스트
  if (flashT > 0) {
    flashT--;
    ctx.globalAlpha = flashT / 10;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  if (toastT > 0) {
    toastT--;
    ctx.globalAlpha = Math.min(1, toastT / 30);
    ctx.fillStyle = "rgba(10,8,24,.8)"; ctx.fillRect(W / 2 - 110, H - 92, 220, 28);
    ctx.fillStyle = "#6ae8c0"; ctx.font = "bold 12px 'Courier New'"; ctx.textAlign = "center";
    ctx.fillText(toastMsg, W / 2, H - 73);
    ctx.globalAlpha = 1;
  }
  if (DEBUG) { ctx.fillText(`map:${mapId} x:${Math.round(player?.x ?? 0)} cam:${Math.round(cam.x)}`, 10, 16); }

  // 페이드
  if (fade > 0) {
    ctx.globalAlpha = Math.min(1, fade / FADE_FRAMES);
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
}

function loop() { update(); draw(); requestAnimationFrame(loop); }
loop();
