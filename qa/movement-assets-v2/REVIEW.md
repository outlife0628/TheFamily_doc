# 독립 코드 리뷰와 수정 확인

리뷰 범위: `prototype/movement-assets-v2/`의 승인 PNG 연결, CSS/표시 SVG, 원형 미니맵, 공용 UI·이동 입력 및 `browser-check.mjs`. 읽기 전용 독립 리뷰 수행. Critical 없음, Important 2건, 추가 Minor 없음.

1. 원형 미니맵이 기존 표식 좌표를 잘라 일부 이동 경계에서 표식이 사라질 수 있었다. 원형 안전영역에 맞게 `minimapPoint()`를 적용했다. 경계 좌표 회귀 검사가 기존 변환에서 실제 실패한 뒤 수정 후 통과했다. 관련 로그: `review-regression-red.txt`, `model-results.txt`.
2. 종이 배경을 가진 여정 요약 자체가 스크롤 컨테이너였다. `windowSurface(...,{scroll:true})`로 비스크롤 외곽 표면과 `.surface-scroll`을 분리했다. 외곽 종이·모서리 유지용 브라우저 검사를 추가했으나 실행 환경 제한 때문에 실제 스크롤·화면 검수는 미수행이다. 코드 구조는 수정했고 시각적 해결 판정은 보류한다.

리뷰 후 목록과 상세도 `components.js`의 `selectableList()`·`detailPane()` 공용 부품으로 정리했다. 선택 클래스·속성·상태 흐름은 유지한다.

판단 보류: 실제 9분할 경계·색 번짐·글자 대비/잘림·도크 충돌·마우스 연타·포커스·IME·최종 아트 만족도. 코드 리뷰와 단위 검사로 화면 검수를 대신하지 않는다.
