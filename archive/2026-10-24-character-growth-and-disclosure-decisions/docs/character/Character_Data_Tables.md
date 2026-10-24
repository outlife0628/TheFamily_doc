# SYS-03 — 캐릭터 데이터 테이블 설계

상태: [캐릭터 디자인](03_Character_System_UI.md)의 게임 수치/실행 상태 테이블 부록. 성장A·스탯/HP/SP·전투 XP·Lv100/XP 누적·초기 레벨 정책은 본문의 승인 기준을 따른다. 테이블 필드/수치와 나머지 세부는 검토 중이며 엔진/JSON 구현 완료가 아니다. 파일 에셋은 [에셋 관리 테이블](Character_Asset_Tables.md)을 따른다.

## 1. 데이터 작성·배포·버전

기획자는 Excel의 같은 이름 시트에 정의/밸런스 행을 작성하고 검사 후 게임용JSON으로 내보내는 구조를 제안한다. 새 패키지·DB서버·변환 도구는 설치/제작하지 않았다. Excel 정의 원본과 게임의 실행 상태는 별개다. 인물의 현재HP·XP를 기획 표에 덮어쓰지 않는다.

정의 묶음은 `schema_version`·`definition_set_id`·`content_revision`·`review_only`를 가진다. 저장 헤더는 사용한 정의 묶음을 참조한다. 같은 묶음 안에서는 모든ID가 안정적이며, 로컬라이즈 표시명을 주키로 쓰지 않는다. 승인 전 예제는 `review_only=true`이며 정식 출력 대상에서 거절한다.

| 표기 | 의미/허용 |
|---|---|
| `ID` | ASCII 소문자로 시작하는 영구 키. 소문자/숫자/`_ . -` 조합. 빈문자 금지 |
| `INT0` |0~2147483647 정수. 소수·NaN·무한대·문자열 숫자 금지 |
| `XP_INT` | 비음수 정수 XP. 일반 INT0의 상한을 적용하지 않으며 누적값/합산을 정밀도 손실 없이 보존. 저장/전송 표현은 아래 제안 참조 |
| `INT` | 부호 있는 정수. 해당 필드의 추가 범위 검사 적용 |
| `LEVEL` | 해당 성장 곡선의1~상한 정수 |
| `BP` | 비율 정수.10000=100%, 보정+1000=+10%. 소수% 저장 금지 |
| `KEY` | 등록된 표시문/설명 문자열 키. 공개ID/조건과 분리 |
| `REF` | `시스템명:안정ID`의 외부 참조. 소유자가 존재/형식을 검사 |
| `?` | null 허용. null은0·빈문자·미공개 정보가 아님 |

정의의 숫자 누락은 오류다. 미래 콘텐츠의 미정 수치가 필요하면 해당 행을 초안 묶음에 두고 정식 출력을 막는다. 런타임 정보 없음·미공개·해당 없음은 수치의null을 임의0으로 바꾸지 않고 각 표시 상태로 다룬다.

**XP 저장형 제안:** 누적 XP·곡선 임계값·지급량·영수증 전후값은 같은 정확한 정수 도메인을 사용한다. JSON/Excel 연계에서 큰 정수를 부동소수점으로 반올림하지 않도록 10진 정수 문자열의 손실 없는 입출력을 제안한다. 내부 정수형·최대 표현 범위·범위 초과 오류 처리는 엔진/도구 연결 전 확정하고, 범위를 이유로 XP를 조용히 폐기하거나 게임상 XP 상한을 임의 도입하지 않는다. 아래 작은 fixture의 숫자 리터럴은 시험용이며 생산 인코딩 확정이 아니다.

## 2. 정의·밸런스 테이블

### 2.1 인물·스탯·성장

