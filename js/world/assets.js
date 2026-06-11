// 이미지 에셋 로더 — Sunny Land (CC0, ansimuz) 환경 아트
// 로드 전 프레임에서는 그리기를 건너뛴다 (다음 프레임에 자연히 나타남)

const cache = {};

export function img(src) {
  if (!cache[src]) {
    const i = new Image();
    i.src = src;
    cache[src] = i;
  }
  return cache[src];
}

export const ready = (i) => i.complete && i.naturalWidth > 0;

export const ART = {
  back: "assets/sunnyland/back.png",       // 하늘·바다·구름 (원경)
  middle: "assets/sunnyland/middle.png",   // 숲 실루엣 언덕 (중경)
  tileset: "assets/sunnyland/tileset.png", // 16px 지형 타일
  tree: "assets/sunnyland/tree.png",
  house: "assets/sunnyland/house.png",
  bush: "assets/sunnyland/bush.png",
  rock: "assets/sunnyland/rock.png",
  shrooms: "assets/sunnyland/shrooms.png",
};

// 타일셋 좌표 (16px 그리드): 잔디 윗면 3종 + 흙 채움
export const TILE = {
  size: 16,
  grassL: [0, 0], grassM: [16, 0], grassR: [32, 0],
  dirt: [16, 16],
};
