// 까비 월드 — 맵 데이터 (메이플식: 마을 허브 + 좌우로 이어지는 야외 맵)
// 새 맵 추가 = 이 파일에 객체 하나 추가가 전부가 되도록 유지한다

import { GROUND_Y } from "./config.js";

export const MAPS = {
  town: {
    name: "까비 마을",
    w: 1700,
    spawnX: 600,
    theme: {
      sky: ["#1a0a2e", "#7a2a4a", "#ff9a56"], // 해질녘 보라→노을
      ridge1: "#2a1038", ridge2: "#180826",
      platBody: "#4a3046", platTop: "#caa37a", // 나무 데크
      ambient: "leaves", clouds: true, sun: { x: 0.78, y: 120, r: 34, col: "#ffb070" },
    },
    platforms: [
      { x: 0, y: GROUND_Y, w: 1700, h: 24 },
      { x: 340, y: 360, w: 120, h: 14 }, { x: 520, y: 310, w: 100, h: 14 },
      { x: 880, y: 350, w: 140, h: 14 }, { x: 1150, y: 320, w: 110, h: 14 },
    ],
    props: [
      { type: "fence", x: 60, w: 140 }, { type: "fence", x: 1480, w: 140 },
      { type: "sign", x: 150, text: "← 노을 언덕" },
      { type: "house", x: 360, w: 180, h: 120, col: "#7a4a5a", roof: "#e86a6a" },
      { type: "lamp", x: 260 },
      { type: "well", x: 720 },
      { type: "house", x: 900, w: 210, h: 140, col: "#5a4a7a", roof: "#7a8ae8" },
      { type: "lamp", x: 860 },
      { type: "lamp", x: 1340 },
      { type: "sign", x: 1550, text: "달빛 숲 →" },
    ],
    npcs: [
      {
        x: 650, name: "촌장 까비",
        lines: [
          "까비 마을에 온 걸 환영해!",
          "여긴 곧 친구들이 모일 광장이야.",
          "포탈 앞에서 ↑키를 누르면 모험을 떠날 수 있어!",
        ],
      },
    ],
    portals: [
      { x: 40, to: "hill", toX: 1500, label: "노을 언덕" },
      { x: 1630, to: "forest", toX: 120, label: "달빛 숲" },
    ],
  },

  hill: {
    name: "노을 언덕",
    w: 1600,
    spawnX: 1500,
    theme: {
      sky: ["#2a4858", "#caa05a", "#ffe8a0"], // 노을빛 하늘
      ridge1: "#3a5a3a", ridge2: "#23401f",
      platBody: "#3a5a30", platTop: "#9ae87a", // 풀 언덕
      ambient: "petals", clouds: true, sun: { x: 0.25, y: 100, r: 44, col: "#ffcf70" },
    },
    platforms: [
      { x: 0, y: GROUND_Y, w: 1600, h: 24 },
      // 꼭대기 전망대까지 계단식 언덕
      { x: 1180, y: 400, w: 200, h: 16 }, { x: 980, y: 340, w: 180, h: 16 },
      { x: 760, y: 280, w: 170, h: 16 }, { x: 540, y: 220, w: 170, h: 16 },
      { x: 320, y: 160, w: 180, h: 16 }, { x: 90, y: 110, w: 200, h: 16 },
    ],
    props: [
      { type: "sign", x: 150, y: 110, text: "까비 마을이 한눈에!" },
      { type: "tree", x: 480, h: 110 }, { type: "tree", x: 1300, h: 130 },
      { type: "flowers", x: 240 }, { type: "flowers", x: 660 }, { type: "flowers", x: 900 },
      { type: "flowers", x: 1120 }, { type: "flowers", x: 1430 },
      { type: "fence", x: 30, w: 120 },
    ],
    npcs: [],
    portals: [{ x: 1540, to: "town", toX: 110, label: "까비 마을" }],
  },

  forest: {
    name: "달빛 숲",
    w: 1700,
    spawnX: 120,
    theme: {
      sky: ["#050214", "#0e0a30", "#1a1448"], // 깊은 밤
      ridge1: "#120a30", ridge2: "#090520",
      platBody: "#23203c", platTop: "#7a6aff", // 달빛 받은 가지
      ambient: "fireflies", clouds: false, moon: { x: 0.7, y: 90, r: 30, col: "#e8ecff" },
    },
    platforms: [
      { x: 0, y: GROUND_Y, w: 1700, h: 24 },
      { x: 300, y: 370, w: 110, h: 14 }, { x: 560, y: 315, w: 120, h: 14 },
      { x: 840, y: 360, w: 110, h: 14 }, { x: 1080, y: 300, w: 120, h: 14 },
      { x: 1320, y: 350, w: 110, h: 14 },
    ],
    props: [
      { type: "tree", x: 220, h: 170 }, { type: "tree", x: 470, h: 200 },
      { type: "tree", x: 720, h: 180 }, { type: "tree", x: 1000, h: 210 },
      { type: "tree", x: 1240, h: 180 }, { type: "tree", x: 1520, h: 190 },
      { type: "mushroom", x: 350 }, { type: "mushroom", x: 790 }, { type: "mushroom", x: 1150 },
      { type: "sign", x: 920, text: "밤의 숲... 반딧불이 길을 안내해" },
    ],
    npcs: [],
    portals: [{ x: 60, to: "town", toX: 1560, label: "까비 마을" }],
  },
};

export const FIRST_MAP = "town";
