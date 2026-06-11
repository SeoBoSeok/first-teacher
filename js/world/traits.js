// 트레이트 캐릭터 시스템 — NFT(SpaceKkabbi) 트레이트 구조와 호환 (docs/05 §8)
// 카테고리·옵션을 여기 추가하면 빌더 UI와 월드 렌더에 자동 반영된다

// 좌표계: 발 중앙이 (0,0), 위로 갈수록 y가 음수. 몸은 x −12..12, y −26..0
function r(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }

export const TRAIT_CATEGORIES = [
  {
    key: "hair", label: "헤어/모자", traitType: "Hair",
    options: [
      { id: "bare", name: "Bare", ko: "민머리", draw: () => {} },
      {
        id: "spiky", name: "Spiky Green", ko: "삐죽 초록", draw: (ctx) => {
          for (let i = 0; i < 5; i++) { r(ctx, -11 + i * 5, -38 + (i % 2) * 3, 4, 8 - (i % 2) * 3, "#3be05a"); }
          r(ctx, -12, -31, 24, 5, "#3be05a");
        },
      },
      {
        id: "bob", name: "Pink Bob", ko: "분홍 단발", draw: (ctx) => {
          r(ctx, -13, -36, 26, 8, "#ff7ab8"); r(ctx, -14, -30, 5, 14, "#ff7ab8"); r(ctx, 9, -30, 5, 14, "#ff7ab8");
        },
      },
      {
        id: "cap", name: "Blue Cap", ko: "파란 모자", draw: (ctx) => {
          r(ctx, -12, -36, 24, 7, "#3b6fd8"); r(ctx, 6, -32, 14, 4, "#2a4fa8"); r(ctx, -4, -39, 8, 4, "#3b6fd8");
        },
      },
    ],
  },
  {
    key: "face", label: "얼굴", traitType: "Face",
    options: [
      {
        id: "happy", name: "Happy", ko: "방긋", draw: (ctx) => {
          r(ctx, -7, -18, 4, 4, "#2a1a10"); r(ctx, 3, -18, 4, 4, "#2a1a10"); r(ctx, -2, -11, 4, 2, "#c0502a");
        },
      },
      {
        id: "cool", name: "Cool Shades", ko: "선글라스", draw: (ctx) => {
          r(ctx, -9, -19, 18, 5, "#181820"); r(ctx, -7, -18, 2, 2, "#8ad8ff"); r(ctx, -2, -12, 5, 2, "#c0502a");
        },
      },
      {
        id: "wink", name: "Wink", ko: "윙크", draw: (ctx) => {
          r(ctx, -7, -18, 4, 4, "#2a1a10"); r(ctx, 3, -17, 4, 2, "#2a1a10"); r(ctx, -1, -11, 4, 3, "#c0502a");
        },
      },
      {
        id: "surprised", name: "Surprised", ko: "깜짝", draw: (ctx) => {
          r(ctx, -7, -19, 4, 5, "#2a1a10"); r(ctx, 3, -19, 4, 5, "#2a1a10");
          r(ctx, -3, -12, 6, 5, "#2a1a10"); r(ctx, -2, -11, 4, 3, "#8a3a2a");
        },
      },
    ],
  },
  {
    key: "outfit", label: "의상", traitType: "Outfit",
    options: [
      { id: "basic", name: "Basic", ko: "기본", draw: () => {} },
      {
        id: "hoodie", name: "Gray Hoodie", ko: "후드티", draw: (ctx) => {
          r(ctx, -12, -13, 24, 13, "#6a6a78"); r(ctx, -5, -9, 10, 5, "#52525e"); r(ctx, -12, -14, 24, 2, "#52525e");
        },
      },
      {
        id: "armor", name: "Silver Armor", ko: "갑옷", draw: (ctx) => {
          r(ctx, -12, -14, 24, 14, "#a8b0c0"); r(ctx, -14, -15, 6, 6, "#c8d0e0"); r(ctx, 8, -15, 6, 6, "#c8d0e0");
          r(ctx, -2, -12, 4, 10, "#7a8298");
        },
      },
      {
        id: "dress", name: "Star Dress", ko: "별 원피스", draw: (ctx) => {
          r(ctx, -10, -14, 20, 8, "#b06ae8"); r(ctx, -13, -6, 26, 6, "#b06ae8");
          r(ctx, -6, -10, 3, 3, "#ffe87a"); r(ctx, 4, -7, 3, 3, "#ffe87a");
        },
      },
    ],
  },
  {
    key: "item", label: "아이템", traitType: "Item",
    options: [
      { id: "none", name: "None", ko: "없음", draw: () => {} },
      {
        id: "staff", name: "Magic Staff", ko: "마법 지팡이", draw: (ctx) => {
          r(ctx, 13, -32, 3, 32, "#7a5a3e"); r(ctx, 10, -38, 9, 8, "#6ae8c0");
        },
      },
      {
        id: "sword", name: "Pixel Sword", ko: "픽셀 검", draw: (ctx) => {
          r(ctx, 14, -30, 4, 22, "#d8e0f0"); r(ctx, 11, -10, 10, 3, "#a87a3e"); r(ctx, 14, -7, 4, 5, "#7a5a3e");
        },
      },
      {
        id: "balloon", name: "Red Balloon", ko: "빨간 풍선", draw: (ctx, t) => {
          const bob = Math.sin(t * 0.06) * 2;
          r(ctx, 15, -22, 1, 18, "#cfc0a8");
          r(ctx, 11, -34 + bob, 10, 12, "#e84a4a"); r(ctx, 13, -32 + bob, 3, 3, "#ff9a9a");
        },
      },
    ],
  },
  {
    key: "shoes", label: "신발", traitType: "Shoes",
    options: [
      { id: "bare", name: "Barefoot", ko: "맨발", draw: () => {} },
      {
        id: "boots", name: "Red Boots", ko: "빨간 부츠", draw: (ctx) => {
          r(ctx, -11, -5, 9, 5, "#d84a3a"); r(ctx, 2, -5, 9, 5, "#d84a3a");
        },
      },
      {
        id: "sneakers", name: "Sneakers", ko: "운동화", draw: (ctx) => {
          r(ctx, -11, -4, 9, 4, "#f0f0f0"); r(ctx, 2, -4, 9, 4, "#f0f0f0");
          r(ctx, -11, -1, 9, 1, "#3b6fd8"); r(ctx, 2, -1, 9, 1, "#3b6fd8");
        },
      },
      {
        id: "rockets", name: "Rocket Shoes", ko: "로켓 신발", draw: (ctx, t) => {
          r(ctx, -11, -5, 9, 5, "#8a92a8"); r(ctx, 2, -5, 9, 5, "#8a92a8");
          const f = (t >> 2) % 2;
          r(ctx, -9, 0, 5, 3 + f, "#ffb03b"); r(ctx, 4, 0, 5, 3 + f, "#ffb03b");
        },
      },
    ],
  },
  {
    key: "aura", label: "오라", traitType: "Aura",
    options: [
      { id: "none", name: "None", ko: "없음", draw: () => {} },
      {
        id: "glow", name: "Golden Glow", ko: "황금빛", behind: true, draw: (ctx, t) => {
          ctx.globalAlpha = 0.14 + 0.06 * Math.sin(t * 0.08);
          r(ctx, -20, -42, 40, 46, "#ffd86a"); ctx.globalAlpha = 1;
        },
      },
      {
        id: "stars", name: "Star Orbit", ko: "별 궤도", behind: true, draw: (ctx, t) => {
          for (let i = 0; i < 3; i++) {
            const a = t * 0.05 + i * 2.09;
            r(ctx, Math.cos(a) * 18 - 1, -16 + Math.sin(a) * 10 - 1, 3, 3, "#ffe87a");
          }
        },
      },
      {
        id: "shadow", name: "Violet Shadow", ko: "보라 그림자", behind: true, draw: (ctx, t) => {
          ctx.globalAlpha = 0.25 + 0.1 * Math.sin(t * 0.06);
          r(ctx, -16, -38, 32, 40, "#7a3ae8"); ctx.globalAlpha = 1;
        },
      },
    ],
  },
];

