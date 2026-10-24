import { createState, quote, selectDestination, selectTransport } from './model.mjs';
import { applyTravelAction } from './commands.mjs';
import { positionKey, readPosition, rememberPosition, routePoint, minimapPoint } from './spatial.mjs';
import { escapeHTML as esc, formatNumber as num, icon, button, actionDock, windowSurface, detailRow, detailPane, selectableList, contextHeader, confirmDialog } from './components.js';
import { FieldScene } from './field.js';

const root = document.querySelector('#app');
let data, state, field, toastTimer;
const ui = { screen: 'field', modal: null, returnFocus: '', map: { zoom: 1, cx: 755.5, cy: 520.5 }, listScroll: 0, near: false, positions: {} };
const nameOf = id => data.locations.find(l => l.id === id)?.shortName || '노선 구간';
const fullNameOf = id => data.locations.find(l => l.id === id)?.name || '노선 구간';
const transportOf = id => data.transports.find(t => t.id === id);
const onRoad = () => state.phase === 'traveling' || state.phase === 'stopped';
const currentText = () => state.location.kind === 'city' ? nameOf(state.location.cityId) : (state.phase === 'stopped' ? '노선 중간 · 정차 중' : '노선 구간 · 이동 중');
const phaseText = () => ({city:'현지 대기',traveling:'여정 진행 중',stopped:'정차 중',arrived:'목적지 도착'}[state.phase]);

function fitStage() {
  const scale = Math.min(innerWidth / 1920, innerHeight / 1080);
  root.style.transform = `scale(${scale})`;
}
addEventListener('resize', fitStage); fitStage();

function stats() {
  return `<div class="stat-block"><small>${icon('people')}조작 파티</small><strong>크리스 일행 <span class="value-unit">${state.actorIds.length} / 8명</span></strong></div><div class="stat-block"><small>${icon('clock')}행동 기반 공통 날짜</small><strong id="calendar">E.C.5000 · 경과 ${state.days}일</strong></div><div class="stat-block"><small>${icon('coin')}보유 자금 · 시험값</small><strong id="cash">${num(state.money)} <span class="value-unit">G</span></strong></div>`;
}
function reviewBanner() {
  return `<p class="review-banner">${icon('info')}UI 검토용 · 지리·기간·운임·화물은 시험값 · Map Tool 미연동</p>`;
}
function auxiliary() { return `<button type="button" class="aux-button" data-action="help">${icon('info')}검토 안내</button>`; }
function focusSelector(element = document.activeElement) {
  if (!element || element === document.body) return '';
  if (element.id) return `#${CSS.escape(element.id)}`;
  if (element.dataset.destination) return `${element.classList.contains('destination-row') ? '.destination-row' : '.map-marker'}[data-destination="${CSS.escape(element.dataset.destination)}"]`;
  if (element.dataset.action) return `[data-action="${CSS.escape(element.dataset.action)}"]`;
  return '';
}
function restoreFocus(selector) { if (selector) root.querySelector(selector)?.focus({ preventScroll: true }); }
function preserveListScroll() { const list = root.querySelector('.destination-list'); if (list) ui.listScroll = list.scrollTop; }
function render(focus = '') {
  field?.destroy(); field = null;
  root.dataset.screen = ui.screen; root.dataset.phase = state.phase;
  root.innerHTML = `<div id="screen-content">${ui.screen === 'field' || ui.screen === 'stop-field' ? renderField() : ui.screen === 'worldmap' ? renderWorldMap() : renderJourney()}</div><div id="modal-host"></div><div class="screen-reader-only" id="announcer" role="status" aria-live="polite"></div>`;
  const list = root.querySelector('.destination-list'); if (list) list.scrollTop = ui.listScroll;
  if (ui.screen === 'field' || ui.screen === 'stop-field') {
    const placeKey=positionKey(ui.screen,state.location);
    field = new FieldScene(root.querySelector('#field-canvas'), data.actors.filter(a => state.actorIds.includes(a.id)), {
      stop: ui.screen === 'stop-field',
      position: readPosition(ui.positions,placeKey),
      onNear: (near, position) => {
        ui.near = near;
        rememberPosition(ui.positions,placeKey,position);
        const hint = root.querySelector('#interaction-hint'); if (hint) hint.hidden = !near;
        const marker = root.querySelector('#minimap-player');
        if (marker && position) marker.setAttribute('transform', `translate(${minimapPoint(position).join(' ')})`);
      }
    });
  }
  if (ui.modal) renderModal(); else restoreFocus(focus);
  root.dataset.ready = 'true';
}

