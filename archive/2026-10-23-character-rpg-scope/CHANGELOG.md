# SYS-03 RPG 핵심 디자인 범위 보강 기록

사용자 지시:

> 캐릭터 시스템에서 rpg 시스템의 근본적인 요소인 캐릭터 스텟, 레벨, 성장요소, 캐릭터의 리소스 관리, 관련 테이블 설계까지 이번 디자인 문서에서 고려해 줘야함. 해당 항목 보강해서 다시 검토 요청해.

정보 조회 중심 준비 범위를 캐릭터 스탯·레벨/XP·성장/기술·리소스 소비/회복·관련 데이터/상태·UI/검수의 디자인으로 보강했다. 보강 전 `NEXT_STAGE.md`, `docs/next-stage/CURRENT_STATE.md`, `SYS03_Preparation.md`를 이 폴더의 같은 상대 경로에 보존했다.

현재 디자인은 `docs/character/03_Character_System_UI.md`, 데이터 부록은 `Character_Data_Tables.md`, 재검토 요청은 `Character_Review_Request.md`다. 기존 확정 규칙·새 제안·시험 수치를 구분했다. 새 코드·HTML·아트·설치·Godot 작업이나 Git 변경은 수행하지 않았다. 원작과 승인 이동 실행본은 유지했다.

성장A/6기본 스탯/HP+SP·초기레벨 기술 보정·동일 처리 연쇄 습득은 작성자가 제안한 검토안이다. 사용자가 이미 채택했다고 기록하지 않는다. 독립 builder check와 실제 문서 검사 결과는 `qa/character-design/`에 둔다.
