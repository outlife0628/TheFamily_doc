# SYS-03 — 캐릭터 게임 에셋 관리 테이블

**상태:** 검토 초안 Ver0.1. 스프라이트·아이콘·초상·애니메이션의 정의/연결/로딩 설계이며 실제 에셋 제작·엔진 구현 완료본이 아니다.  
**연결:** [캐릭터 시스템·UI](03_Character_System_UI.md) · [능력/성장/HP·SP 테이블](Character_Data_Tables.md) · [재검토 요청](Character_Review_Request.md).

HP/SP 같은 **게임플레이 자원**과 PNG·아틀라스 같은 **표현 에셋 자원**은 다른 테이블과 수명으로 관리한다. 성장 방식은 승인된 A형을 유지한다. 이하 에셋 테이블과 표현/로딩 정책은 이번에 추가한 제안이다.

## 1. 적용 범위와 관리 원칙

- 유지: 실제 배경은3D 맵, 인물은2D 픽셀 스프라이트다. 스프라이트 이미지의 좌표/크기를 이동 좌표·충돌·파티 정원으로 사용하지 않는다.
- 인물 정의에는 안정적인 `visual_profile_id`를 연결한다. 이미지 경로나 프레임 번호를 인물/기술 코드에 직접 적지 않는다.
- 논리 에셋ID와 실제 파일 리비전을 분리한다. 그림 교체가 캐릭터ID·XP·현재HP/SP·습득 기술을 새로 생성하거나 초기화하지 않는다.
- 스프라이트 시트, 단독 아이콘, 초상도 같은 파일 등록 원칙을 쓰며 실제 표시 영역은 `AssetRegion`으로 참조한다. UI 이미지의 글자/수치는 실제 UI로 유지한다.
- 등장 인물의 외형·방향 수·애니메이션 수·크기·표현 배율은 검토할 데이터다.4/8방향이나 특정 캐릭터 해상도를 이번 테이블 설계만으로 확정하지 않는다.
- 이동 목업의 간이 스프라이트/코트색과 기존 생성 보드의 다른 인물은 정식 캐릭터 에셋으로 등록하지 않는다. 승인 공용 UI 에셋도 캐릭터 몸체/초상 승인으로 전용하지 않는다.

## 2. 파일과 논리 리소스 등록

ID/KEY/REF/null 표기는 [기본 테이블 형식](Character_Data_Tables.md)을 따른다. `SIZE`는 양의 정수, `PX`는 정수 픽셀 좌표, `POSITIVE`는 유한한 양수다. 사각형 원점은 파일의 좌상단이며 오른쪽/아래로 증가한다. 필드에 `?`가 있으면null을 허용하되 정식 준비 조건을 별도로 검사한다.

| 테이블 | 주키 | 필드 | 참조·검사 |
|---|---|---|---|
| `AssetDefinition` | `asset_id:ID` | `kind:texture2d/atlas_texture`, `description_key:KEY`, `source_ref:REF?` | 파일 이름과 독립적인 논리ID. 같은ID의 kind를 리비전마다 바꾸지 않음. source_ref는 업로드/직접 제작/생성 기록을 식별 |
| `AssetRevision` | `(asset_id:ID,revision:SIZE)` | `file_relpath:string?`, `content_sha256:string?`, `width_px:SIZE?`, `height_px:SIZE?`, `byte_size:INT0?`, `format:png/webp`, `import_profile_id:ID`, `review_state:draft/review/approved/retired`, `approval_ref:REF?` | 정의/임포트 프로필 참조. approved는 실제 파일·해시·관측 치수/크기·승인 근거가 필수. 초안의 미납품 값은null로 보존하며0/가짜 해시를 채우지 않음 |
| `AssetImportProfile` | `import_profile_id:ID` | `filter:nearest/linear`, `mipmaps:on/off`, `compression:lossless`, `alpha_mode:straight/premultiplied`, `color_space:srgb/linear`, `wrap:clamp`, `purpose:pixel_world/pixel_ui/painted_ui` | 같은 파일을 서로 다른 설정으로 처리하려면 명시적인 별도 리비전/산출물을 사용. 실제 엔진 옵션으로 변환하는 어댑터는 구현 단계에서 확인 |
| `AssetRegion` | `region_id:ID` | `asset_id:ID`, `revision:SIZE`, `x_px:PX`, `y_px:PX`, `w_px:SIZE`, `h_px:SIZE`, `canvas_w_px:SIZE`, `canvas_h_px:SIZE`, `trim_x_px:PX`, `trim_y_px:PX`, `rotation:none` | 파일 리비전의 완전한 복합FK. 좌표≥0, x+w≤파일폭/y+h≤파일높이. trim≥0, trim+w/h가 원래canvas 이내. 단독 파일은 전체 영역도 허용 |