| 테이블 | 주키 | 나머지 필드/형식 | 외래키·핵심 검사 |
|---|---|---|---|
| `CharacterDefinition` | `character_id:ID` | `name_key:KEY`, `actor_kind:major/mercenary/leader_mercenary/npc`, `stat_profile_id:ID?`, `initial_level:LEVEL?`, `bio_disclosure_group:ID?`, `visual_profile_id:ID?` | 능력프로필→StatProfile,표현프로필→CharacterVisualProfile. 주요 인물은 levelled/초기 레벨 필수. 승인: 최초 합류는 캐릭터별 지정값이며 파티 평균 미참조, 재합류는 기존 XP/레벨 유지. 용병은 fixed/초기 레벨 null, 비전투 NPC는 둘 다 null. 표현 프로필 필요 여부는 에셋 정책 검사 |
| `StatDefinition` | `stat_id:ID` | `name_key:KEY`, `description_key:KEY`, `kind:primary/derived`, `unit:point/count/speed`, `min_value:INT0`, `max_value:INT0`, `display_order:INT0` | min≤max. 명중/회피/치명 성능의unit은point이며%가 아님. 디자인 본문의6기본/11파생ID 사용 |
| `DerivedStatRule` | `stat_id:ID` | `constant:INT`, `terms:[{input_stat_id:ID,coefficient:INT}]` | 출력→derived스탯, 입력→primary스탯만 허용. 항목별입력 중복·음수계수·빈식 거절. 자유 코드/eval 금지. 본문 산식과 다른 값은 검토 오류 |
| `LevelCurve` | `curve_id:ID` | `level_cap:INT0`, `cap_xp_policy:retain_total`, `description_key:KEY` | 정식 상한100 승인. Lv100 이후 XP 누적/저장·레벨만 상한 적용. 축소 시험 곡선의 상한5와 구분 |
| `LevelCurvePoint` | `(curve_id:ID,level:LEVEL)` | `cumulative_xp:XP_INT` | 곡선→LevelCurve.1~상한 전행필수, 레벨1=0, 이후엄격증가, 중간누락거절 |
| `StatProfile` | `profile_id:ID` | `mode:levelled/fixed`, `curve_id:ID?`, `description_key:KEY` | levelled는유효곡선 필수. fixed는곡선null. 같은프로필에두모드혼용금지 |
| `LevelStatPoint` | `(profile_id:ID,level:LEVEL,stat_id:ID)` | `base_value:INT0` | 프로필→levelled StatProfile, 레벨→그프로필곡선의레벨, 스탯→primary. 모든레벨×6기본스탯행필수.값은StatDefinition범위이내 |
| `FixedStatPoint` | `(profile_id:ID,stat_id:ID)` | `base_value:INT0` | 프로필→fixed StatProfile, 스탯→primary.6기본스탯행필수. 레벨0행으로표현하지 않음 |

성장값은 `LevelStatPoint`의 절대 기본값이 런타임 원본이다. 기획자가 선형/구간별 공식을 써서 표를 채울 수 있지만, 게임에서 별도 증가 공식을 다시 적용하지 않는다. 성장표와 코드의 중복 산식을 피한다. 현재 최종값을 다음레벨 기본값으로 사용하지 않는다.

### 2.2 리소스·기술·습득·보정

