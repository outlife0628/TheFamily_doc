export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
export const formatNumber = value => new Intl.NumberFormat('ko-KR').format(value);

const paths = {
  compass: '<circle cx="16" cy="16" r="11"/><path d="M16 1v5m0 20v5M1 16h5m20 0h5M21 11l-3 7-7 3 3-7z"/>',
  map: '<path d="m3 7 8-3 10 4 8-3v21l-8 3-10-4-8 3zM11 4v21M21 8v21"/>',
  pin: '<path d="M25 13c0 7-9 15-9 15S7 20 7 13a9 9 0 1 1 18 0Z"/><circle cx="16" cy="13" r="3"/>',
  cart: '<path d="M5 8h15v13H5zM2 21h26l-5-9h-3M9 8V4h7v4M10 13h5m-5 4h5"/><circle cx="9" cy="25" r="3"/><circle cx="23" cy="25" r="3"/>',
  cargo: '<path d="m3 9 13-6 13 6v16l-13 5-13-5zM3 9l13 6 13-6M16 15v15M9 6l14 6v6"/>',
  clock: '<circle cx="16" cy="17" r="11"/><path d="M16 10v8l5 3M12 2h8M16 2v4"/>',
  coin: '<ellipse cx="16" cy="8" rx="11" ry="5"/><path d="M5 8v7c0 7 22 7 22 0V8M5 15v8c0 7 22 7 22 0v-8M5 17c3 6 19 6 22 0"/>',
  people: '<circle cx="13" cy="9" r="5"/><path d="M3 28v-6c0-9 20-9 20 0v6M23 5a5 5 0 0 1 0 10m4 13v-7c0-3-2-5-5-6"/>',
  arrow: '<path d="M5 16h21M18 8l8 8-8 8"/>',
  back: '<path d="M27 16H6m8-8-8 8 8 8"/>',
  check: '<path d="m6 17 7 7L27 8"/>',
  info: '<circle cx="16" cy="16" r="13"/><path d="M16 14v9m0-15v2"/>',
  close: '<path d="m8 8 16 16M24 8 8 24"/>',
  sun: '<circle cx="16" cy="16" r="6"/><path d="M16 1v5m0 20v5M1 16h5m20 0h5M5 5l4 4m14 14 4 4M5 27l4-4M23 9l4-4"/>',
  flag: '<path d="M7 29V3m0 2c7-6 12 6 20 0v14c-8 6-13-6-20 0"/>',
  rail: '<path d="M8 29 11 3m13 26L21 3M10 8h12M9 15h14M8 23h16M6 29h20"/>',
  leaf: '<path d="M27 4C9 2 1 18 11 24S30 18 27 4ZM5 29l17-18"/>',
  mountain: '<path d="m2 27 12-23 7 14 4-6 6 15ZM10 12l4 4 4-4"/>',
  anchor: '<path d="M16 12v17M8 16h16M3 20c0 12 26 12 26 0M3 20v6m26-6v6"/><circle cx="16" cy="7" r="4"/>',
  plus: '<path d="M16 6v20M6 16h20"/>',
  minus: '<path d="M6 16h20"/>',
  fit: '<path d="M3 12V3h9m8 0h9v9M3 20v9h9m8 0h9v-9"/>',
  walk: '<circle cx="19" cy="5" r="3"/><path d="m16 11-5 6-5 1m10-7 5 7 6 2m-11-9-1 10-6 9m6-9 7 9"/>'
};
export function icon(name, className = '') {
  if (name === 'compass') return `<img class="icon asset-compass ${className}" src="assets/skins/compass.svg" alt="" aria-hidden="true" draggable="false">`;
  return `<svg class="icon ${className}" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.compass}</svg>`;
}
export function button(label, action, { primary = false, disabled = false, symbol = '', extra = '' } = {}) {
  return `<button type="button" class="action-button ${primary ? 'button-primary' : 'button-secondary'}" data-action="${escapeHTML(action)}" ${disabled ? 'disabled' : ''} ${extra}>${symbol ? icon(symbol) : ''}<span>${escapeHTML(label)}</span></button>`;
}
export function actionDock({ primary = '', back = '', auxiliary = '', note = '' }) {
  return `<footer class="action-dock"><div class="dock-aux">${auxiliary}${note ? `<span class="dock-note">${escapeHTML(note)}</span>` : ''}</div><div class="dock-main"><div class="back-slot">${back}</div><div class="primary-slot">${primary}</div></div></footer>`;
}
export function windowSurface(content, className = '', { scroll = false } = {}) {
  return `<section class="window-surface ${className}">${scroll ? `<div class="surface-scroll">${content}</div>` : content}</section>`;
}
export function detailRow(label, value, symbol, emphasis = false) {
  return `<div class="detail-row ${emphasis ? 'is-emphasized' : ''}"><span class="detail-label">${symbol ? icon(symbol) : ''}${escapeHTML(label)}</span><strong>${value}</strong></div>`;
}
export function detailPane(content) {
  return `<div class="destination-detail">${content}</div>`;
}
export function selectableList(items, { selectedId, currentId = '', label = '목록' } = {}) {
  const rows = items.map(item => `<button type="button" role="option" class="destination-row ${currentId === item.id ? 'is-current' : ''}" data-destination="${escapeHTML(item.id)}" aria-selected="${selectedId === item.id}">${icon(item.symbol)}<span class="row-name">${escapeHTML(item.name)}</span><span class="row-tag">${escapeHTML(item.tag)}</span></button>`).join('');
  return `<div class="destination-list" role="listbox" aria-label="${escapeHTML(label)}">${rows}</div>`;
}
export function contextHeader(title, subtitle, stats = '') {
  return `<header class="shell-header"><div class="header-title">${icon('compass', 'header-emblem')}<div><p class="eyebrow">THE FAMILY · FATHER OF STEAM</p><h1>${escapeHTML(title)}</h1><p class="header-subtitle">${escapeHTML(subtitle)}</p></div></div><div class="header-stats">${stats}</div></header>`;
}
export function confirmDialog(body, footer, { title, eyebrow = 'DEPARTURE REVIEW', descriptionId = 'confirm-description' }) {
  return `<div class="modal-backdrop"><section class="window-surface confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="${descriptionId}" tabindex="-1"><header class="modal-header"><div><p class="eyebrow">${escapeHTML(eyebrow)}</p><h2 id="modal-title">${escapeHTML(title)}</h2></div>${icon('compass')}</header><div class="modal-body">${body}</div>${footer}</section></div>`;
}