파일 경로는 허용된 프로젝트 리소스 루트 기준 상대 경로다. 절대 경로·`..`·네트워크URL을 런타임 경로로 받지 않는다. 대소문자를 정확하게 검사하며 표시명/인물명으로 파일을 찾지 않는다. 실제 경로가 바뀌면 새 리비전과 정의 세트에서 대응을 갱신한다. 기존 리비전의 내용/해시는 조용히 교체하지 않는다.

**임포트 권고안:** 픽셀 몸체와 픽셀 아이콘은 nearest·lossless·clamp·straight alpha를 출발점으로 한다. 픽셀UI의 mipmap은off,3D 픽셀 몸체도off를 검토 시작값으로 두되 실제 카메라 거리에서 떨림/가림/원근 축소를 확인해 조정한다. 종이/그림 초상에는 별도 painted_ui 프로필을 사용한다. 이 값들은 엔진 적용/품질 검수 완료를 뜻하지 않는다.

`AssetRegion`은 패킹 좌표의 단일 원본이다. 규칙적인 시트의 행/열/셀 크기로 작성 도구에서 영역을 계산할 수 있으나 런타임에서 셀 계산과 rect를 따로 적용하지 않는다. trim은 투명 여백을 제외한 영역을 원래 프레임 캔버스 어디에 그릴지 뜻한다. 실제 캐릭터/무기 픽셀을 자르는 의미가 아니다. 기본안에서는 회전 패킹을 허용하지 않는다.

## 3. 인물·외형·용도 연결

| 테이블 | 주키 | 필드 | 참조·검사 |
|---|---|---|---|
| `CharacterVisualProfile` | `visual_profile_id:ID` | `sprite_canvas_w_px:SIZE`, `sprite_canvas_h_px:SIZE`, `pivot_x_px:PX`, `pivot_y_px:PX`, `pixels_per_display_unit:POSITIVE`, `description_key:KEY` | 몸체의 원래 캔버스·발 기준점·표현 배율. pivot은canvas 안. 사용하는 외형에는base가 반드시 존재. 배율을 충돌/이동 속도와 공유하지 않음 |
| `CharacterAppearance` | `(visual_profile_id:ID,appearance_key:ID)` | `condition_ref:REF?`, `description_key:KEY?` | 프로필FK. base는 최초 기본 외형이며condition=null. 추가 외형은 승인된 등장/표현 조건을 사용. 성장 레벨이나 장비 변경으로 자동 추가하지 않음 |
| `CharacterAssetBinding` | `(visual_profile_id:ID,appearance_key:ID,use_slot:enum,variant_key:ID)` | `animation_set_id:ID?`, `region_id:ID?` | 외형 복합FK. 몸체 슬롯은AnimationSet만, 이미지 슬롯은AssetRegion만 참조하는 배타적FK. 사용 목적·외형·표현 변형을 명시 |

