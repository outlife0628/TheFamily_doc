# The Family — 승인 에셋 적용 이동 HTML 목업

상태: 승인 PNG 8종 적용·실제 HTML/CSS/JavaScript 작성·코드 검사 완료. 브라우저 실행·시각 검수는 환경 제한으로 미완료다. 사용자 검토 전이다.

## 실행

PowerShell에서 프로젝트 루트로 이동해 실행한다. 설치는 필요하지 않다.

```powershell
Set-Location 'D:\BG\TheFamily_doc'
python -B -m http.server 8081 --bind 127.0.0.1 --directory prototype/movement-assets-v2
```

Chrome 또는 Edge에서 **http://127.0.0.1:8081/** 을 연다. `index.html`을 직접 열면 모듈/JSON 제한이 있으므로 HTTP 서버를 사용한다. 종료는 서버 터미널에서 Ctrl+C. 포트가 사용 중이면 8082 등으로 바꾼다. 주소는 `127.0.0.1`이다.

## 검토 동선

필드의 M/월드맵 → 인간 도시 선택 → 마차/기간/운임/화물 확인 → 출발 준비 → 취소로 무변경 확인 → 다시 출발 준비·출발 확정 → 1일 진행 → 정차·현장 확인 → J로 여정 복귀 → 여정 재개 → 1일씩 진행 → 도착·현지로 이동.

도보를 선택하면 시험 화물 적재 초과, 엘프 도시를 선택하면 공개 통행 중단, 항만을 선택하면 수단 부적합/비공정 미보유 사유를 확인한다. 도착 후에는 시드리아를 선택해 역방향 여정을 검토할 수 있다. 직접 연결이 없는 두 목적지 사이의 이동은 거절한다.

WASD/방향키 이동, Shift 걷기, E/Enter로 가까운 표식 상호작용, M 월드맵, J 여정, Esc 이전/모달 취소. 지도는 드래그·휠·도구 버튼·+/−, Shift+방향키로 표시 이동. 목록은 위/아래·Tab·Enter/Space. 1920×1080 기준 글씨 100% 프로필이며 작은 창에서는 전체 화면을 비율 맞춰 표시한다.

## 범위

승인된 금색/먹색 버튼·종이/어두운 패널·확인창·원형 미니맵 프레임·목표 카드·B 나침반 PNG를 실제 공용 UI에 적용했다. `assets/ui/`의 원본 픽셀을 보존하고 `assets/skins/`의 SVG 표시 뷰포트와 CSS 9분할로 여백·모서리를 처리한다. `build-skins.mjs`는 설치 없이 Node 기본 기능으로 표시용 SVG를 재생성하는 개발 도구이며, 실행 시 재빌드는 필요하지 않다.

버튼·텍스트·목록·상세·선택·SVG 표식/노선은 실제 UI이며 상태 모델에 연결되어 있다. 월드맵 PNG는 사용자 원본의 동일 사본이다. 필드 배경·픽셀 인물·여정 풍경은 자체 간이 시험 표현이며 시안의 배경 일러스트나 Godot 3D 출력은 아니다.

도시 배치·노선·운임·기간·적재·스프라이트는 시험 데이터다. 크리스·브람 하르트·엘리아나 베일·올리버 크로포드 4명을 시연하며 정원은 8명을 유지한다. 운임은 출발 확정 시 한 번 지급하는 시험 정책이며, 여정은 명시적으로 시간을 진행한다. 화물은 도착 후에도 유지하고 자동 판매·귀환·보상은 없다.

상태는 탭 메모리에만 있다. 새로고침은 시험 초기화다. Map Tool·Godot·Hera, 실제 저장·물리·전투·경제·다중 파티·게임패드는 미연동/미검증이다.

## 검사 명령

프로젝트 루트에서:

```powershell
node --test prototype/movement-assets-v2/tests/*.test.mjs
node qa/movement-assets-v2/verify-resources.mjs
node qa/movement-assets-v2/browser-check.mjs
```

서버를 켜고 다른 PowerShell에서 프로젝트 루트를 기준으로 실행한다. 브라우저 검사는 설치된 Chrome을 임시 별도 프로필로 실행하고 실제 포인터/키 입력을 사용한다. 사용자 프로필·브라우저 설정은 수정하지 않는다. Edge를 사용하려면 현재 터미널에서만 아래를 지정한다. 포트를 바꿨다면 `FAMILY_PREVIEW_URL`에 실제 주소를 지정한다.

```powershell
$env:FAMILY_BROWSER_EXE = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$env:FAMILY_QA_RUN = 'edge'
node qa/movement-assets-v2/browser-check.mjs
```

브라우저 검사가 정상 완료되면 `qa/movement-assets-v2/chrome/screenshots/` 또는 `edge/screenshots/`에 필드·월드맵·확인창·여정·정차·정차 현장·도착·과적의 실제 실행 PNG 8장이 저장된다. 현재 확보한 캡처는 0장이다. 자동 실행에서는 Chrome/Edge 모두 렌더러가 생성되지 않아 페이지 연결 단계에서 실패했다. node_repl/CUA도 sandbox helper 누락으로 실행되지 않았다. 코드 검사를 실제 브라우저·아트 검수의 통과로 간주하지 않는다.

현재 제작 기준은 [현행 문서](../../docs/movement-assets-v2/README.md), 실제 수행 결과는 [검수 보고서](../../qa/movement-assets-v2/REPORT.md)를 따른다. 사용자 검토 후까지 다음 시스템은 대기한다.