| 테이블 | 주키 | 나머지 필드/형식 | 외래키·핵심 검사 |
|---|---|---|---|
| `ResourceDefinition` | `resource_id:ID` | `name_key:KEY`, `max_stat_id:ID`, `icon_region_id:ID?`, `initial_policy:full_on_first_spawn`, `carry_between_battles:true`, `level_up_recovery:full_to_new_max`, `auto_regen:none`, `max_increase_outside_level_up:keep_current`, `max_decrease:clamp`, `zero_rule:knockout/empty` | hp→max_hp/knockout,sp→max_sp/empty. 아이콘→AssetRegion. 레벨업 전량 회복·레벨업 외 최대치 증가 시 현재량 유지/감소 시 제한 승인. HP0은 모든 XP 수령 제외·부활 외 아이템 불가 |
| `SkillDefinition` | `skill_id:ID` | `name_key:KEY`, `description_key:KEY`, `icon_region_id:ID?`, `kind:active/passive`, `usage_scope:field/battle/both/passive`, `max_rank:INT0`, `disclosure_condition_ref:REF?` | 아이콘→AssetRegion.최대랭크≥1.passive는usage_scope=passive,활성사용UI/비용없음.아이콘/잠금문구로미공개조건노출금지 |
| `SkillRank` | `(skill_id:ID,rank:INT0)` | `effect_ref:REF?`, `passive_modifier_ids:[ID]`, `description_key:KEY` | 기술→SkillDefinition,랭크1~max_rank 전행필수. active는유효효과참조/패시브목록빈값. passive는effect_ref=null/보정목록참조.효과실행은SYS-04/05소유 |
| `SkillCost` | `(skill_id:ID,rank:INT0,resource_id:ID)` | `amount:INT0`, `commit_point:execution_start` | 기술랭크→SkillRank,자원→ResourceDefinition. 승인: 실행 시작 시 SP 차감, 실행 전 취소 무소모, 실행 후 빗나감/저항 환불 없음. 현재안은 정수 SP 고정 비용. hp비용/비율/쿨다운 미채택. 비용 행이 없으면0비용 |
| `CharacterInitialSkill` | `(character_id:ID,skill_id:ID)` | `initial_rank:INT0` | 인물→CharacterDefinition,기술/랭크→SkillRank. 명시된 초기값만 최초 적용하며 과거 레벨/사건 규칙으로 추가하지 않음. 초기 기술이 없으면 행 없음. 용병의 고정 기술 세트도 이 표로 지정. 재합류 덮어쓰기 금지 |
| `SkillUnlockRule` | `unlock_rule_id:ID` | `character_id:ID`, `skill_id:ID`, `grant_rank:INT0`, `trigger:level/event`, `min_level:LEVEL?`, `condition_ref:REF?`, `prerequisite_skills:[{skill_id:ID,rank:INT0}]` | 인물/기술랭크/선행기술 참조 필수. 합류 이후 주요 인물의 성장 규칙이며 최초 생성 소급 평가 금지. level은 유효min_level 필수, event는 영구 사건 조건REF 필수. 용병 성장 연결·일시 상태/스탯 조건·자기/상호순환·불가능한 선행랭크 거절 |
| `RevivalRecoveryRule` | `revival_rule_id:ID` | `hp_rule_ref:REF`, `sp_rule_ref:REF` | 부활 아이템/장소 정의가 이 규칙을 참조하는 연결 구조 제안. HP/SP를 각 명시 규칙대로 적용하고 SP 유지도 명시 설정. 최종 HP1 이상/각 최대치 이내 검사. 실제 효과/수치·소비/가격/시간은 SYS-04/14 소유 |
| `StatModifierDefinition` | `modifier_id:ID` | `target_stat_id:ID`, `component:flat/rate_bps`, `value:INT`, `description_key:KEY` | 대상→StatDefinition. 기획값에따른보정만.조건/기간/중첩해석후의유효개체를전달받음.출처없이최종스탯직접수정금지 |

ResourceDefinition의 최초 생성 정책은 로드/지역 진입/재합류에서 다시 실행하지 않는다. 현재값 저장과 최초 정의값을 구분한다. 비전투NPC에는 자원/XP/기술 습득 상태 행이 없고, 전투에 사용하는 주요 인물/용병은 정의된hp/sp 상태 행을 가진다.

일반/리더급 용병의 기술 세트는 정의에 고정한다. 일시적인 상태 효과로 기술 사용 가능성이 달라져도 습득 랭크가 성장하는 것은 아니다. 장비 또는 영구 성장 보정을 용병에 연결하면 오류다.

### 2.3 역할·공개 정보

| 테이블 | 주키 | 나머지 필드/형식 | 외래키·핵심 검사 |
|---|---|---|---|
| `RoleDefinition` | `role_id:ID` | `name_key:KEY`, `description_key:KEY`, `icon_region_id:ID?` | 아이콘→AssetRegion.상인등업무자격의의미를등록.리더급용병은actor_kind원본이며독립role로중복정의하지않음.아이콘/서사직업명과자격판정은별개 |
| `CharacterRole` | `(character_id:ID,role_id:ID)` | `condition_ref:REF?` | 인물/역할등록검사.자격인물목록은검토결정대기.올리버서사설명만으로merchant행생성금지.실제파티자격은SYS-06/08이그파티의구성원에서조회 |
| `DisclosureEntry` | `disclosure_id:ID` | `character_id:ID`, `group_id:ID`, `field_kind:bio/skill_hint/relation_hint`, `text_key:KEY`, `condition_ref:REF?` | 인물/문구/조건존재검사.조건null은처음부터공개되는항목에한함.비밀출생·미래사건문구를일반bio로묶지않음 |