기본 슬롯은 `field_body`, `battle_body`, `menu_icon`, `portrait`, `field_shadow`를 제안한다. field/battle 몸체는애니메이션 세트, 나머지는영역이다. 몸체/메뉴 아이콘/그림자는variant_key=default를 사용한다. portrait는default와 추가 표정 키를 지원하되 표정 종류/실제 아트는 개별 검토한다. 이 스키마로 상점·유료 스킨·플레이어 자유 변경 기능을 새로 도입하지 않는다.

CharacterDefinition→CharacterVisualProfile→선택한CharacterAppearance→용도/표현별CharacterAssetBinding→AnimationSet 또는AssetRegion→AssetRevision 순서로 해석한다. 같은 인물의 전투 몸체와 필드 몸체는 별도 슬롯으로 연결한다. 전투 리소스는SYS-05에서 해당 컨텍스트를 활성화할 때 요구한다. 현재 필드 설계만으로 공격/승리/피격 애니메이션 전체를 확정하지 않는다.

프로필 공유가 의도된 용병 템플릿은 같은 표현 리소스를 재사용할 수 있다. 실제 용병 개체의HP/SP는 별개다. 잘못된 사람의 그림이 연결됐는지, 무기 손잡이가 맞는지는 키 검사만으로 판정할 수 없으므로 인물별 시각 검수로 확인한다.

### 기존 게임 데이터 테이블과 연결할 필드

| 기존 테이블/객체 | 추가/연결 필드 | 규칙 |
|---|---|---|
| `CharacterDefinition` | `visual_profile_id:ID?` | 실제 표시할 인물의 활성 컨텍스트에 필요한 프로필 필수. 초안에서null이면 미준비이며 형식상 누락을 정식 준비 완료로 보지 않음 |
| `SkillDefinition` | `icon_region_id:ID?` | 에셋 영역FK. 공개된 기술만 실제 UI에 표시하며 잠긴/미공개 기술을 아이콘으로 누설하지 않음 |
| `ResourceDefinition` | `icon_region_id:ID?` | HP/SP 자원 아이콘 영역FK. resource_id/current_value 대신 PNG를 저장하지 않음 |
| `RoleDefinition` | `icon_region_id:ID?` | 업무 자격 아이콘 영역FK. 아이콘 유무가 역할 자격 판정을 바꾸지 않음 |
| SYS-05 상태효과 정의 | `icon_region_id` 참조 계약 | 실제 상태 목록/효과 정의는SYS-05 소유. 아이콘을 위해 캐릭터 문서에 별도의 상태효과 원본을 만들지 않음 |

기술/자원/역할 아이콘을 재사용할 수 있으며 이때도 하나의region_id로 연결한다. 몸체를 필드 아이콘으로 임의 축소하거나 캐릭터 메뉴 아이콘을 대화 초상으로 무조건 대체하지 않는다.

**정의 아이콘의 로딩 루트:** 기술/HP·SP/역할 아이콘은 인물 외형 바인딩을 거치지 않는다. `SkillDefinition/ResourceDefinition/RoleDefinition.icon_region_id`에서 직접AssetRegion→AssetRevision을 참조하는 별도 루트다. 화면이 실제로 표시할 공개된 정의ID를 `definition_icon_requests[{owner_kind:skill/resource/role,owner_id}]`로 전달하고 로더가 등록된 정의에서 영역을 찾는다. 미등록ID/미공개 요청은 거절한다. 요청에 임의 파일 경로나 다른인물의영역을직접넣지않는다.

기술 아이콘과HP/SP 아이콘은 해당 UI가 활성화된 정식 묶음에서 필수 연결로 제안한다. 역할 아이콘은 선택 연결이며없으면역할명텍스트로표시한다. null을허용한필드형식과컨텍스트의필수연결여부는별개다. 바인딩은필수여도런타임파일읽기실패시이름/수치텍스트를남길수있으며,그상태를아트검수통과로표시하지않는다.

## 4. 스프라이트 애니메이션과 방향