function minimap() {
  return `<aside class="field-minimap" aria-label="현재 구역 미니맵"><div class="minimap-disc"><div class="minimap-art"><svg viewBox="0 0 240 167" preserveAspectRatio="xMidYMid slice" role="img" aria-label="간이 현장 동선과 현재 위치"><rect width="240" height="167" fill="#2a3028"/><path d="M0 128 210 55M43 0l116 167M0 45l240 8" stroke="#8d896f" stroke-width="22" fill="none"/><path d="M0 128 210 55M43 0l116 167M0 45l240 8" stroke="#c7b98c" stroke-width="2" fill="none"/><path d="M12 72h49v35H12zm67-49h47v37H79zm84 8h60v39h-60zM168 103h49v52h-49z" fill="#485d4c" stroke="#a99d71"/><path d="m150 75 7 7-7 7-7-7z" fill="#e0bc6e"/><g id="minimap-player" transform="translate(100 100)"><circle r="13" fill="#74b2bd44"/><path d="m0-10 8 18-8-4-8 4z" fill="#f3ead1" stroke="#6cb4bf" stroke-width="2"/></g></svg></div><img class="minimap-bezel" src="assets/skins/minimap.svg" alt="" aria-hidden="true" draggable="false"><span class="minimap-north" aria-hidden="true">N</span></div><div class="minimap-caption"><span>현재 구역</span><span>시험 배치</span></div></aside>`;
}
function renderField() {
  const stopped = ui.screen === 'stop-field';
  const title = stopped ? '노선 중간 정차 지점' : fullNameOf(state.location.cityId);
  const subtitle = stopped ? '정차 현장 · UI 검토용' : state.location.cityId === 'sydria' ? '중앙역 앞 · 검토용 배치' : '도착 거점 · 검토용 배치';
  const objective = stopped ? '현장을 살펴본 뒤 여정으로 복귀하기' : '안내판에서 여행 계획 확인하기';
  return `<canvas id="field-canvas" class="field-canvas" width="1920" height="1080" aria-label="브라우저 간이 공간의 2D 픽셀 파티 시연"></canvas><section class="field-location"><p class="eyebrow">${stopped ? 'ROADSIDE STOP' : 'FIELD EXPLORATION'}</p><h1>${esc(title)}</h1><p class="location-subtitle">${esc(subtitle)}</p></section>${minimap()}<aside class="quest-tracker"><div class="tracker-label">${icon('flag')}현재 안내 · 검토 동선</div><p>${esc(objective)}</p><small>${stopped ? '화물과 남은 여정은 그대로 유지됩니다.' : '목표 추적은 이동·퀘스트 수락이 아닙니다.'}</small></aside><button id="interaction-hint" class="interaction-hint" data-action="${stopped ? 'journey' : 'worldmap'}" hidden><span class="keycap">E</span>${stopped ? '여정 확인' : '여행 계획 확인'}</button><p class="scene-caption">자체 간이 공간·시험 스프라이트 · 실제 Godot/Map Tool 출력 아님</p><footer class="field-footer"><div class="field-status">${stopped ? '정차 중 · 남은 여정 ' + (state.journey.total-state.journey.elapsed) + '일' : '지역 직접 탐험'}<small>UI 검토용 · Map Tool 미연동</small></div><nav class="field-hints" aria-label="현장 입력"><span class="hint-button"><span class="keycap">WASD</span>이동</span><span class="hint-button"><span class="keycap">Shift</span>걷기</span>${stopped ? `<button class="hint-button" data-action="journey"><span class="keycap">J</span>여정으로</button>` : `<button class="hint-button" data-action="worldmap"><span class="keycap">M</span>월드맵</button>`}<button class="hint-button" data-action="help">${icon('info')}안내</button></nav></footer>`;
}