역할 적용 보너스를 정의하지 않았다면 자격만 가진다. 관계/평판이나 기교 스탯을 상인 자격으로 자동 변환하지 않는다. 미등록 역할을 UI 문구로만 만들어 거래 조건을 우회하지 않는다.

## 3. 실행 상태와 저장할 값

| 테이블/객체 | 주키 | 저장필드/형식 | 불변조건/복원 |
|---|---|---|---|
| `ActorInstance` | `actor_id:ID` | `character_id:ID`, `party_ref:REF?`, `life_state:alive/dead` | 정의참조. 주요인물의character_id는실행개체전체에서유일.파티참조는SYS-06소유.사망은명시결과만설정 |
| `ActorProgressState` | `actor_id:ID` | `total_xp:XP_INT` | 주요 인물만1행. 모든 시스템의 XP 효과가 같은 누적값을 변경하며 출처별 XP를 따로 만들지 않음. Lv100 이후도 전량 저장. 초기 XP는 지정 초기 레벨의 곡선 기준, 재합류 초기화 없음. 용병/NPC 행 금지 |
| `ActorResourceState` | `(actor_id:ID,resource_id:ID)` | `current_value:INT0` | 개체/자원참조.복원된최종상한이내.현재HP0은life_state=dead를뜻하지않음 |
| `ActorSkillState` | `(actor_id:ID,skill_id:ID)` | `rank:INT0`, `grant_operation_ref:ID` | 정의된랭크/습득출처참조.재지급/낮은랭크덮기금지.0랭크행대신미습득은행없음 |
| `ActorPermanentModifier` | `modifier_instance_id:ID` | `actor_id:ID`, `modifier_id:ID`, `source_ref:REF`, `grant_operation_ref:ID` | 출처있는영구보정.개체ID중복금지,용병금지.장비/전투상태는해당시스템의복원참조로재구성하여여기중복저장하지않음 |
| `CharacterChangeReceipt` | `(operation_id:ID,actor_id:ID)` | `source_ref:REF`, `request_digest:string`, `xp_before:XP_INT?`, `xp_granted:XP_INT?`, `xp_after:XP_INT?`, `resource_changes:[ResourceChange]`, `skill_changes:[SkillChange]`, `modifier_changes:[ID]` | 지급/소비/회복의 멱등 결과. XP 지급은 before+granted=after, MAX에서도 폐기 없음. source_ref는 출처 기록/검증이며 시스템 허용 목록이 아님. 동일키+동일요청은 기존 결과, 동일키+다른요청은 충돌. 아래 구조 정의 사용 |
| `DisclosureChangeReceipt` | `(save_scope_id:ID,operation_id:ID)` | `source_ref:REF`, `request_digest:string`, `disclosure_ids_added:[ID]` | 플레이어 공통 공개 사실 전용 영수증. 각 항목→DisclosureEntry. 동일 범위/작업ID의 재요청은 같은 요청만 허용. 인물 변화 영수증과 분리 |
| `KnownDisclosureState` | `(save_scope_id:ID,disclosure_id:ID)` | `source_ref:REF`, `grant_operation_ref:ID` | 공개사실저장. `(save_scope_id,grant_operation_ref)`→DisclosureChangeReceipt. 기준안은 플레이어의 동일save_scope 공개정보를 사용하며 actor_id를 임의로 붙이지 않음 |

`ResourceChange={resource_id:ID,before:INT0,after:INT0,reason:cost/recovery/cap_change/damage/revive}`다. `SkillChange={skill_id:ID,before_rank:INT0?,after_rank:INT0}`이며 before의null은미습득이다. ActorSkillState/ActorPermanentModifier의 `grant_operation_ref`는 `(grant_operation_ref,actor_id)`로 같은 개체의CharacterChangeReceipt를 참조한다. KnownDisclosureState는 별도의 공개 사실 영수증을 위 표의 완전한 복합키로 참조한다.

