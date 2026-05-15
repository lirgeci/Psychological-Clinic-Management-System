// Small wrapper around fetch that attaches Authorization: Bearer <token>
// Reads token from cookie named 'token'. If no token present, calls fetch unchanged.
export default async function authFetch(input: RequestInfo, init: RequestInit = {}) {
  // Read token cookie
  const cookie = typeof document !== 'undefined' ? document.cookie : '';
  const tokenMatch = cookie.split('; ').find((c) => c.startsWith('token='));
  const token = tokenMatch ? tokenMatch.substring('token='.length) : null;

  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const merged: RequestInit = {
    ...init,
    headers,
  };

  return fetch(input, merged);
}