function markerSvg(location) {
  const current = state.location.kind === 'city' && state.location.cityId === location.id;
  const selected = state.selectedId === location.id;
  const x = location.u * 1511, y = location.v * 1041;
  const right = location.u > .78, labelW = location.id === 'sydria' ? 125 : 175;
  const lx = right ? -labelW-30 : 31;
  return `<g class="map-marker ${current ? 'is-current' : ''} ${selected ? 'is-selected' : ''}" data-destination="${location.id}" tabindex="0" role="button" aria-label="${esc(location.name)}${current ? ', 실제 현재 위치' : ''}${selected ? ', 선택됨' : ''}" transform="translate(${x} ${y})"><circle class="marker-halo" r="23"/>${current ? '<path class="marker-glyph" d="m0-13 10 24-10-6-10 6z"/>' : '<path class="marker-glyph" d="m0-10 9 10-9 10-9-10z"/>'}<rect class="marker-label" x="${lx}" y="-23" width="${labelW}" height="46" rx="3"/><text x="${lx+labelW/2}" y="9" text-anchor="middle">${esc(location.shortName)}</text></g>`;
}
function mapSvg() {
  const q = quote(state,data);
  return `<svg id="world-map" viewBox="${mapViewBox()}" preserveAspectRatio="xMidYMid meet" aria-label="사용자 월드맵의 현재 위치와 시험 목적지"><image class="map-art" href="assets/world_map_source.png" x="0" y="0" width="1511" height="1041"/>${data.routes.filter(r=>r.public).map(r=>`<polyline class="route-line ${!r.open?'is-closed':''} ${q.route?.id===r.id?'is-active':''}" points="${r.points.map(([u,v])=>`${u*1511},${v*1041}`).join(' ')}"/>`).join('')}${data.locations.filter(l=>l.public).map(markerSvg).join('')}</svg>`;
}
function mapViewBox() { return `${ui.map.cx-755.5/ui.map.zoom} ${ui.map.cy-520.5/ui.map.zoom} ${1511/ui.map.zoom} ${1041/ui.map.zoom}`; }
function destinationItems() {
  const symbols = {sydria:'compass',human:'pin',dwarf:'mountain',elf:'leaf',port:'anchor'};
  return data.locations.filter(l=>l.public).map(l=>({id:l.id,name:l.shortName,symbol:symbols[l.id],tag:state.location.cityId===l.id?'현재 위치':l.id==='elf'?'통행 중단':'시험 지점'}));
}
function renderWorldMap() {
  const q = quote(state,data), dest = q.destination;
  const detail = detailPane(`<h3>${esc(dest?.shortName || '목적지 선택')}</h3><p class="destination-type">${esc(dest?.type || '')}</p><div class="route-values">${detailRow('이동 기간',q.days!==null?`${q.days}<span class="value-unit">일</span>`:'—','clock')}${detailRow('이동 비용',q.cost!==null?`${num(q.cost)}<span class="value-unit">G</span>`:'—','coin')}${detailRow('현재 화물',`${state.cargo} / ${q.transport?.capacity ?? '—'}<span class="value-unit">칸</span>`,'cargo')}</div><div class="transport-control"><label for="transport-select">${icon('cart')} 수단</label><select id="transport-select">${data.transports.map(t=>`<option value="${t.id}" ${t.id===state.transportId?'selected':''}>${esc(t.name)}${t.owned?'':' · 미보유'}</option>`).join('')}</select></div><div id="departure-reasons" class="departure-reasons ${q.canDepart?'':'is-blocked'}" role="status">${q.canDepart?'출발 가능 · 확정 전 비용 없음':q.reasons.map(esc).join('<br>')}</div><p class="trial-note">좌표·노선·기간·운임·적재는 시험값입니다.</p>`);
  const mapPanel = windowSurface(`<div class="panel-caption">${icon('map')}월드맵<span class="caption-meta" id="current-location">▲ 실제 위치 · ${esc(currentText())}</span></div><div class="map-viewport" id="map-viewport">${mapSvg()}<div class="map-tools" aria-label="지도 표시 도구"><button class="tool-button" data-action="zoom-in" aria-label="지도 확대">${icon('plus')}</button><button class="tool-button" data-action="zoom-out" aria-label="지도 축소">${icon('minus')}</button><button class="tool-button" data-action="map-fit" aria-label="지도 전체 보기">${icon('fit')}</button></div><span class="map-scale">${Math.round(ui.map.zoom*100)}% · 지도 표시 배율</span></div><div class="map-legend"><span><span class="legend-dot legend-current">▲</span>실제 위치</span><span><span class="legend-dot">◆</span>선택 목적지</span><span>┄ 공개 시험 노선</span><span>드래그 / 휠로 지도 보기</span></div>`,'map-panel');
  const destinationPanel = windowSurface(`<div class="panel-caption">목적지<span class="caption-meta">표식·목록 선택 동기화</span></div>${selectableList(destinationItems(),{selectedId:state.selectedId,currentId:state.location.cityId,label:'공개된 목적지'})}${detail}`,'destination-panel');
  return `${contextHeader('여행 계획','현재 위치에서 이어지는 공개 노선을 살펴보세요.',stats())}<div class="world-layout">${mapPanel}${destinationPanel}</div>${reviewBanner()}${actionDock({auxiliary:auxiliary(),note:'선택은 실제 이동이 아닙니다.',back:button('현장으로','field',{symbol:'back'}),primary:button('출발 준비','prepare',{primary:true,disabled:!q.canDepart,symbol:'arrow'})})}`;
}