| 테이블 | 주키 | 필드 | 참조·검사 |
|---|---|---|---|
| `AnimationSet` | `animation_set_id:ID` | `visual_profile_id:ID`, `context_key:ID`, `direction_keys:[ID]`, `default_semantic:ID` | 프로필FK. 실제로 제공하는 방향 집합과field/battle 구분.4/8방향의 최종 선택은 해당 카메라/이동 문맥에서 승인 |
| `AnimationClip` | `clip_id:ID` | `animation_set_id:ID`, `semantic_key:ID`, `direction_key:ID`, `loop:bool`, `allow_mirror_x:bool` | 세트FK,방향은세트의키. `(set,semantic,direction)`도유일.기본 필드의idle/move는제안.애니메이션 이름을 게임 규칙 판정으로 사용하지 않음 |
| `AnimationFrame` | `(clip_id:ID,frame_index:INT0)` | `region_id:ID`, `duration_ms:SIZE` | 클립/영역FK.인덱스0부터연속·프레임≥1·시간>0.몸체의canvas크기는프로필과일치.프레임별trim을같은pivot에적용 |
| `AnimationMirrorRule` | `(animation_set_id:ID,semantic_key:ID,target_direction_key:ID)` | `source_clip_id:ID`, `flip_x:true` | 선택 테이블. 같은세트/동작의실제클립만참조,source.allow_mirror_x=true필수.반대좌우짝만허용·재귀/연쇄미러금지.같은대상실제클립과동시정의금지 |

방향 키는 카메라에 대한 `front/right/back/left`와 필요한 대각선처럼 표현 방향으로 정의한다. 월드좌표북쪽을front로 고정하지 않는다. SYS-02/05가 카메라/이동 평면을 기준으로 표현 방향을 공급하고, 아트 테이블은 해당 키의 프레임을 선택한다. 의미 방향을 선택했다고 실제 인물의 이동 위치/충돌/시선 소유 상태를 변경하지 않는다.

미러링은 기본false다. 좌우 비대칭 무기/방패·장식이 있는 브람 등의 프레임을 자동 반전하지 않는다. 허용 좌우짝은left/right,front_left/front_right,back_left/back_right이며 앞/뒤를 가로 반전해 대체하지 않는다. 각 컨텍스트의 필수 방향/동작이 실제클립 또는 명시미러로 모두 충족돼야 한다.

발 위치는 프로필의 원래 캔버스pivot을 사용한다. trim된 프레임을 그리는 시작점은 `trim_offset - pivot`을 같은표현 배율로 환산한다. 애니메이션마다 불투명 픽셀 경계의 하단을 새로 발 위치로 계산하지 않는다. 스프라이트 경계가 커졌다는 이유로 충돌체가 커지거나 캐릭터가 떠오르면 안 된다.

프레임 시간은 시각 재생 시간이다. 프레임 전환이 XP·HP/SP·명중·피해·전투행동 확정 시점의 유일한 원본이 되어서는 안 된다. 논리 시간이 정지한 상태에서 시각 연출이 이어지더라도 보상/소비/상태 지속시간을 진행하지 않는다. 실제 애니메이션과 전투행동의 동기화는SYS-05 연결 검수 대상이다.

## 5. 컨텍스트별 필수 항목·대체 정책

| 테이블 | 주키 | 필드 | 의미 |
|---|---|---|---|
| `AssetSlotPolicy` | `(context_key:ID,use_slot:enum)` | `required_binding:bool`, `load_gate:blocking/nonblocking`, `failure_mode:block/text_only/hide_optional`, `required_semantics:[ID]`, `required_directions:[ID]?` | 인물5종슬롯외에skill_icon/resource_icon/role_icon포함.정의아이콘은외형바인딩없이정의FK에서해석.몸체의필수방향이미정이면정식출력을막음 |
| `AssetLoadGroup` | `load_group_id:ID` | `context_key:ID`, `cache_scope:context`, `release_policy:reference_counted` | 인물/외형바인딩과현재표시정의의아이콘을함께루트로해석.필수/대체정책은SlotPolicy가원본.파일목록을별도수작업으로중복작성하지않음 |

