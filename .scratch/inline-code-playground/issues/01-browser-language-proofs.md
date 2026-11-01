# 01: 브라우저 컴파일과 시각화 후보 검증

**What to build:** 언어별 단일 파일 소스와 선입력을 브라우저에서 컴파일·실행하고 실제 지원 범위와 배제 근거를 기록한다.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Java·C·C++·JavaScript·TypeScript·Rust·Go 각각의 검증 또는 제외 근거가 있다.
- [x] Rust·Go는 사전 컴파일된 WASM 실행과 브라우저 내 소스 컴파일을 구분한다.
- [x] C 메모리·React DOM/VDOM·런타임 재사용의 실제 데이터와 격리 가설을 검증한다.
- [x] 정적 자산·라이선스·최초 로딩·자산 크기·제약을 기록하고 원격 실행을 사용하지 않는다.

## Comments

- 2026-11-01 Claude: JS·TS·HTML·React·C는 제품 흐름 e2e로 검증(`front/e2e/rendering/code-lab.spec.ts`). Java·C++·Rust·Go는 headless Chromium 실측과 자산 크기·라이선스·COOP/COEP 요구를 `../runtime-proofs.md`에 기록. 런타임 수명: 실행마다 새 iframe/Worker, Babel 변환 워커만 재사용(변환 전용·요청별 독립, 재열기 초기화 e2e). sandbox iframe 무한 반복이 부모 스레드를 멈추는 것을 실측해 반복 제한을 넣음.