function journeyLandscape() {
  const j=state.journey,p=j.elapsed/j.total;
  return `<div class="journey-banner"><svg viewBox="0 0 1200 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="journeySky" x2="0" y2="1"><stop stop-color="#95aca8"/><stop offset="1" stop-color="#d8d1ad"/></linearGradient></defs><rect width="1200" height="260" fill="url(#journeySky)"/><path d="m0 170 120-67 78 42 134-103 102 84 80-56 115 88 107-103 90 88 67-48 117 73 100-89 90 96v85H0Z" fill="#7d9286"/><path d="m198 145 134-103 102 84-85-44-32 26-17-10-32 32zM629 158 736 55l90 88-75-44-28 30-20-8z" fill="#d6d4bd"/><path d="m0 196 160-32 134 30 150-23 160 27 174-32 180 32 242-22v84H0Z" fill="#8f9b7b"/><path d="M0 231c300-58 460 28 682-9s300-4 518-24v62H0" fill="#b8ab85"/><path d="M0 244c300-58 460 28 682-9s300-4 518-24" stroke="#e3d0a2" stroke-width="7" fill="none"/>${Array.from({length:12},(_,i)=>`<path d="m${40+i*112} 200 14-45 15 45zm3-17 12-34 12 34z" fill="#56776b"/>`).join('')}<g transform="translate(${230+p*650} 179)"><ellipse cx="0" cy="59" rx="85" ry="10" fill="#283b3433"/><path d="M-69 2q50-24 109 0v45H-69Z" fill="#354e51" stroke="#213a3b" stroke-width="3"/><path d="M-61 6h96v7h-96z" fill="#bba06f"/><rect x="-57" y="17" width="22" height="20" fill="#d9c994"/><rect x="-24" y="17" width="22" height="20" fill="#d9c994"/><path d="M10 15h22v31H10" fill="#697b6a"/><path d="M-80 45H51l12-19h21l13 11 8 15h-55" fill="none" stroke="#374a43" stroke-width="7"/><circle cx="-43" cy="48" r="18" fill="#c6ac78" stroke="#364d49" stroke-width="5"/><circle cx="27" cy="48" r="18" fill="#c6ac78" stroke="#364d49" stroke-width="5"/><path d="M-43 30v36m-18-18h36M27 30v36M9 48h36" stroke="#69715b" stroke-width="2"/></g></svg><div class="banner-title"><p>JOURNEY · ${esc(phaseText())}</p><strong>${esc(nameOf(j.from))} → ${esc(nameOf(j.to))}</strong></div></div>`;
}
function journeyMap() {
  const j=state.journey,[u,v]=routePoint(j.points,j.elapsed/j.total);
  return `<div class="journey-map-inset"><svg viewBox="0 0 1511 1041" preserveAspectRatio="xMidYMid meet" role="img" aria-label="원본 월드맵 위 실제 여정 진행 위치"><image href="assets/world_map_source.png" width="1511" height="1041"/><polyline points="${j.points.map(([x,y])=>`${x*1511},${y*1041}`).join(' ')}" fill="none" stroke="#f9dfa8" stroke-width="10" stroke-dasharray="20 12"/><circle cx="${u*1511}" cy="${v*1041}" r="32" fill="#377583" stroke="#e9f6ed" stroke-width="10"/><path transform="translate(${u*1511} ${v*1041})" d="m0-20 17 35-17-8-17 8z" fill="#fff4d4"/></svg><span>실제 여정 위치 · 시험 노선</span></div>`;
}
function renderJourney() {
  const j=state.journey;
  if(!j){ui.screen='worldmap';return renderWorldMap();}
  const stopped=state.phase==='stopped',arrived=state.phase==='arrived',remaining=j.total-j.elapsed;
  const notice=arrived?'화물은 파티에 그대로 있습니다. 현지 거래는 별도 행동입니다.':stopped?'현장을 확인하거나 원래 여정을 재개하세요.':'화면을 읽는 동안 날짜는 흐르지 않습니다. 진행 버튼으로 하루씩 이동합니다.';
  const progress = `<div class="journey-progress"><div class="journey-route-heading"><h2>${esc(nameOf(j.from))} <span aria-hidden="true">→</span> ${esc(nameOf(j.to))}</h2><span class="phase-badge ${stopped?'is-stopped':''}">${esc(phaseText())}</span></div><div class="progress-track"><div class="progress-fill" style="width:${j.elapsed/j.total*100}%"></div>${[0,j.stopDay,j.total].map(day=>`<span class="progress-stop ${day<=j.elapsed?'is-passed':''}" style="left:${day/j.total*100}%"></span>`).join('')}</div><div class="progress-labels"><span>출발</span><span>${j.stopDay}일차 · 정차</span><span>${j.total}일차 · 도착</span></div></div>`;
  const history=state.records.slice(-3).map(r=>`<div>경과 ${r.day}일 · ${({departure:`출발 확정 · 운임 ${num(r.cost)} G 1회 지급`,stop:'정차 경계 도달 · 여정 일시 정지',resume:'원래 여정 재개 · 추가 운임 없음',arrival:'목적지 도착 · 화물 보존'})[r.type]}</div>`).join('');
  const main=windowSurface(`<div class="journey-visual">${journeyLandscape()}${journeyMap()}</div>${progress}<div class="journey-status-copy"><p>${arrived?'목적지에 도착했습니다.':stopped?'노선 중간 정차 지점에 머무르고 있습니다.':'다음 구간으로 이동할 준비가 되었습니다.'}</p><p>${esc(notice)}</p></div><div class="journey-history" aria-label="이동 처리 기록">${history}</div>`,'journey-main');
  const vehicle=transportOf(j.transportId);
  const summary=windowSurface(`<p class="eyebrow">TRAVEL MANIFEST</p><h3>${arrived?'도착 확인':stopped?'정차 현황':'남은 여정'}</h3><div class="remaining"><strong id="remaining-days">${remaining}</strong><span>일 남음</span></div>${detailRow('현재 위치',`<span id="current-location">${esc(currentText())}</span>`,'pin')}${detailRow('이동수단',esc(vehicle.name),'cart')}${detailRow('현재 화물',`<span id="cargo-value">${state.cargo} / ${vehicle.capacity}</span><span class="value-unit">칸</span>`,'cargo')}${detailRow('지급한 운임',`${num(j.paid)}<span class="value-unit">G</span>`,'coin')}${detailRow('동행 인원',`${state.actorIds.length} / 8<span class="value-unit">명</span>`,'people')}<div class="summary-actors">${data.actors.filter(a=>state.actorIds.includes(a.id)).map(a=>`<span class="actor-name">${esc(a.name)}</span>`).join('')}</div>${arrived?`<div class="arrival-seal">${icon('check')}위치 반영 완료 · 1회</div>`:''}<p class="summary-notice">${esc(notice)}</p>`,'journey-summary',{scroll:true});
  const primary=arrived?button('현지로 이동','field',{primary:true,symbol:'arrow'}):stopped?button('여정 재개','resume',{primary:true,symbol:'arrow'}):button('1일 진행','advance',{primary:true,symbol:'clock'});
  const back=stopped?button('현장 확인','inspect-stop',{symbol:'pin'}):arrived?button('월드맵','worldmap',{symbol:'map'}):'';
  return `${contextHeader(arrived?'목적지 도착':'여정 현황','실제 위치·남은 구간·화물은 같은 여정 상태에서 표시합니다.',stats())}<div class="journey-layout">${main}${summary}</div>${reviewBanner()}${actionDock({auxiliary:auxiliary(),note:arrived?'자동 판매·귀환·보상 없음':stopped?'현장 열람은 추가 시간·비용 없음':'진행 1회 = 시험 시간 1일',back,primary})}`;
}

