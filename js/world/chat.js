// 실시간 채팅 — 서버·계정·저장 없음.
// Trystero(P2P WebRTC): 공개 시그널링으로 브라우저끼리 직접 연결되고,
// 메시지는 어디에도 기록되지 않는다 (접속 중인 사람끼리만, 닫으면 사라짐).

const MAX_LEN = 80;
const COOLDOWN_MS = 1200; // 도배 방지
const MAX_LINES = 60;

export async function initChat({ getNick, setNick, getMapName, onSelfMessage }) {
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
  const peers = new Map(); // peerId → nick
  const refreshHead = () => { headEl.textContent = `💬 채팅 · 접속 ${peers.size + 1}명`; };
  refreshHead();
  add("연결 중…", "sys");

  try {
    // 버전 고정 — CDN의 최신판 API 변경으로 갑자기 깨지는 것을 방지
    const { joinRoom } = await import("https://esm.run/trystero@0.25.2");
    const room = joinRoom({ appId: "kkabbi-world-v1" }, "global");
    // v0.25 API: makeAction은 {send, onMessage} 객체, 이벤트는 할당식(room.onPeerJoin = fn)
    const chat = room.makeAction("chat");
    const hello = room.makeAction("hello");
    sendChat = chat.send; sendHello = hello.send;

    room.onPeerJoin = (id) => { sendHello({ nick: getNick() }, id); };
    room.onPeerLeave = (id) => {
      const n = peers.get(id);
      peers.delete(id); refreshHead();
      if (n) add(`${n} 님이 월드를 떠났어요`, "sys");
    };
    // v0.25: onMessage 두 번째 인자는 {peerId} 객체 (문자열 아님 — 주의!)
    hello.onMessage = (data, meta) => {
      const id = meta?.peerId ?? meta;
      const isNew = !peers.has(id);
      peers.set(id, String(data?.nick ?? "까비").slice(0, 12));
      refreshHead();
      if (isNew) { add(`${peers.get(id)} 님이 들어왔어요 👋`, "sys"); sendHello({ nick: getNick() }, id); }
    };
    chat.onMessage = (data, meta) => {
      const nick = peers.get(meta?.peerId ?? meta) ?? "까비";
      add(`[${String(data?.map ?? "")}] ${nick}: ${String(data?.text ?? "").slice(0, MAX_LEN)}`);
    };

    add("연결됨! 접속한 친구들과 대화할 수 있어요. (저장되지 않아요)", "sys");
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
      if (nick) { setNick(nick); add(`이름을 '${nick}'(으)로 바꿨어요`, "sys"); sendHello?.({ nick }); }
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

  return { focusInput: () => input.focus() };
}
