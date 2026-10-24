# Execution ledger — docs/Movement_Implementation_Plan.md

- Task 1 complete: 현행 지침·구조·명세·진입점 추가. 원문/기존 최상위 파일 보존.
- Task 2 complete: 모델 RED 확인 후 구현, 입력 경계·여정 표식 회귀 포함 최종 Node 22/22 통과.
- Task 3 written: 공용 HTML/CSS/JS·SVG 지도·Canvas 현장·여정 상태 연결. 실제 브라우저 통합 확인은 미완료.
- Task 4 incomplete: 연결 도구 helper 시작 실패, Chrome/Edge 렌더러 미생성. 브라우저 검사 설정 단계 실패, 캡처 0장. 시각·아트 검수 미실행.
- Task 5 partial: 읽기 전용 독립 리뷰·수정 반영·HTTP10/10·JS구문12개·기존52개 보존 확인. 브라우저 검수 후 사용자 검토가 남음.

Ruling: Git 저장소가 아니고 사용자가 Git 작업을 금지했으므로 worktree/commit/merge/삭제 단계는 적용하지 않음.

Ruling: 승인된 지침 정리와 구현 범위를 다시 승인받지 않음. 승인 범위의 새 현행 문서·새 구현 파일을 추가하고 기존 파일 52개는 덮어쓰지 않음.

Ruling: 정적 생성 이미지나 코드 검사를 실제 HTML 실행 캡처·시각 통과로 대체하지 않음. 정상 브라우저 실행 환경에서 미완료 검사를 이어갈 수 있도록 검사 스크립트와 실패 증거를 보존함.

Ruling: 리뷰어가 보류한 실제 포커스/IME/더블클릭/패닝/아트는 미검수로 유지. 역방향 정차일은 시험 프로필이며 정식 물리적 정차점 정책으로 확정하지 않음. 확인창 도중 유효 운임 변경 UI는 이번 범위에 추가하지 않음.
