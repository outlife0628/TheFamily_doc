# The Family — 이동 UI HTML 목업

상태: 실행 가능한 형식의 HTML/CSS/JavaScript 작성 및 코드 검사 완료. 현재 Codex 실행 환경에서는 브라우저 렌더러가 시작되지 않아 실제 화면·브라우저 동작 검수는 미완료다. 사용자 최종 검토 전이다.

## 실행

PowerShell에서 프로젝트 루트로 이동해 실행한다. 설치는 필요하지 않다.

```powershell
Set-Location 'D:\BG\TheFamily_doc'
python -B -m http.server 8080 --bind 127.0.0.1 --directory prototype/movement
```

Chrome 또는 Edge에서 **http://127.0.0.1:8080/** 을 연다. `index.html`을 file URL로 직접 열면 모듈/JSON 보안 제한이 있으므로 HTTP 서버를 사용한다. 종료는 서버 터미널에서 Ctrl+C. 다른 서비스가 8080을 사용하면 포트만 변경한다.

## 검토 동선

필드의 M/월드맵 → 인간 도시 선택 → 마차/기간/운임/화물 확인 → 출발 준비 → 취소로 무변경 확인 → 다시 출발 준비·출발 확정 → 1일 진행 → 정차·현장 확인 → J로 여정 복귀 → 여정 재개 → 1일씩 진행 → 도착·현지로 이동.

도보를 선택하면 시험 화물 적재 초과, 엘프 도시를 선택하면 공개 통행 중단, 항만을 선택하면 수단 부적합/비공정 미보유 사유를 확인한다. 도착 후에는 시드리아를 선택해 역방향 여정을 검토할 수 있다. 직접 연결이 없는 두 목적지 사이의 이동은 거절한다.

WASD/방향키 이동, Shift 걷기, E/Enter로 가까운 표식 상호작용, M 월드맵, J 여정, Esc 이전/모달 취소. 지도는 드래그·휠·도구 버튼·+/−, Shift+방향키로 표시 이동. 목록은 위/아래·Tab·Enter/Space. 1920×1080 기준 글씨 100% 프로필이며 작은 창에서는 전체 화면을 비율 맞춰 표시한다.

## 범위

실제 HTML 버튼·텍스트·목록·선택·SVG 표식/노선과 상태 모델이 연결되어 있다. 월드맵 PNG만 사용자 원본 사본이다. 필드는 자체 Canvas 간이 공간 및 픽셀 인물이며 Godot 3D 출력은 아니다.

도시 배치·노선·운임·기간·적재·스프라이트는 시험 데이터다. 크리스·브람 하르트·엘리아나 베일·올리버 크로포드 4명을 시연하며 정원은 8명을 유지한다. 운임은 출발 확정 시 한 번 지급하는 시험 정책이며, 여정은 명시적으로 시간을 진행한다. 화물은 도착 후에도 유지하고 자동 판매·귀환·보상은 없다.

상태는 탭 메모리에만 있다. 새로고침은 시험 초기화다. Map Tool·Godot·Hera, 실제 저장·물리·전투·경제·다중 파티·게임패드는 미연동/미검증이다.

## 검사 명령

프로젝트 루트에서:

```powershell
node --test prototype/movement/tests/*.test.mjs
node qa/movement/check-preservation.mjs
node qa/movement/check-http.mjs
node qa/movement/browser-check.mjs
```

HTTP/브라우저 검사는 서버가 켜져 있어야 한다. 브라우저 검사는 설치된 Chrome을 임시 별도 프로필로 실행한다. 사용자 프로필·브라우저 설정은 수정하지 않는다. Edge를 사용하려면 현재 터미널에서만 `FAMILY_BROWSER_EXE`를 지정한다. 포트를 바꾸었으면 `FAMILY_PREVIEW_URL`을 지정한다.

```powershell
$env:FAMILY_BROWSER_EXE = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
node qa/movement/browser-check.mjs
```

브라우저 검사가 성공하면 `qa/movement/screenshots/`에 1920×1080 실제 실행 PNG가 생성된다. 현재는 0장이다. 결과는 [검수 보고서](../../qa/movement/REPORT.md)를 따른다. 현행 제작 기준의 진입점은 [docs/README.md](../../docs/README.md)다.