function departureBody() {
  const q=quote(state,data);
  return `<div class="journey-endpoints"><div class="endpoint">${icon('pin')}<div><small>실제 출발지</small><strong>${esc(nameOf(q.from))}</strong></div></div>${icon('arrow')}<div class="endpoint"><div><small>선택 목적지</small><strong>${esc(q.destination?.shortName)}</strong></div>${icon('flag')}</div></div><div class="confirmation-grid">${detailRow('이동 기간',`${q.days??'—'}<span class="value-unit">일</span>`,'clock')}${detailRow('이동수단',esc(q.transport?.name),'cart')}${detailRow('이동 비용',`${q.cost!==null?num(q.cost):'—'}<span class="value-unit">G</span>`,'coin')}${detailRow('현재 화물',`${state.cargo} / ${q.transport?.capacity??'—'}<span class="value-unit">칸</span>`,'cargo')}${detailRow('출발 후 잔금',`${q.remainingMoney!==null?num(q.remainingMoney):'—'}<span class="value-unit">G</span>`,'coin',true)}${detailRow('동행 인원',`${state.actorIds.length} / 8<span class="value-unit">명</span>`,'people',true)}</div><div class="confirmation-copy" id="confirm-description"><strong>이 계획으로 출발하시겠습니까?</strong>확정하면 시험 운임을 한 번 지급하고 여정을 시작합니다.<br>시간은 여정 화면에서 직접 진행합니다.</div><p class="confirmation-fine">취소하면 돈·날짜·실제 위치는 바뀌지 않습니다.<br>기간·운임·적재·도시 좌표는 UI 검토용 시험값입니다.</p>${q.canDepart?'':`<div class="modal-error">${q.reasons.map(esc).join('<br>')}</div>`}`;
}
function renderModal() {
  field?.clearKeys();
  root.querySelector('#screen-content').inert=true;
  const departure=ui.modal==='departure';
  const body=departure?departureBody():`<div class="help-body" id="confirm-description"><p>이 화면은 <strong>SYS-02 이동 UI 검토 목업</strong>입니다. 도시 위치·노선·기간·운임·화물과 현장 스프라이트는 시험 데이터입니다.</p><p>필드에서 WASD/방향키로 이동하고 Shift로 걷습니다. M으로 월드맵을 열고, 목적지·수단을 확인한 뒤 출발을 확정합니다. 여정은 직접 시간을 진행하며, 정차 뒤 같은 여정으로 복귀합니다.</p><p>3D 공간은 브라우저의 간이 표현입니다. <strong>Map Tool·Godot·Hera는 연결되지 않았습니다.</strong> 파티 정원은 8명이며 이번 시연에는 본작 인물 4명을 사용합니다.</p><p>상태는 탭 메모리에만 유지됩니다. 새로고침하면 초기 시험 상태로 돌아갑니다. 게임 저장·자동 거래·다음 시스템은 포함하지 않습니다.</p></div>`;
  root.querySelector('#modal-host').innerHTML=confirmDialog(body,actionDock({back:button(departure?'취소':'닫기','cancel-modal'),primary:departure?button('출발 확정','confirm-depart',{primary:true,symbol:'arrow',disabled:!quote(state,data).canDepart}):'',note:departure?'실행 전 최종 확인':''}),{title:departure?'출발 확인':'이동 목업 검토 안내',eyebrow:departure?'DEPARTURE REVIEW':'REVIEW GUIDE'});
  root.querySelector('[data-action="cancel-modal"]').focus({preventScroll:true});
}
function openModal(type) { preserveListScroll();ui.returnFocus=focusSelector();ui.modal=type;renderModal(); }
function closeModal() { ui.modal=null;root.querySelector('#modal-host').replaceChildren();root.querySelector('#screen-content').inert=false;restoreFocus(ui.returnFocus); }
function toast(message) {
  clearTimeout(toastTimer);root.querySelector('.toast')?.remove();
  const item=document.createElement('div');item.className='toast';item.setAttribute('role','status');item.textContent=message;root.append(item);
  toastTimer=setTimeout(()=>item.remove(),3500);
}

