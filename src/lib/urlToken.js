// Encode an object of URL params into a single opaque token (Base64 of URI-encoded JSON).
// Handles Unicode values (Urdu text, special chars) safely.
export function encodeViewParams(params) {
  return btoa(encodeURIComponent(JSON.stringify(params)));
}

// Decode a token produced by encodeViewParams. Returns null if invalid.
export function decodeViewToken(token) {
  try {
    return JSON.parse(decodeURIComponent(atob(token)));
  } catch {
    return null;
  }
}

// Build a /view-template URL with an opaque token instead of raw params.
export function buildViewUrl(params) {
  return `/view-template?t=${encodeViewParams(params)}`;
}