| 컨텍스트 예 | 슬롯 | 바인딩 필수 | 런타임 로딩/실패 | 준비 조건 |
|---|---|---|---|---|
| 플레이어 필드 | field_body | 예 | blocking·실패 시진입/표현 완료를보류하고재시도/복귀 | idle/move와최종승인방향전부.방향수미정은생산준비미완료 |
| 인물 메뉴 | menu_icon | 예 | nonblocking·실패 시이름/설명텍스트유지·오류기록 | 올바른영역/승인파일필수.텍스트대체를아트검수통과로보지않음 |
| 기술 UI | skill_icon | 예 | nonblocking·실패 시기술이름/비용유지·오류기록 | SkillDefinition.icon_region_id에서직접해석.미공개기술은런타임요청대상제외 |
| 자원 UI | resource_icon | 예 | nonblocking·실패 시HP/SP이름/수치유지·오류기록 | ResourceDefinition.icon_region_id필수.현재량과분리 |
| 역할 UI | role_icon | 선택 | nonblocking·없으면역할명텍스트 | RoleDefinition.icon_region_id가있을때만추가루트수집 |
| 대화/필요 메뉴 | portrait | 선택 | nonblocking·실패/미정이면이름텍스트·초상영역생략 | 해당인물/공개문맥의허용된초상만사용 |
| 필드 그림자 | field_shadow | 선택 | nonblocking·없으면생략 | 이동/충돌판정을대체하지않음 |
| 전투 | battle_body | 활성화 후필수 | blocking | SYS-05가요구할방향/동작명세수령후검사 |

`required_binding`은 빌드할 데이터에 필수 연결이 있어야 한다는 뜻이다. `load_gate`는 실제 파일을 읽는 동안 화면/현장 진입을 기다릴지를 뜻한다. nonblocking 아이콘의 필수 바인딩이 빠져도 좋다는 의미가 아니다. 선택 슬롯은 현재 화면이 실제로 요청하고 공개 가능한 경우에만 로딩한다.

`CharacterAssetBinding`의use_slot은인물5종만허용한다. skill_icon/resource_icon/role_icon은SlotPolicy와요청해석의분류이지인물외형테이블에중복행을쓰는것이아니다. 컨텍스트에사용할슬롯의정책행이없으면암묵적선택항목으로처리하지않고설정오류로거절한다.

미공개 초상의 힌트는 이름/아이콘/대체 이미지에서도 숨긴다. 미지정 표정은 같은인물·같은외형의default 초상으로만 대체할 수 있고 그외형의default도 없으면텍스트로남긴다. 임의의다른인물/다른외형을가져오지않는다. 미등록외형키의자동base복구는하지않으며버전이관/명시수정을요청한다.

## 6. 내보내기·캐시·해제와 저장

| 산출물/런타임 상태 | 키 | 필드/규칙 | 저장 여부 |
|---|---|---|---|
| `AssetManifestEntry` | `(definition_set_id,load_group_id,asset_id,revision)` | 인물바인딩→클립/영역 및기술/자원/역할정의→아이콘영역의양쪽루트에서산출.리비전/경로/해시/임포트는AssetRevision과일치.동일텍스처는그룹내1행 | 빌드산출물.기획자가별도목록을수작업수정하지않음 |
| `ResidentAssetState` | `(asset_id,revision)` | unloaded/loading/ready/failed,참조수,로드작업토큰.여러프레임/인물이같은파일을써도한번로드 | 세이브에저장안함 |
| `PresentationLease` | `lease_id` | context_token,정의세트ID,획득한리비전집합.이미해제한lease재해제는아무것도차감하지않음 | 세이브에저장안함 |
| `ActorPresentationState` | `actor_id` | `appearance_key:ID`.개체의인물정의가가리키는프로필과외형복합키검사.현재기본안은base | 승인된외형상태만저장.캐릭터성장상태와독립 |