최초 생성/사건도 고유 작업ID를 가진다. 최초 생성은 캐릭터별 초기XP·CharacterInitialSkill의 초기 기술/랭크·초기 패시브 반영 후 최종 상한·최초 자원을 함께 확정한다. 초기 기술에 없는 항목을 이전 레벨/사건으로 자동 보충하지 않는다. 용병은 초기 고정 기술만 사용한다. 합류 이후 연쇄 습득의 상세 알고리즘은 제안이며 최초 생성에 적용하지 않는다. 힌트 공개 조건과 습득 조건은 독립적이다. 재합류는 기존 XP/기술/자원을 유지하고 초기값을 다시 적용하지 않는다.

처리 원장은 이 문서의 캐릭터 변화에 대한 것이다. 돈·화물·퀘스트 전체 상태를 그대로 복사하지 않는다. 여러 개체가 받는 같은 결과는 수령자 전원 검사 후 일괄 확정하며, 중간 실패로 일부만 성장한 상태를 남기지 않는 것을 제안한다. 실제 입출금/물품 소비와 연결할 경우 각 소유자의 원자적 확정과 같은 작업을 구성한다.

전투 XP는 실제 참가하고 승리 시 활동 가능한 주요 인물에게 고정량을 각각 지급한다. HP0·대기·비참가·다른 파티 인물은 해당 전투에서 제외하고 그 몫을 재분배하지 않는다. 제외 때문에 다른 유효 수령자의 지급을 실패시키지 않으며, 부활 후 과거 승리 XP를 재지급하지 않는다. 이 참가 조건을 다른 XP 제공 경로에 공통 강제하지 않는다.

전투불능 인물에게는 부활 아이템 이외 모든 아이템이 사용 불가다. XP/일반 회복/성장 아이템도 소비/효과 없이 거절하며 실제 물품 소유 시스템과 같은 작업으로 검사한다. HP0은 퀘스트/이벤트 등 전투 외 XP에서도 수령 대상에서 제외한다. 부활 아이템/부활 가능 장소의 테이블 회복 규칙으로 HP/SP를 적용하며 일반 회복으로 HP0을 활동 가능 상태로 바꾸지 않는다.

예약은 영구 자원 소비가 아니다. `ResourceReservation={reservation_id,actor_id,action_ref,amounts:[{resource_id,amount}]}`를 전투의 임시 문맥으로 두며 확정/취소 시 해제한다. 저장/로드의 명령 복구는SYS-16/05 연계 대상이다. 명령을 복원하지 않는 재개에서는 예약을 제거하며 이미 확정한 비용 영수증을 취소하지 않는다. 예약 해제만으로 현재량을 증가시키지 않는다.

## 4. 관계/평판 테이블 — 정책 선택 전 준비 스키마

다음은 아직 활성 기준안이 아닌 연계 구조다. 수치 범위/등급·기본 관계·효과는 별도 결정 전 정식 출력 금지다.

| 테이블 | 키/필드 | 검토 경계 |
|---|---|---|
| `RelationTypeDefinition` | `relation_type_id:ID`PK, `subject_kind:character/party`, `target_kind:character/faction/region`, `value_kind:number/enum`, `range_or_values`, `disclosure_ref:REF?` | 대상종류와값체계를타입마다등록.미정range/default를0으로고정하지않음 |
| `RelationState` | `(subject_ref:REF,target_ref:REF,relation_type_id:ID)`PK, `value:number/string`, `source_operation_ref:ID` | 주체/대상/타입/공개범위검사.캐릭터개인관계와파티/지역평판을복사하지않음 |

기술/흥정/상점 권한과의 효과 연결은 없다. 범위 검토 후 활성화할 때 효과의 소유 규칙과 기획 행을 함께 정의한다. 이번 핵심 스탯/XP/자원 예제에는 이 두 테이블을 채우지 않는다.

## 5. 시험용 밸런스 행과 산출 예시

### 5.1 기본 성장 성향 — 전부 시험값

다음은Excel에서레벨표를작성할때검토할시작행/증가성향이다. 정식초기편성·시작레벨·종족보너스·확정능력이아니다. 런타임에는전개된LevelStatPoint만들어간다.

