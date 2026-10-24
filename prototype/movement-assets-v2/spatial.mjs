// Review-space positions are UI context, independent of actual city/route state.
export const defaultPosition = () => ({ x: 960, y: 735 });
export const positionKey = (screen, location) => screen === 'stop-field' ? `stop:${location.routeId}` : `city:${location.cityId}`;
export const readPosition = (positions, key) => ({ ...(positions[key] || defaultPosition()) });
export const rememberPosition = (positions, key, point) => { positions[key] = { x: point.x, y: point.y }; };
// Centre the complete walkable rectangle inside the circular 240x167 crop.
// Its four corners and 13-unit marker halo stay within the radius of 83.5.
export const minimapPoint = point => [120 + (point.x - 960) / 6, 83.5 + (point.y - 795) / 5];
export function routePoint(points, fraction) {
  const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
  let distance=lengths.reduce((a,b)=>a+b,0)*Math.max(0,Math.min(1,fraction));
  for(let i=0;i<lengths.length;i++){
    if(distance<=lengths[i]){
      const t=lengths[i]===0?0:distance/lengths[i];
      return [points[i][0]+(points[i+1][0]-points[i][0])*t,points[i][1]+(points[i+1][1]-points[i][1])*t];
    }
    distance-=lengths[i];
  }
  return [...points.at(-1)];
}