같은정의세트에서같은에셋ID의리비전선택은고정한다. AssetRegion/프레임이서로다른리비전을조용히`latest`로치환하지않는다. 패키지갱신은새정의세트/리비전으로검증하고,연결중인프로필/애니메이션을일부만교체하지않는다.

**빌드와런타임루트구분:** 빌드는그정의세트에서활성화한콘텐츠/표현컨텍스트의인물·외형·기술·자원·역할정의전체를검사해가능한참조폐포를패키지manifest에넣는다. 게임초기에는미공개인기술/후반인물리소스도승인된활성콘텐츠라면빌드목록에서빠뜨리지않는다. 런타임은이중현재화면/현장에알려지고실제로표시하는인물슬롯/정의아이콘만요청한다. 패키지에포함됐다고UI에미공개정보를표시하거나메모리에전부올리지않는다. 초안/미납품행이정식활성콘텐츠의필수참조라면빌드를거절한다.

그룹진입은현재알려진인물·외형·요청슬롯을해석해필요한리비전마다참조를획득한다. 모든blocking항목준비후현장표시를완료한다. 메뉴닫기/현장전환은자신의lease만해제하고다른화면/인물이쓰는파일은유지한다. 참조0이면캐시정책에따라해제가능하다. 로딩중화면을닫으면뒤늦은완료콜백은만료context_token을확인하고새화면에이미지를꽂거나참조를되살리지않는다.

현재보이는파티/현장·열린메뉴의리소스만로딩하며8개파티전체의몸체/초상을무조건상주시킬필요는없다. 이는어느파티가활동하는지나일정/자동전투결과를바꾸는정책이아니다. 메모리예산은실제소스치수와측정으로정하고임의로성능통과를기록하지않는다. RGBA8의`폭×높이×4`는기본화소버퍼추정이며GPU/복사본/mipmap/엔진오버헤드를포함하지않는다.

세이브에는정의세트버전·개체ID·승인된외형키만표현식별자로남긴다. PNG절대경로·디코드핸들·캐시참조수·프레임커서를캐릭터영구상태로저장하지않는다. 로드는논리성장/자원복원후표현리소스를재해석한다. 파일누락/로드실패는표현준비오류이며HP/SP/XP/파티를초기화하거나날짜를진행시키지않는다.

## 7. 필수 검증과 기획자 작업

| ID | 검증 | 오류/기대 처리 |
|---|---|---|
| AS-01 | PK/FK·등록리비전·정확한파일경로/해시/치수·승인상태 | 잘못된시트/행/키/필드를알리고정식출력거절.미납품행은준비미완료 |
| AS-02 | region범위/크기/trim/canvas·금지회전 | 파일밖영역·바닥축이흔들리는캔버스불일치거절 |
| AS-03 | 인물→프로필→외형→용도→바인딩종류 | 몸체에아이콘/다른프로필의애니메이션세트연결거절 |
| AS-04 | 클립키중복·프레임연속/양의시간·필수방향/동작 | 누락idle/move·정식방향미정·빈클립/0ms거절 |
| AS-05 | 명시미러/허가/좌우짝·중복대상·연쇄 | 허가없는무기반전·앞/뒤대체·미러재귀거절 |
| AS-06 | 필수바인딩과blocking/선택대체정책 | 필수몸체실패를투명/다른인물그림으로숨기지않음 |
| AS-07 | 캐시/lease·동일파일공유·화면닫기/지연완료 | 반복해제로참조수음수금지·공유파일조기해제/지연그림덮기금지 |
| AS-08 | 정의세트/리비전·저장외형키 | 미등록외형/삭제ID를다른모습으로조용히바꾸지않음 |
| AS-09 | 공개조건·미등록표정·텍스트대체 | 미래인물/다른외형초상노출금지·아트오류는미검수로기록 |
| AS-10 | 자원/스탯과독립·실제시각품질 | 에셋교체/프레임진행으로XP/HP/SP/이동/날짜변화없음.인물외형/발고정/가림/가독성은실제시각검수 |
| AS-11 | 정의아이콘의직접루트·필수/선택·공개필터 | 기술/HP-SP아이콘의필수null거절·선택역할아이콘의텍스트허용·정의아이콘의패키지누락/미공개런타임요청방지 |