export const DEFAULT_TRAITS = { hair: "spiky", face: "happy", outfit: "basic", item: "none", shoes: "boots", aura: "none" };

export function getOption(catKey, id) {
  const cat = TRAIT_CATEGORIES.find((c) => c.key === catKey);
  return cat?.options.find((o) => o.id === id) ?? cat?.options[0];
}

export function randomTraits() {
  const t = {};
  for (const c of TRAIT_CATEGORIES) t[c.key] = c.options[Math.floor(Math.random() * c.options.length)].id;
  return t;
}

// NFT 메타데이터 호환 형식 — 인증샷·향후 L1 연동에 사용
export function toNftAttributes(traits) {
  return TRAIT_CATEGORIES.map((c) => ({ trait_type: c.traitType, value: getOption(c.key, traits[c.key]).name }));
}

// 커스텀 까비 그리기 — 발 중앙 (0,0) 기준. 호출부에서 translate/flip/scale 처리
export function drawCustomChar(ctx, traits, t) {
  const get = (k) => getOption(k, traits[k]);
  // 1) 뒤에 깔리는 오라
  get("aura").draw(ctx, t);
  // 2) 몸통 (NPC 까비와 같은 베이스)
  r(ctx, -12, -26, 24, 26, "#f0c060");
  r(ctx, -12, -26, 24, 7, "#e8a84a");
  r(ctx, -10, -33, 7, 9, "#f0c060"); r(ctx, 3, -33, 7, 9, "#f0c060"); // 귀
  // 3) 의상 → 신발 → 얼굴 → 헤어 → 아이템 순서로 겹친다
  get("outfit").draw(ctx, t);
  get("shoes").draw(ctx, t);
  get("face").draw(ctx, t);
  get("hair").draw(ctx, t);
  get("item").draw(ctx, t);
}
