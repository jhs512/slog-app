# TOPCIT2 읽어주기 이식

- 원본: https://github.com/jhs512/topcit2/tree/549c25dbad96b9ddc511098136527437d9f143fc/shared
- 기준 커밋: `549c25dbad96b9ddc511098136527437d9f143fc`
- 확인한 통합: `article/reader.mjs`, `output/markdown/reader.mjs`, `shared/speech-loader.mjs`
- 원본 테스트: `tests/speech.test.mjs`, `tests/speech-math.test.mjs`, `tests/speech-pronunciation.test.mjs` 및 브라우저·scope·toggle 검사

`speech-engine.mjs`, `speech-pronunciation.mjs`, `speech-math.mjs`는 원본을 재사용한다. `speech.mjs`의 버전 쿼리 import와 저장 키를 Slog에 맞췄고, 안내문을 본문 앞에 붙인다. 이전·다음 문장 이동과 전체 Escape 정지를 추가했다. `speech-text.mjs`에는 코드 블록·만화·도식 제외 및 닫힌 details 판정을 추가했다. CSS는 Slog 색 토큰에 맞췄다. Next/Turbopack CSS 파서와 호환되도록 `speech-highlight.mjs`에서 native `::highlight` 스타일만 런타임에 설치·해제한다. 본문 범위와 비동기 로딩 수명은 `postSpeech.ts`, `PostSpeech.tsx`에서 관리한다.

이 기준 커밋에는 저장소 전체 코드의 LICENSE 파일이나 SPDX 라이선스 선언이 없으며 GitHub license 정보도 null이다. MIT 등으로 재표시하지 않는다. 사용자 요청에 따라 동일 소유자 `jhs512`의 Slog 저장소로 기능을 이식하고 출처를 보존한다. 교재·PDF·학습 콘텐츠·다른 vendor 자료는 가져오지 않았다.

검증: `pnpm test:speech`, `pnpm exec playwright test --config playwright.rendering.config.ts e2e/rendering/speech.spec.ts`.
