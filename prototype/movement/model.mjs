// Pure in-memory review model. No real economy, calendar, persistence or Map Tool.
const inCity = s => s.phase === 'city' || s.phase === 'arrived';
const validInt = n => Number.isSafeInteger(n) && n >= 0;

export function createState(data) {
  return {
    phase: 'city', location: { kind: 'city', cityId: data.start.location },
    money: data.start.money, days: 0, cargo: data.start.cargo,
    actorIds: data.actors.map(a => a.id), transportId: data.start.transport,
    selectedId: 'human', journey: null, nextJourneyId: 1, records: []
  };
}

export function selectDestination(s, id, data) {
  if (!inCity(s) || !data.locations.some(l => l.id === id && l.public)) return false;
  s.selectedId = id;
  return true;
}

export function selectTransport(s, id, data) {
  if (!inCity(s) || !data.transports.some(t => t.id === id)) return false;
  s.transportId = id;
  return true;
}

export function quote(s, data) {
  const from = s.location.kind === 'city' ? s.location.cityId : null;
  const destination = data.locations.find(l => l.id === s.selectedId && l.public);
  const transport = data.transports.find(t => t.id === s.transportId);
  const route = data.routes.find(r => r.public && (
    (r.from === from && r.to === s.selectedId) || (r.to === from && r.from === s.selectedId)
  ));
  const reasons = [];
  if (!inCity(s) || !from) reasons.push('여정 중에는 새 출발을 확정할 수 없습니다.');
  if (!destination) reasons.push('공개된 목적지를 선택해 주세요.');
  if (from === s.selectedId) reasons.push('현재 위치입니다. 다른 목적지를 선택해 주세요.');
  else if (!route) reasons.push('현재 도시에서 직접 연결된 공개 노선이 없습니다.');
  if (route && !route.open) reasons.push(route.reason || '현재 이용할 수 없는 노선입니다.');
  if (!transport) reasons.push('유효한 이동수단을 선택해 주세요.');
  if (transport && !transport.owned) reasons.push('미보유 수단입니다. 현재 파티에 배정할 수 없습니다.');
  if (route && transport && !transport.kinds.includes(route.kind)) reasons.push('이 수단으로 이용할 수 없는 노선입니다.');
  if (!validInt(s.cargo)) reasons.push('화물 시험 데이터가 올바르지 않습니다.');
  else if (transport && s.cargo > transport.capacity) reasons.push(`적재 초과: 화물 ${s.cargo}칸 / 수송량 ${transport.capacity}칸.`);
  if (!s.actorIds.length || s.actorIds.length > 8) reasons.push('파티는 1~8명이어야 합니다.');
  if (route && (!validInt(route.cost) || !validInt(route.days) || route.days < 1 ||
    !validInt(route.stopDay) || route.stopDay < 1 || route.stopDay >= route.days)) reasons.push('노선의 기간·비용 시험 데이터가 올바르지 않습니다.');
  if (!validInt(s.money)) reasons.push('자금 시험 데이터가 올바르지 않습니다.');
  else if (route && validInt(route.cost) && s.money < route.cost) reasons.push(`자금 부족: ${route.cost - s.money} G가 더 필요합니다.`);
  return {
    from, destination, transport, route, reasons, canDepart: reasons.length === 0,
    cost: route && validInt(route.cost) ? route.cost : null,
    days: route && validInt(route.days) && route.days > 0 ? route.days : null,
    remainingMoney: route && validInt(route.cost) ? s.money - route.cost : null
  };
}

export function depart(s, data) {
  const q = quote(s, data);
  if (!q.canDepart) return { ok: false, reasons: q.reasons };
  const forward = q.route.from === q.from;
  s.journey = {
    id: s.nextJourneyId++, routeId: q.route.id, from: q.from, to: s.selectedId,
    transportId: s.transportId, total: q.days, elapsed: 0, paid: q.cost,
    stopDay: q.route.stopDay, stopName: q.route.stopName, stopHandled: false,
    points: structuredClone(forward ? q.route.points : [...q.route.points].reverse())
  };
  s.money -= q.cost;
  s.phase = 'traveling';
  s.location = { kind: 'route', routeId: q.route.id, elapsed: 0 };
  s.records.push({ type: 'departure', journeyId: s.journey.id, day: s.days, cost: q.cost });
  return { ok: true };
}

export function advance(s) {
  if (s.phase !== 'traveling' || !s.journey) return { ok: false };
  const j = s.journey;
  const boundary = j.stopHandled ? j.total : j.stopDay;
  const delta = Math.min(1, boundary - j.elapsed);
  if (delta <= 0) return { ok: false };
  j.elapsed += delta;
  s.days += delta;
  s.location = { kind: 'route', routeId: j.routeId, elapsed: j.elapsed };
  if (!j.stopHandled && j.elapsed === j.stopDay) {
    s.phase = 'stopped';
    s.records.push({ type: 'stop', journeyId: j.id, day: s.days });
  } else if (j.elapsed === j.total) {
    s.phase = 'arrived';
    s.location = { kind: 'city', cityId: j.to };
    s.records.push({ type: 'arrival', journeyId: j.id, cityId: j.to, day: s.days });
  }
  return { ok: true };
}

export function resume(s) {
  if (s.phase !== 'stopped' || !s.journey) return { ok: false };
  s.journey.stopHandled = true;
  s.phase = 'traveling';
  s.records.push({ type: 'resume', journeyId: s.journey.id, day: s.days });
  return { ok: true };
}
