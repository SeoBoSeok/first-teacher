// 실시간 채팅 + 접속자 위치 공유 — 서버·계정·저장 없음.
// Trystero(P2P WebRTC): 공개 시그널링으로 브라우저끼리 직접 연결되고,
// 메시지·위치는 어디에도 기록되지 않는다 (접속 중인 사람끼리만, 닫으면 사라짐).

const MAX_LEN = 80;
const COOLDOWN_MS = 1200;   // 도배 방지
const MAX_LINES = 60;
const POS_INTERVAL = 120;   // 위치 전송 주기(ms) ≈ 초당 8회
const BUBBLE_MS = 3800;     // 친구 머리 위 말풍선 유지 시간

export async function initChat({ getNick, setNick, getMapName, onSelfMessage, getPlayerState, getAppearance }) {
  const box = document.getElementById("chat");
  const logEl = box.querySelector(".chat-log");
  const input = box.querySelector("input");
  const headEl = box.querySelector(".chat-head");

  function add(text, cls = "") {
    const p = document.createElement("p");
    if (cls) p.className = cls;
    p.textContent = text;
    logEl.append(p);
    while (logEl.children.length > MAX_LINES) logEl.firstChild.remove();
    logEl.scrollTop = logEl.scrollHeight;
  }

  let sendChat = null, sendHello = null;
  // peerId → { nick, cls, custom, x, y, tx, ty, map, face, walking, walkT, bubble }
  const remotes = new Map();
  const refreshHead = () => { headEl.textContent = `💬 채팅 · 접속 ${remotes.size + 1}명`; };
  refreshHead();
  add("연결 중…", "sys");

  try {
    // 버전 고정 — CDN의 최신판 API 변경으로 갑자기 깨지는 것을 방지
    const { joinRoom } = await import("https://esm.run/trystero@0.25.2");
    const room = joinRoom({ appId: "kkabbi-world-v2" }, "global");
    if (location.search.includes("debug")) window.__chatDebug = { room, remotes }; // ?debug 진단용
    // v0.25 API: makeAction은 {send, onMessage} 객체, 이벤트는 할당식(room.onPeerJoin = fn)
    const chat = room.makeAction("chat");
    const hello = room.makeAction("hello");
    const pos = room.makeAction("pos");
    sendChat = chat.send; sendHello = hello.send;

    const myHello = () => ({ nick: getNick(), ...getAppearance() });

    room.onPeerJoin = (id) => {
      // 연결 즉시 등록 (닉네임은 hello로 나중에) — 접속 수가 바로 정확해진다
      if (!remotes.has(id)) remotes.set(id, { nick: null, cls: "mareh", custom: null });
      refreshHead();
      // 채널 직후 전송은 유실될 수 있어 시차를 두고 재시도
      for (const d of [0, 800, 2500]) setTimeout(() => { try { sendHello(myHello(), id); } catch {} }, d);
    };
    room.onPeerLeave = (id) => {
      const n = remotes.get(id)?.nick;
      remotes.delete(id); refreshHead();
      if (n) add(`${n} 님이 월드를 떠났어요`, "sys");
    };
    // v0.25: onMessage 두 번째 인자는 {peerId} 객체 (문자열 아님 — 주의!)
    hello.onMessage = (data, meta) => {
      const id = meta?.peerId ?? meta;
      // 관전자(공식 홈의 라이브 위젯 등)는 플레이어로 세지 않는다
      if (data?.observer) { remotes.delete(id); refreshHead(); return; }
      const prev = remotes.get(id) ?? {};
      const firstHello = !prev.nick;
      remotes.set(id, {
        ...prev,
        nick: String(data?.nick ?? "까비").slice(0, 12),
        cls: data?.cls ?? "mareh",
        custom: data?.custom ?? null,
      });
      refreshHead();
      if (firstHello) {
        add(`${remotes.get(id).nick} 님이 들어왔어요 👋`, "sys");
        try { sendHello(myHello(), id); } catch {}
      }
    };
    pos.onMessage = (d, meta) => {
      const r = remotes.get(meta?.peerId ?? meta);
      if (!r || typeof d?.x !== "number") return;
      if (r.tx === undefined) { r.x = d.x; r.y = d.y; } // 첫 수신은 순간이동
      r.tx = d.x; r.ty = d.y; r.map = d.m; r.face = d.f; r.walking = !!d.w;
    };
    chat.onMessage = (data, meta) => {
      const id = meta?.peerId ?? meta;
      const r = remotes.get(id);
      const text = String(data?.text ?? "").slice(0, MAX_LEN);
      add(`[${String(data?.map ?? "")}] ${r?.nick ?? "까비"}: ${text}`);
      if (r) r.bubble = { text, until: performance.now() + BUBBLE_MS }; // 친구 머리 위 말풍선
    };

    // 내 위치 브로드캐스트
    setInterval(() => {
      const s = getPlayerState();
      if (!s || remotes.size === 0) return;
      try { pos.send({ x: Math.round(s.x), y: Math.round(s.y), m: s.map, f: s.face, w: s.walking ? 1 : 0 }); } catch {}
    }, POS_INTERVAL);

    add("연결됨! 접속한 친구들이 월드에 보이고 대화할 수 있어요. (저장되지 않아요)", "sys");
    add(`내 이름: ${getNick()} — 바꾸려면 "/이름 새이름"`, "sys");
  } catch (e) {
    console.error("[chat] 연결 실패:", e); // 디버깅용 — 사용자에겐 아래 안내만 보임
    add("채팅 연결 실패 — 인터넷 연결을 확인해 주세요. 게임은 그대로 즐길 수 있어요!", "sys");
  }

  let lastSent = 0;
  function submit() {
    const raw = input.value.trim();
    input.value = "";
    if (!raw) { input.blur(); return; }

    // 이름 바꾸기 명령
    if (raw.startsWith("/이름 ") || raw.startsWith("/name ")) {
      const nick = raw.split(" ").slice(1).join(" ").trim().slice(0, 12);
      if (nick) { setNick(nick); add(`이름을 '${nick}'(으)로 바꿨어요`, "sys"); sendHello?.({ nick, ...getAppearance() }); }
      return;
    }

    const now = Date.now();
    if (now - lastSent < COOLDOWN_MS) { add("잠깐! 너무 빨라요 🐢", "sys"); return; }
    lastSent = now;

    const text = raw.slice(0, MAX_LEN);
    add(`[${getMapName()}] ${getNick()}: ${text}`, "me");
    sendChat?.({ text, map: getMapName() });
    onSelfMessage(text);
  }

  input.addEventListener("keydown", (e) => {
    e.stopPropagation(); // 채팅 입력 중 캐릭터가 움직이지 않게
    if (e.key === "Enter") submit();
    if (e.key === "Escape") { input.value = ""; input.blur(); }
  });

  return {
    focusInput: () => input.focus(),
    getRemotes: () => remotes,
    // 임베드 호스트(공식 홈)가 닉네임을 바꿨을 때 친구들에게 알리기
    announceNick: () => { try { sendHello?.({ nick: getNick(), ...getAppearance() }); } catch {} },
    notify: (text) => add(text, "sys"),
  };
}