root.addEventListener('click',event=>{
  const marker=event.target.closest('[data-destination]');
  if(marker&&!ui.modal&&ui.screen==='worldmap'){
    preserveListScroll();if(selectDestination(state,marker.dataset.destination,data))render(marker.classList.contains('destination-row')?`.destination-row[data-destination="${state.selectedId}"]`:`.map-marker[data-destination="${state.selectedId}"]`);return;
  }
  const action=event.target.closest('[data-action]')?.dataset.action;
  if(!action)return;
  if(ui.modal&&!['cancel-modal','confirm-depart'].includes(action))return;
  if(action==='cancel-modal'){closeModal();return;}
  if(action==='help'){openModal('help');return;}
  if(action==='prepare'){if(quote(state,data).canDepart)openModal('departure');return;}
  if(action==='confirm-depart'){
    if(ui.modal!=='departure')return;
    const result=applyTravelAction(state,'depart',data,{clickCount:event.detail});
    if(result.ok){ui.modal=null;ui.screen='journey';render('[data-action="advance"]');toast('출발 확정 · 운임을 한 번 지급했습니다.');}
    else if(!result.ignored){renderModal();toast(result.reasons.join(' '));}return;
  }
  if(action==='worldmap'){
    if(onRoad()){ui.screen='journey';render();return;}
    ui.screen='worldmap';render(`.destination-row[data-destination="${state.selectedId}"]`);return;
  }
  if(action==='field'){ui.screen=state.phase==='stopped'?'stop-field':'field';render('[data-action="worldmap"]');return;}
  if(action==='journey'){ui.screen='journey';render();return;}
  if(action==='inspect-stop'&&state.phase==='stopped'){ui.screen='stop-field';render('[data-action="journey"]');return;}
  if(action==='advance'){
    if(applyTravelAction(state,'advance',data,{clickCount:event.detail}).ok){render(state.phase==='stopped'?'[data-action="inspect-stop"]':state.phase==='arrived'?'[data-action="field"]':'[data-action="advance"]');}
    return;
  }
  if(action==='resume'){if(applyTravelAction(state,'resume',data,{clickCount:event.detail}).ok)render('[data-action="advance"]');return;}
  if(action==='zoom-in'||action==='zoom-out'||action==='map-fit'){
    if(action==='map-fit')ui.map={zoom:1,cx:755.5,cy:520.5};else ui.map.zoom=Math.max(1,Math.min(2.5,ui.map.zoom+(action==='zoom-in'?.25:-.25)));
    updateMapView();return;
  }
});
root.addEventListener('change',event=>{
  if(event.target.id==='transport-select'&&!ui.modal){preserveListScroll();selectTransport(state,event.target.value,data);render('#transport-select');}
});
function updateMapView(){clampMap();root.querySelector('#world-map')?.setAttribute('viewBox',mapViewBox());const label=root.querySelector('.map-scale');if(label)label.textContent=`${Math.round(ui.map.zoom*100)}% · 지도 표시 배율`;}
function clampMap(){const hx=755.5/ui.map.zoom,hy=520.5/ui.map.zoom;ui.map.cx=Math.max(hx,Math.min(1511-hx,ui.map.cx));ui.map.cy=Math.max(hy,Math.min(1041-hy,ui.map.cy));}
let drag=null;
root.addEventListener('pointerdown',event=>{
  if(ui.modal||ui.screen!=='worldmap'||!event.target.closest('#map-viewport')||event.target.closest('button,[data-destination]'))return;
  drag={x:event.clientX,y:event.clientY,cx:ui.map.cx,cy:ui.map.cy};root.setPointerCapture(event.pointerId);
});
root.addEventListener('pointermove',event=>{
  if(!drag)return;
  const rect=root.querySelector('#world-map')?.getBoundingClientRect();if(!rect)return;
  const scale=Math.min(rect.width/(1511/ui.map.zoom),rect.height/(1041/ui.map.zoom));
  ui.map.cx=drag.cx-(event.clientX-drag.x)/scale;ui.map.cy=drag.cy-(event.clientY-drag.y)/scale;updateMapView();
});
root.addEventListener('pointerup',()=>{drag=null;});root.addEventListener('pointercancel',()=>{drag=null;});
root.addEventListener('wheel',event=>{
  if(ui.modal||!event.target.closest('#map-viewport'))return;
  event.preventDefault();ui.map.zoom=Math.max(1,Math.min(2.5,ui.map.zoom+(event.deltaY<0?.15:-.15)));updateMapView();
},{passive:false});

