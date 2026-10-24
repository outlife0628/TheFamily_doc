# The Family — 승인 에셋 적용 HTML

현재 실행본은 [prototype/movement-assets-v2/index.html](prototype/movement-assets-v2/index.html)이다. 승인받은 UI PNG 8종을 실제 HTML/CSS/JavaScript 이동 목업에 적용했다. SYS-02 사용자 검토 단계이며 화면 검수는 완료되지 않았다.

```powershell
Set-Location 'D:\BG\TheFamily_doc'
python -B -m http.server 8081 --bind 127.0.0.1 --directory prototype/movement-assets-v2
```

브라우저에서 **http://127.0.0.1:8081/** 을 연다. 서버 종료는 Ctrl+C. 별도 설치는 없다.

- [실행·조작 안내](prototype/movement-assets-v2/README.md)
- [현재 상태·문서 진입점](docs/movement-assets-v2/README.md)
- [UI 제작 기준과 에셋 적용표](docs/movement-assets-v2/UI_Production_Guidelines.md)
- [SYS-02 목업 명세](docs/movement-assets-v2/Movement_System_UI.md)
- [수행한 검사·미검증 항목](qa/movement-assets-v2/REPORT.md)

기존 파일의 덮어쓰기 금지에 따라 이전 실행본·문서·승인 전 에셋 검토 자료는 그대로 보존했다. 위 링크가 승인 에셋 적용 실행본의 기준이다. `prototype/movement/`는 이번 검토 대상 실행 경로가 아니다.