기획자는인물/프로필·슬롯을먼저등록하고아티스트가제공한파일/리비전·영역·클립/프레임을연결한다. 검사도구는미납품/검토/승인상태,프로필별누락슬롯/방향,프레임미리보기와바닥기준점,영역크기와예상디코드크기를표시할수있어야한다. 이도구요구를이번에구현했다는뜻은아니다.

## 8. 문서 검사용 에셋 메타데이터 예제

아래는**합성 메타데이터 fixture**다. 실제 PNG·초상·스프라이트를제공/생성한것이아니다. width/height는가정한시험치수이고file_relpath/sha/approval은null이다. 구조·영역·참조·누락검사의예제는가능하지만**정식파일/승인검사는실패해야한다**. 단일front방향은예제를줄이기위한것이며정식4/8방향선택이아니다. 실제테이블정의는위스키마가원본이고축소fixture가생산JSON형식인것은아니다.

```json
{
  "fixture_only": true,
  "physical_files_provided": false,
  "asset_definitions": [
    { "asset_id": "review.chris.body", "kind": "atlas_texture" },
    { "asset_id": "review.chris.ui", "kind": "atlas_texture" }
  ],
  "import_profiles": [
    { "import_profile_id": "review.pixel_world", "filter": "nearest", "mipmaps": "off", "compression": "lossless" },
    { "import_profile_id": "review.pixel_ui", "filter": "nearest", "mipmaps": "off", "compression": "lossless" }
  ],
  "asset_revisions": [
    { "asset_id": "review.chris.body", "revision": 1, "width_px": 96, "height_px": 48, "file_relpath": null, "content_sha256": null, "review_state": "review", "approval_ref": null, "import_profile_id": "review.pixel_world" },
    { "asset_id": "review.chris.ui", "revision": 1, "width_px": 128, "height_px": 64, "file_relpath": null, "content_sha256": null, "review_state": "review", "approval_ref": null, "import_profile_id": "review.pixel_ui" }
  ],
  "regions": [
    { "region_id": "review.body.idle", "asset_id": "review.chris.body", "revision": 1, "rect": [0,0,32,48], "canvas": [32,48], "trim": [0,0] },
    { "region_id": "review.body.move0", "asset_id": "review.chris.body", "revision": 1, "rect": [32,0,32,48], "canvas": [32,48], "trim": [0,0] },
    { "region_id": "review.body.move1", "asset_id": "review.chris.body", "revision": 1, "rect": [64,0,32,48], "canvas": [32,48], "trim": [0,0] },
    { "region_id": "review.ui.icon", "asset_id": "review.chris.ui", "revision": 1, "rect": [0,0,32,32], "canvas": [32,32], "trim": [0,0] },
    { "region_id": "review.ui.skill", "asset_id": "review.chris.ui", "revision": 1, "rect": [32,0,32,32], "canvas": [32,32], "trim": [0,0] },
    { "region_id": "review.ui.hp", "asset_id": "review.chris.ui", "revision": 1, "rect": [0,32,32,32], "canvas": [32,32], "trim": [0,0] },
    { "region_id": "review.ui.portrait", "asset_id": "review.chris.ui", "revision": 1, "rect": [64,0,64,64], "canvas": [64,64], "trim": [0,0] }
  ],
  "character_binding": { "character_id": "chris", "visual_profile_id": "review.chris.visual" },
  "visual_profiles": [
    { "visual_profile_id": "review.chris.visual", "canvas": [32,48], "pivot": [16,46], "pixels_per_display_unit": 48 }
  ],
  "appearances": [
    { "visual_profile_id": "review.chris.visual", "appearance_key": "base" }
  ],
  "bindings": [
    { "visual_profile_id": "review.chris.visual", "appearance_key": "base", "use_slot": "field_body", "variant_key": "default", "animation_set_id": "review.chris.field", "region_id": null },
    { "visual_profile_id": "review.chris.visual", "appearance_key": "base", "use_slot": "menu_icon", "variant_key": "default", "animation_set_id": null, "region_id": "review.ui.icon" },
    { "visual_profile_id": "review.chris.visual", "appearance_key": "base", "use_slot": "portrait", "variant_key": "default", "animation_set_id": null, "region_id": "review.ui.portrait" }
  ],
  "animation_sets": [
    { "animation_set_id": "review.chris.field", "visual_profile_id": "review.chris.visual", "context_key": "review.field", "direction_keys": ["front"], "default_semantic": "idle" }
  ],
  "clips": [
    { "clip_id": "review.idle.front", "animation_set_id": "review.chris.field", "semantic_key": "idle", "direction_key": "front", "loop": true, "allow_mirror_x": false },
    { "clip_id": "review.move.front", "animation_set_id": "review.chris.field", "semantic_key": "move", "direction_key": "front", "loop": true, "allow_mirror_x": false }
  ],
  "frames": [
    { "clip_id": "review.idle.front", "frame_index": 0, "region_id": "review.body.idle", "duration_ms": 400 },
    { "clip_id": "review.move.front", "frame_index": 0, "region_id": "review.body.move0", "duration_ms": 200 },
    { "clip_id": "review.move.front", "frame_index": 1, "region_id": "review.body.move1", "duration_ms": 200 }
  ],
  "required_context": { "context_key": "review.field", "use_slot": "field_body", "required_semantics": ["idle","move"], "required_directions": ["front"] },
  "icon_definitions": [
    { "owner_kind": "skill", "owner_id": "review.skill_a", "icon_region_id": "review.ui.skill" },
    { "owner_kind": "resource", "owner_id": "hp", "icon_region_id": "review.ui.hp" },
    { "owner_kind": "role", "owner_id": "review.role_optional", "icon_region_id": null }
  ],
  "icon_policies": [
    { "use_slot": "skill_icon", "required_binding": true },
    { "use_slot": "resource_icon", "required_binding": true },
    { "use_slot": "role_icon", "required_binding": false }
  ],
  "visible_icon_requests": [
    { "owner_kind": "skill", "owner_id": "review.skill_a" },
    { "owner_kind": "resource", "owner_id": "hp" },
    { "owner_kind": "role", "owner_id": "review.role_optional" }
  ],
  "expected": {
    "move_cycle_ms": 400,
    "field_unique_file_revisions": 1,
    "ui_unique_file_revisions": 1,
    "estimated_rgba8_bytes_body": 18432,
    "estimated_rgba8_bytes_ui": 32768,
    "estimated_rgba8_bytes_total": 51200,
    "production_ready": false
  },
  "invalid_region_case": { "region_id": "review.body.move1", "replacement_rect": [80,0,32,48], "expect_error": "outside_texture" },
  "missing_direction_case": { "required_directions": ["front","right"], "expect_error": "missing_direction" },
  "invalid_required_icon_case": { "owner_kind": "resource", "owner_id": "hp", "icon_region_id": null, "expect_error": "missing_required_icon" },
  "cache_lease_case": { "leases": ["review.menu","review.dialogue"], "asset_id": "review.chris.ui", "revision": 1, "expected_refs_after_acquire": 2, "expected_after_release_one": 1, "expected_after_release_twice_same_lease": 1, "expected_after_release_all": 0 }
}
```

fixture의 정식준비false는 실패를 숨기는 예외가 아니다. 문서의 산술/참조 대조와 실제 이미지 디코드·정식 출력·Godot 임포트·애니메이션/메모리/시각 검수를 분리하기 위한 표시다. 이번 문서 보강만으로 실제 프레임/아이콘/초상 리소스가 납품되었다고 보고하지 않는다.
