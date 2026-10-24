# 이동 HTML 구현 계획

명세: `docs/Movement_System_UI.md`, `docs/UI_Production_Guidelines.md`, `docs/UI_Concept_Baseline.md` 및 사용자 실행 승인.

## 공통 제약

1920×1080·글씨 100%만, 승인된 구조·단순화 아트, 제공 지도 보존, 실제 DOM/SVG UI, 시험 데이터 분리, 기존 52개 파일 무변경, 설치·Git·Godot 작업 없음. 새 파일은 이번 작업 소유이며 검수 중 수정 가능하다.

## 실행 순서

1. 현행 지침과 문서 진입점 추가, 이전 정책 대응 기록을 archive에 별도 추가.
2. `tests/model.test.mjs` 작성 → 미구현 RED → `model.mjs` 구현 → GREEN. 선택/취소 무변경, 부적합 수단·과적·닫힌 노선·자금 부족, 확정 중복, 정차·재개·도착 보존을 검사.
3. `components.js`, `field.js`, `app.js`, HTML/CSS와 JSON을 작성. 상태 모델은 `createState`, `quote`, `selectDestination`, `selectTransport`, `depart`, `advance`, `resume`를 제공하고 UI가 소비한다.
4. 설치된 Chrome와 Node WebSocket으로 브라우저 QA. HTTP 실행·실제 입력·콘솔·모달 포커스·지도 동기화·버튼 위치·시각 캡처 확인. 연결 도구 초기화 실패 시 로컬 헤드리스 실행 사용.
5. 독립 코드 리뷰, 필요한 수정·회귀 검사, 원본 52개 SHA-256 보존 확인, 실행 보고서 작성. 사용자 검토 대기.

## Review Focus

- 노선 역방향, 현재 도시 선택, 도착 후 재출발의 실제 위치 일치.
- 출발창이 열린 동안 조건 변경·길게 누른 Enter·반복 클릭의 중복 소비 방지.
- 메뉴/모달 중 필드 이동 차단과 취소 후 선택·스크롤·포커스 보존.
- 지도 확대·패닝과 표식/노선/선택의 좌표 일치.
- 정차 화면에서 임의 도착·자동 판매·추가 날짜 발생 방지.

## 실행 방식

같은 세션에서 직접 구현하고 마지막에 독립 리뷰한다. Git 저장소가 아니므로 worktree·commit 단계는 적용하지 않는다. 사용자가 구현을 명시 승인했으므로 승인된 범위에 별도 설계 승인 게이트를 추가하지 않는다.