addEventListener('keydown',event=>{
  if(!state)return;
  const key=event.key.toLowerCase();
  if(event.isComposing||event.keyCode===229){if(key==='enter')event.preventDefault();return;}
  if(event.repeat&&(key==='enter'||key===' ')){event.preventDefault();return;}
  if(ui.modal){
    if(key==='escape'){event.preventDefault();closeModal();return;}
    if(key==='tab'){
      const focusables=[...root.querySelector('[role="dialog"]').querySelectorAll('button:not(:disabled),select,[tabindex="0"]')];
      const first=focusables[0],last=focusables.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }return;
  }
  if(event.target.closest('select'))return;
  if((ui.screen==='field'||ui.screen==='stop-field')&&['w','a','s','d','shift','arrowup','arrowdown','arrowleft','arrowright'].includes(key)){
    event.preventDefault();field?.keys.add(key);return;
  }
  if(event.repeat)return;
  if(key==='escape'&&ui.screen==='worldmap'){event.preventDefault();ui.screen='field';render('[data-action="worldmap"]');return;}
  if(key==='m'&&ui.screen==='field'){event.preventDefault();ui.screen='worldmap';render(`.destination-row[data-destination="${state.selectedId}"]`);return;}
  if(key==='j'&&state.journey){event.preventDefault();ui.screen='journey';render();return;}
  const nativeControl=event.target.closest('button,a,input,select,textarea,[contenteditable=true],[role=button]');
  if((key==='e'||key==='enter')&&!nativeControl&&(ui.screen==='field'||ui.screen==='stop-field')&&ui.near){event.preventDefault();ui.screen=ui.screen==='stop-field'?'journey':'worldmap';render();return;}
  if(ui.screen==='worldmap'&&(key==='arrowdown'||key==='arrowup')&&!event.shiftKey){
    event.preventDefault();const locations=data.locations.filter(l=>l.public),i=locations.findIndex(l=>l.id===state.selectedId),next=locations[(i+(key==='arrowdown'?1:-1)+locations.length)%locations.length];
    preserveListScroll();selectDestination(state,next.id,data);if(ui.map.zoom>1){ui.map.cx=next.u*1511;ui.map.cy=next.v*1041;clampMap();}render(`.destination-row[data-destination="${next.id}"]`);root.querySelector(`.destination-row[data-destination="${next.id}"]`)?.scrollIntoView({block:'nearest'});return;
  }
  if(ui.screen==='worldmap'&&event.shiftKey&&['arrowup','arrowdown','arrowleft','arrowright'].includes(key)){
    event.preventDefault();ui.map.cx+=(key==='arrowright'?70:key==='arrowleft'?-70:0)/ui.map.zoom;ui.map.cy+=(key==='arrowdown'?70:key==='arrowup'?-70:0)/ui.map.zoom;updateMapView();return;
  }
  if(ui.screen==='worldmap'&&(key==='+'||key==='='||key==='-')){event.preventDefault();ui.map.zoom=Math.max(1,Math.min(2.5,ui.map.zoom+(key==='-'?-.25:.25)));updateMapView();return;}
  if(event.target.matches('.map-marker')&&(key==='enter'||key===' ')){event.preventDefault();event.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}
});
addEventListener('keyup',event=>field?.keys.delete(event.key.toLowerCase()));
addEventListener('blur',()=>field?.clearKeys());
document.addEventListener('visibilitychange',()=>{if(document.hidden)field?.clearKeys();});

try {
  const skinResponse=await fetch('assets/skin-manifest.json');if(!skinResponse.ok)throw new Error(`UI 에셋 목록 HTTP ${skinResponse.status}`);
  const skinManifest=await skinResponse.json();
  await Promise.all([...skinManifest.skins.map(s=>s.display),'assets/world_map_source.png'].map(src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=()=>reject(new Error(`UI 이미지 로드 실패: ${src}`));image.src=src;})));
  root.dataset.artReady='true';
  const response=await fetch('data/review_data.json');if(!response.ok)throw new Error(`시험 데이터 HTTP ${response.status}`);
  data=await response.json();state=createState(data);render();
} catch(error){
  console.error(error);root.innerHTML=`<div class="boot-message"><h1>목업을 열 수 없습니다.</h1><p>README의 로컬 HTTP 실행 방법을 확인해 주세요.</p><p>${esc(error.message)}</p></div>`;
}
