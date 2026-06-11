// 저장 — docs/04의 규칙: 스키마 버전 필수, try/catch 필수 (시크릿 모드에서 localStorage는 throw)

const KEY = "kkabbi-world-save";
const VERSION = 1;

const DEFAULTS = { v: VERSION, lastChar: null, lastMap: null, custom: null, nick: null }; // custom: 빌더 결과, nick: 채팅 이름

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const data = JSON.parse(raw);
    // 버전이 다르면 안전하게 초기화 — 옛 데이터로 게임이 깨지는 것보다 낫다
    if (data.v !== VERSION) return { ...DEFAULTS };
    return { ...DEFAULTS, ...data };
  } catch {
    return { ...DEFAULTS };
  }
}

export function updateSave(patch) {
  try {
    const next = { ...loadSave(), ...patch, v: VERSION };
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  } catch {
    return { ...DEFAULTS, ...patch };
  }
}