| 프로필 참고 | Lv1기본값 V/S/D/I/W/A | 레벨당증가 V/S/D/I/W/A | Lv1시험최대HP/SP |
|---|---|---|---|
| 크리스 |10/10/8/6/8/8 |2/2/2/1/1/2 |240/54 |
| 브람 |12/11/6/9/9/5 |3/2/1/2/2/1 |268/65 |
| 엘리아나 |7/6/11/10/10/10 |1/1/2/2/2/2 |188/70 |
| 올리버 |8/7/10/8/8/11 |2/1/2/2/1/2 |204/60 |

예: 활동가능한크리스가XP90→290으로Lv1→3이되면기본값14/14/12/8/10/12와최대HP304/SP64를계산하고현재HP120/SP30을304/64로전량회복한다. HP0승리자는XP수령/레벨업자체가없다. 기술A/B·곡선·계수는시험자료다.

### 5.2 XP 곡선 예제 — 상한5인 축소시험

정식 상한100의 전량 밸런스표가 아니다. 이 예제는 레벨 경계·상한 이후 XP 누적·누락 검사의 재현 가능성을 위한 것이며 XP 전량 보존 정책은 동일하게 적용한다.

| 레벨 | 누적XP | 다음레벨추가XP |
|---|---|---|
|1 |0 |100 |
|2 |100 |175 |
|3 |275 |300 |
|4 |575 |475 |
|5 |1050 |해당없음(MAX) |

곡선생성보조식의시험예는 `추가XP(L)=100+50(L-1)+25(L-1)^2`다. 이식은예제행설명이며런타임의별도성장공식이아니다. 곡선수정시LevelCurvePoint가단일원본이다.

### 5.3 문서 정합성 검사용 fixture

아래JSON은문서검증용축소fixture다. 생산JSON테이블을이미구현했다는뜻이아니다. `growth_vectors`는6개스탯행을간단히읽기위한시험형식이고,실제내보내기원본은정규화된LevelStatPoint다. 이예제는조건없이해금되는공개기술두개만사용한다.

