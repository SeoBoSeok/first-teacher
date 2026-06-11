// 까비 월드 — 모든 조정 가능한 수치는 여기에 모은다 (docs/04 "매직 넘버는 config로")

export const W = 640, H = 480;
export const GROUND_Y = 456;

// 물리 — 까비 어드벤처와 동일한 값 (손맛 유지가 목적이므로 바꾸려면 어드벤처도 함께 검토)
export const GRAV = 0.5;
export const MAX_FALL = 14;
export const JUMPS_MAX = 2;

// 마을 로밍은 전투맵보다 이동을 약간 빠르게 — 맵이 넓어 체감 답답함 방지
export const WORLD_SPEED_MULT = 1.6;

// 캐릭터 — 어드벤처의 이동·점프 수치 그대로 (전투 스탯은 평화 월드라 제외)
export const CHARACTERS = {
  machaei: { name: "Machaei", img: "char_machaei.png", col: "#7fcfff", moveSpd: 1.3, jumpV: -9.0 },
  mahanni: { name: "Mahanni", img: "char_mahanni.png", col: "#a14fd8", moveSpd: 1.5, jumpV: -9.2 },
  mareh:   { name: "Mareh",   img: "char_mareh.png",   col: "#46e082", moveSpd: 1.4, jumpV: -9.0 },
  marisa:  { name: "Marisa",  img: "char_marisa.png",  col: "#7fff5a", moveSpd: 1.25, jumpV: -9.0 },
};
export const CHAR_KEYS = Object.keys(CHARACTERS);

export const PLAYER_W = 20, PLAYER_H = 30;
export const CHAR_DRAW_W = 44; // PNG 표시 폭 (원본 비율 유지)

// 커스텀 까비(트레이트 빌더)의 이동 능력치 — 프리셋 4종의 중간값
export const CUSTOM_STATS = { name: "커스텀 까비", moveSpd: 1.35, jumpV: -9.0 };

// 포탈·상호작용
export const PORTAL_W = 36, PORTAL_H = 56;
export const INTERACT_RANGE = 30;     // NPC·표지판에 말 걸 수 있는 거리(px)
export const FADE_FRAMES = 24;        // 맵 전환 페이드 길이
export const BANNER_FRAMES = 150;     // 맵 이름 배너 표시 시간
export const BUBBLE_FRAMES = 210;     // 말풍선 표시 시간

// 패럴랙스 — 멀수록 천천히 움직인다 (2.5D 깊이감의 핵심)
export const PARALLAX_FAR = 0.2, PARALLAX_NEAR = 0.45, PARALLAX_CLOUD = 0.1;

export const AMBIENT_COUNT = 26; // 화면 안 분위기 파티클 개수
