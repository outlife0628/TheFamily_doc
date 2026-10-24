# The Family — Codex 인수인계 패키지

**작성일:** 2026-10-22  
**목적:** ChatGPT에서 정리한 프로젝트의 현재 기준과 자료를 로컬 Codex 작업에 전달한다.  
**이번에 생성한 것:** 인수인계 문서, 작업 지침, 시작 프롬프트, 기존 원문/이미지의 분류된 사본.  
**이번에 만들지 않은 것:** 새 HTML 목업, Godot 게임, NAS/Git 업로드, 실제 PC 설정.

## 시작

압축을 새 폴더에 풀고 **AGENTS.md가 있는 폴더**를 VS Code 또는 Codex의 로컬 프로젝트로 연다. 기존 저장소에 넣을 때는 동명 AGENTS.md와 문서를 덮어쓰지 말고 병합 계획부터 검토한다. 정확한 로컬 The Family 경로는 아직 전달받지 않았으므로 어떤 D: 경로도 실제 경로로 단정하지 않는다.

Codex에서 `prompts/01_Read_Only_Handoff.txt` 내용을 먼저 사용한다. 점검 보고를 확인하고 실행 범위를 승인한 뒤 `prompts/02_Movement_HTML_After_Review.txt`를 사용한다.

공식 IDE 안내는 프로젝트를 열고 Codex 사이드바에서 작업하는 흐름을 제공한다. Windows 네이티브 환경을 사용할 수 있고 WSL은 필수가 아니다. ChatGPT 계정 로그인 방식이 제공된다. 관련 공식 자료는 `reference/Codex_Official_Sources.md`에 정리했다.

AGENTS.md는 작업 지침이지 운영체제 권한 통제가 아니다. 최초 점검은 읽기 전용 권한으로 시작하고, 구현을 승인할 때 필요한 작업 폴더의 쓰기 권한만 허용하는 운영을 권고한다. 무제한 권한을 요구하지 않는다.

## 읽는 순서

| 자료 | 역할 |
|---|---|
| [CURRENT_STATE.md](CURRENT_STATE.md) | 실제 완료/미완료 상태 |
| [CURRENT_DECISIONS.md](CURRENT_DECISIONS.md) | 최신 사용자 결정 |
| [지침 갱신 범위](docs/UI_Guideline_Update_Scope.md) | 기존 문서와 아트의 충돌·수정 대상 |
| [이동 HTML 검수](docs/Movement_HTML_Acceptance.md) | 다음 구현의 완료 기준; 모두 미실행 |
| [진행 순서](docs/System_UI_Stage_Map.md) | 콘텐츠 단위의 단계별 승인 |
| [자료 색인](reference/REFERENCE_INDEX.md) | 원문/아트의 용도와 사용 범위 |

## 중요한 구분

단순화한 이동 아트 방향에 따른 HTML 제작 요청은 이미 있었다. 그러나 실제 새 HTML은 아직 없다. 포함된 생성 PNG는 실행 화면이 아니다. 구형 HTML과 예전 QA 성공 기록은 이 패키지에 포함하지 않았다.

원작 12개와 필요한 기본/이동 문서, 옛 UI 지침은 원문 보존 사본이다. 현재 정책으로 자동 승격하지 않으며 최신 결정·승인 범위를 적용한다. 특히 확대 글씨, 참조 게임 지명, 그림의 UI 배치는 충돌 점검 대상이다.

첫 작업은 읽기 전용 인수 확인이며 이후 단계는 사용자 검수·승인에 따라 진행한다. 기존 Godot/Hera/Map Tool·Git 환경을 이미 확인했다고 말하지 않는다.

## 무결성

`SOURCE_MANIFEST.json`은 원문 및 이미지 사본의 출처·용도·해시다. `PACKAGE_CHECKS.md`는 이 패키지의 파일/해시 검사만 기록한다. 게임이나 새 목업의 품질 검사 결과가 아니다.
