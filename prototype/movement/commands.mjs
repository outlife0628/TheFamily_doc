import { depart, advance, resume } from './model.mjs';

// A double-click must not activate the next command rendered in the same slot.
export function applyTravelAction(state, action, data, { clickCount = 1 } = {}) {
  if (clickCount > 1) return { ok: false, ignored: 'multiple-click' };
  if (action === 'depart') return depart(state, data);
  if (action === 'advance') return advance(state);
  if (action === 'resume') return resume(state);
  return { ok: false, ignored: 'unknown-action' };
}