```json
{
  "review_only": true,
  "character_id": "chris",
  "level_cap": 5,
  "cap_xp_policy": "retain_total",
  "curve": [
    { "level": 1, "cumulative_xp": 0 },
    { "level": 2, "cumulative_xp": 100 },
    { "level": 3, "cumulative_xp": 275 },
    { "level": 4, "cumulative_xp": 575 },
    { "level": 5, "cumulative_xp": 1050 }
  ],
  "stat_ids": ["vitality", "strength", "dexterity", "intellect", "willpower", "agility"],
  "growth_vectors": [
    { "level": 1, "values": [10, 10, 8, 6, 8, 8] },
    { "level": 2, "values": [12, 12, 10, 7, 9, 10] },
    { "level": 3, "values": [14, 14, 12, 8, 10, 12] },
    { "level": 4, "values": [16, 16, 14, 9, 11, 14] },
    { "level": 5, "values": [18, 18, 16, 10, 12, 16] }
  ],
  "skills": [
    { "skill_id": "review.skill_a", "rank": 1, "unlock_level": 2, "cost_sp": 6 },
    { "skill_id": "review.skill_b", "rank": 1, "unlock_level": 3, "cost_sp": 10 }
  ],
  "xp_case": {
    "before": 90,
    "grant": 200,
    "expected": { "total": 290, "level": 3, "in_level": 15, "level_span": 300, "remaining": 285, "levels_gained": 2, "unlocked": ["review.skill_a", "review.skill_b"] }
  },
  "resource_case": {
    "before_hp": 120,
    "before_sp": 30,
    "expected_max_hp_before": 240,
    "expected_max_sp_before": 54,
    "expected_max_hp_after": 304,
    "expected_max_sp_after": 64,
    "expected_hp_after": 304,
    "expected_sp_after": 64
  },
  "cost_cases": [
    { "current_sp": 5, "cost_sp": 6, "can_pay": false, "expected_after": 5 },
    { "current_sp": 6, "cost_sp": 6, "can_pay": true, "expected_after": 0 }
  ],
  "battle_end_no_level_case": { "before_hp": 120, "before_sp": 30, "before_xp": 0, "xp_grant": 20, "expected_level": 1, "expected_hp": 120, "expected_sp": 30 },
  "knockout_case": { "hp_at_victory": 0, "xp_before": 90, "offered_battle_xp": 200, "expected_xp_awarded": 0, "expected_xp_after": 90, "expected_level": 1, "expected_hp": 0, "revival_sources": ["revival_item", "revival_facility"] },
  "cap_case": { "before": 1000, "grant": 500, "expected_total": 1500, "expected_level": 5 },
  "already_max_case": { "before": 1500, "grant": 250, "expected_total": 1750, "expected_level": 5, "before_hp": 100, "before_sp": 10, "expected_hp": 100, "expected_sp": 10 },
  "large_xp_case": { "before_decimal": "9007199254740991", "grant_decimal": "10", "expected_total_decimal": "9007199254741001" },
  "battle_award_case": {
    "fixed_xp_per_recipient": 100,
    "actors": [
      { "actor_id": "review.participant_a", "participated": true, "hp_at_victory": 10, "same_battle": true, "expected_grant": 100 },
      { "actor_id": "review.participant_b", "participated": true, "hp_at_victory": 20, "same_battle": true, "expected_grant": 100 },
      { "actor_id": "review.knocked_out", "participated": true, "hp_at_victory": 0, "same_battle": true, "expected_grant": 0 },
      { "actor_id": "review.reserve", "participated": false, "hp_at_victory": 10, "same_battle": true, "expected_grant": 0 },
      { "actor_id": "review.other_party", "participated": false, "hp_at_victory": 10, "same_battle": false, "expected_grant": 0 }
    ]
  },
  "knockout_item_cases": [
    { "effect": "xp", "is_revival_item": false, "expected_usable": false, "expected_consumed": 0 },
    { "effect": "ordinary_recovery", "is_revival_item": false, "expected_usable": false, "expected_consumed": 0 },
    { "effect": "permanent_growth", "is_revival_item": false, "expected_usable": false, "expected_consumed": 0 },
    { "effect": "revival", "is_revival_item": true, "expected_usable": true }
  ],
  "max_cases_context": "non_level_up_equipment_or_status",
  "max_cases": [
    { "current": 100, "old_max": 200, "new_max": 300, "expected_current": 100 },
    { "current": 250, "old_max": 300, "new_max": 200, "expected_current": 200 },
    { "current": 0, "old_max": 240, "new_max": 304, "expected_current": 0 }
  ],
  "modifier_case": { "base": 10, "flat": 2, "rate_bps": 1000, "expected": 13 },
  "spawn_case": { "initial_level": 3, "party_average_levels": [1, 5], "expected_level_for_each_average": 3, "expected_total_xp": 275, "initial_skills": [{ "skill_id": "review.skill_a", "rank": 1 }], "historical_level_eligible_skills": ["review.skill_a", "review.skill_b"], "expected_skills": ["review.skill_a"], "expected_ranks": [1], "automatic_skill_catchup": false },
  "nonbattle_knockout_xp_cases": [
    { "source": "quest", "hp_at_grant": 0, "before_xp": 90, "offered_xp": 200, "expected_grant": 0, "expected_total": 90 },
    { "source": "event", "hp_at_grant": 0, "before_xp": 90, "offered_xp": 200, "expected_grant": 0, "expected_total": 90 }
  ],
  "sp_payment_cases": [
    { "result": "cancel_before_execution", "before_sp": 10, "cost": 6, "expected_after": 10 },
    { "result": "miss_after_execution", "before_sp": 10, "cost": 6, "expected_after": 4 },
    { "result": "resist_after_execution", "before_sp": 10, "cost": 6, "expected_after": 4 }
  ],
  "revival_cases": [
    { "review_rule_id": "review.revive_partial", "before_hp": 0, "before_sp": 10, "max_hp": 240, "max_sp": 54, "hp_rule": { "mode": "fixed", "value": 60 }, "sp_rule": { "mode": "keep_current" }, "expected_hp": 60, "expected_sp": 10 },
    { "review_rule_id": "review.revive_full", "before_hp": 0, "before_sp": 10, "max_hp": 240, "max_sp": 54, "hp_rule": { "mode": "full" }, "sp_rule": { "mode": "full" }, "expected_hp": 240, "expected_sp": 54 }
  ],
  "unlock_chain_case": {
    "level": 3,
    "rules": [
      { "rule_id": "review.01.dependent", "skill_id": "review.chain_b", "min_level": 3, "requires": ["review.chain_a"] },
      { "rule_id": "review.02.source", "skill_id": "review.chain_a", "min_level": 3, "requires": [] }
    ],
    "expected_skills": ["review.chain_a", "review.chain_b"]
  }
}
```

