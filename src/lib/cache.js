// src/lib/cache.js
// In-memory API response cache with TTL and in-flight deduplication.
// - cached(fn, keyFn, ttl)  – wrap a read fn; identical in-flight calls share one request
// - mutates(fn, ...ns)      – wrap a write fn; invalidates cache namespaces on success
// - invalidate(prefix)      – manually bust a namespace (e.g. after optimistic updates)
// - clear()                 – wipe everything (used by utilityService.clearCache)

const _store    = new Map(); // key → { data, expires }
const _inflight = new Map(); // key → Promise  (deduplication)

function _stableKey(v) {
  if (v === null || v === undefined) return '';
  if (typeof v !== 'object') return String(v);
  const sort = (x) => {
    if (typeof x !== 'object' || x === null) return x;
    if (Array.isArray(x)) return x.map(sort);
    return Object.fromEntries(
      Object.entries(x).sort(([a], [b]) => a.localeCompare(b)).map(([k, xv]) => [k, sort(xv)])
    );
  };
  return JSON.stringify(sort(v));
}

export function makeKey(ns, ...parts) {
  return parts.length ? `${ns}:${parts.map(_stableKey).join(':')}` : ns;
}

function _peek(key) {
  const e = _store.get(key);
  if (!e) return undefined;
  if (Date.now() > e.expires) { _store.delete(key); return undefined; }
  return e.data;
}

function _poke(key, data, ttl) {
  _store.set(key, { data, expires: Date.now() + ttl });
}

export function invalidate(prefix) {
  const p = prefix + ':';
  for (const k of [..._store.keys()])    if (k === prefix || k.startsWith(p)) _store.delete(k);
  for (const k of [..._inflight.keys()]) if (k === prefix || k.startsWith(p)) _inflight.delete(k);
}

export function clear() { _store.clear(); _inflight.clear(); }

export function cached(fn, keyFn, ttl) {
  return (...args) => {
    const key = keyFn(...args);
    const hit = _peek(key);
    if (hit !== undefined) return Promise.resolve(hit);
    if (_inflight.has(key)) return _inflight.get(key);

    const p = Promise.resolve(fn(...args))
      .then(res => { _poke(key, res, ttl); _inflight.delete(key); return res; })
      .catch(err => { _inflight.delete(key); throw err; });

    _inflight.set(key, p);
    return p;
  };
}

export function mutates(fn, ...namespaces) {
  return async (...args) => {
    const result = await fn(...args);
    namespaces.forEach(invalidate);
    return result;
  };
}
