# 까비 어드벤처 — 선생님 버전 🎮

[noonmin042-source/first](https://github.com/noonmin042-source/first) (학생A 버전)의 fork.
금요일반 클로드코드 수업에서 **"같은 게임을 소프트웨어 공학적으로 완성까지 끌고 가면 어떻게 되는가"**를 보여주는 참고 구현이다.

## 게임

- **까비 어드벤처** (`kkabbi-adventure.html`) — 본편. 직접 그린 캐릭터 4종, 로비+던전 플랫포머
- **RETRO CHASER** (`index.html`) — 보조. 탑다운 아레나 슈터

실행: `python3 -m http.server 8200` → http://localhost:8200/kkabbi-adventure.html

## 문서 (이 저장소의 핵심)

코드보다 문서가 먼저다. 작업 순서대로:

1. [PRD — Phase 0: 비전·마일스톤·하지 않을 것](docs/01-PRD.md)
2. [기능 리스트 & 시나리오](docs/02-features-scenarios.md)
3. [기술 결정 — 참고 게임·엔진 선택·조작법](docs/03-tech-decisions.md)
4. [선생님 노하우 — 게임 개발·클로드코드 습관](docs/04-teacher-notes.md)
5. [**장기 비전 — 까비 월드**: 실시간 소셜 월드·IP 팬 플랫폼 로드맵](docs/05-vision-kkabbi-world.md)

## 학생 버전과 다른 점

기능이 아니라 **과정**이 다르다: PRD 기준으로 범위를 지키고, 한 번에 한 기능,
실행 확인 후 커밋, 수치는 config로, 저장은 스키마부터. 자세한 규칙은 [CLAUDE.md](CLAUDE.md).