fixture의현재HP/SP·기술명·비용·곡선·성장값은전부시험자료다. 참조/행오류검사사례에는아래처럼잘못된입력을별도로사용하며,정상fixture와섞지않는다.

## 6. 필수 데이터 검증 규칙

| 검사ID | 입력오류/조건 | 처리 |
|---|---|---|
| DT-01 | 주키중복·미등록FK·잘못된종류/공개조건 | 시트/행/주키/필드/대상ID와함께정식출력거절 |
| DT-02 | 레벨1XP≠0·임계값역전/동일·중간레벨/기본스탯누락 | 누락레벨/스탯또는이전행을명시 |
| DT-03 | 용병의curve/초기level/XP/level기술/영구보정/장비 | 기존무성장·무장비규칙위반으로거절 |
| DT-04 | 파생스탯입력이파생스탯·순환참조·텍스트실행식 | 기본안허용구조밖이므로거절.미래표현확장전재검토 |
| DT-05 | 비정수·범위밖값·소수BP·미정숫자 | 자동0대체/반올림없이거절 |
| DT-06 | 기술랭크누락·초과랭크·잘못된비용·습득순환 | 해당skill/rank/rule참조를알려수정 |
| DT-07 | 같은주요인물의중복개체·현재자원상한초과 | 실제소유자/버전/유효보정복원후검사.임의초기화금지 |
| DT-08 | 같은작업ID의다른요청·중복보정개체 | 변화없이충돌오류.같은요청재시도는기존영수증반환 |
| DT-09 | 정의버전불일치·필수장비/상태/효과참조누락 | 해당구간활성화/로드를막고명시이관필요로보고 |
| DT-10 | 검토fixture·미정관계정책·미검증외부REF의생산혼입 | 미연동참조를완료로간주하지않고정식출력거절 |
| DT-11 | MAX 이후 XP 폐기·INT0 상한 강제·큰 정수 정밀도 손실 | XP 전량 누적/정확한 입출력 조건 위반. 무음 절삭/반올림 금지 |

외부REF검사는SYS-04/05/06/09/10/16의실사양과연결후가능하다. 지금문서검사로정식테이블연동을통과했다고표시하지않는다. 새기술을기획표에작성하더라도효과·소비·공개조건이없으면사용가능상태로내보내지않는다.

## 7. 기획자 작업 순서와 검수 경계

### 에셋 테이블과의 연결

`visual_profile_id`와`icon_region_id`는 [에셋 관리 부록](Character_Asset_Tables.md)의 실제FK다. 에셋 리비전·영역·애니메이션·로딩 그룹·표현 상태를 HP/SP/XP 표에 섞지 않는다. 같은정의세트에서이참조도검사하며,그림이없다고현재자원/성장값을지우지않는다. 에셋이준비되지않은초안은미준비로표시하고정식표현완료를주장하지않는다.

기술/자원아이콘은활성화한해당UI의정식묶음에서필수FK로검사하고,역할아이콘은선택으로둔다. null허용은초안/해당없음의형식이며필수정책을우회하지않는다. 이정의들의아이콘은인물외형바인딩과별도로로딩/빌드루트에포함한다. 런타임에는현재공개·표시하는정의ID만요청한다.

인물/스탯ID 등록 → XP곡선 → 인물별성장/고정표 → 자원정책 → 기술랭크/비용/습득 → 보정·역할·공개참조 → 행/참조검사 → 레벨/자원시뮬레이션 → 검토승인 → 버전붙인정식JSON 출력순서를제안한다.

검토 도구에서현재레벨/다음XP·선택레벨의기본/파생스탯·다중레벨업습득·자원부족/상한변경을미리볼수있게한다. 이는향후제작도구요구이며이번에새Excel변환기나게임상태시뮬레이터를구현한것이아니다.

이번실제수행가능한것은문서링크·예제JSON파싱·산술/행정합성대조다. 실제PK/FK검증기·게임저장·XP/자원처리·UI/엔진검수는미구현/미실행으로분리한다.
