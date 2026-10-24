# The Family — 다음 작업 진입점

현재 상태: SYS-02 이동 HTML 작업 및 개별 확인한 SYS-03 정책은 사용자 승인됨. 현재 작업은 **결정 사항을 반영한 SYS-03 통합 설계 재검토**다.

| 항목 | 현재 기준 |
|---|---|
| 승인된 이동 실행본 | `prototype/movement-assets-v2/index.html` |
| 승인된 UI | 종이/짙은 면/앤티크 골드 에셋, 1920×1080·글씨100% 단일, 공용 행동 슬롯 |
| 이번 디자인 범위 | 스탯·레벨/성장·HP/SP와 별도로 스프라이트/아이콘/초상·애니메이션·로딩/저장 테이블 포함 |
| 승인된 성장 | 개인 레벨+인물별 성장표+레벨/사건 기술 습득의 A형. 재선택 요청 없음 |
| 승인된 핵심 규칙 | 6기본 스탯·HP/SP·전투 후 보존·레벨업 전량 회복·HP0 승리 XP 제외/부활 후 활동·부활 외 아이템 불가 |
| 승인된 XP/레벨 | 공통 필요XP 표/인물별 스탯 성장·참가자별 고정 전투 XP·제외 몫 재분배 없음·모든 시스템의 XP 제공·Lv100 이후도 XP 누적 저장·캐릭터별 지정 초기 레벨/재합류 유지 |
| 승인된 기술 성장/표시 | 테이블의 레벨/사건 조건으로 자동 랭크 상승·합류 이후 조건 충족 시 같은 처리에서 연쇄 습득. 미습득 기술은 공개 전 숨김/공개 후 잠금 표시 |
| 승인된 초기/자원 규칙 | HP0 모든 XP 수령 제외·초기 기술/랭크/HP-SP는 테이블 그대로·레벨업 외 최대치 증가 시 현재량 유지/감소 시 제한·SP 실행 시작 차감/실행 전 취소 무소모/실행 후 게임 내 결과 환불 없음·부활 수단별 회복 규칙 |
| 승인된 캐릭터 표현 | 필드8방향·5원본/3좌우 반전·전용 초상/얼굴 영역 재사용·장비 교체 시 기본 외형·초상 표시320×400px. 구도는 아트 디자이너 결정. 실제 원화 미제작 |
| 남은 검토 | 승인 정책과 제안 테이블/저장/UI의 정합성·실제 곡선/계수/초기값·처리 알고리즘·아트 제작/실측/연동. 승인 항목은 재질문하지 않음 |
| 구현 상태 | SYS-03 디자인 초안 작성, 사용자 검토 대기. 게임·HTML·새 아트 미착수 |
| 남은 기술 검수 | 자동 브라우저 동선/실행 캡처, Godot·Hera·Map Tool 연동은 별도 |

- [현재 승인 상태와 다음 작업 경계](docs/next-stage/CURRENT_STATE.md)
- [SYS-03 캐릭터 시스템·UI 디자인](docs/character/03_Character_System_UI.md)
- [캐릭터 테이블 상세·수치 예제](docs/character/Character_Data_Tables.md)
- [스프라이트·아이콘·애니메이션 에셋 관리 테이블](docs/character/Character_Asset_Tables.md)
- [보강 항목과 검토 요청](docs/character/Character_Review_Request.md)
- [SYS-03 준비 자료·유지 기준](docs/next-stage/SYS03_Preparation.md)
- [승인 실행본 파일 해시 목록](qa/approvals/movement-assets-v2-2026-10-23.json)
- [이동 실행 방법](prototype/movement-assets-v2/README.md)
- [승인된 공용 UI 제작 기준](docs/movement-assets-v2/UI_Production_Guidelines.md)

사용자의 최신 지시와 [현재 적용 결정](CURRENT_DECISIONS.md)을 우선한다. 기존 상태 문서의 사용자 검토 대기 표기는 당시 자료로 보존하고, 현재 승인 상태는 위 현행 문서를 따른다. 이전 상태와 승인 기록은 [아카이브](archive/2026-10-23-movement-approval/APPROVAL.md)에 분리한다.
