// Small wrapper around fetch that attaches Authorization: Bearer <token>
// Reads token from cookie named 'token'. If a request returns 401, it tries a refresh once.
type AuthFetchInit = RequestInit & { _retry?: boolean };

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');

function readTokenCookie() {
  if (typeof document === 'undefined') {
    return null;
  }

  const tokenMatch = document.cookie.split('; ').find((c) => c.startsWith('token='));
  return tokenMatch ? tokenMatch.substring('token='.length) : null;
}

function writeTokenCookie(token: string) {
  if (typeof document === 'undefined') {
    return;
  }

  // Do not set Max-Age here — backend controls cookie lifetime.
  document.cookie = `token=${encodeURIComponent(token)}; Path=/; SameSite=Lax`;
}

function showSessionExpiredMessage() {
  if (typeof document === 'undefined') return;

  // Avoid multiple modals
  if (document.getElementById('session-expired-modal')) return;

  // Create overlay with blur
  const overlay = document.createElement('div');
  overlay.id = 'session-expired-modal';
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(7, 11, 20, 0.45)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    zIndex: '9999',
  });

  // Modal box
  const box = document.createElement('div');
  Object.assign(box.style, {
    minWidth: '320px',
    maxWidth: '520px',
    padding: '20px 24px',
    borderRadius: '12px',
    background: '#0f172a', // match dark UI background
    color: '#e6eef8',
    boxShadow: '0 12px 48px rgba(2,6,23,0.6)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'center',
    textAlign: 'center',
  });

  const icon = document.createElement('div');
  icon.innerHTML = '\u26A0';
  Object.assign(icon.style, {
    fontSize: '28px',
    color: '#ff7b7b',
  });

  const title = document.createElement('div');
  title.textContent = 'Session expired';
  Object.assign(title.style, {
    fontSize: '18px',
    fontWeight: '600',
    color: '#fff',
  });

  const message = document.createElement('div');
  message.textContent = 'Your session has expired. You will be redirected to the login page.';
  Object.assign(message.style, {
    fontSize: '14px',
    color: '#c7d2fe',
  });

  box.appendChild(icon);
  box.appendChild(title);
  box.appendChild(message);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // Auto-dismiss after 3.5s and redirect
  window.setTimeout(() => {
    const el = document.getElementById('session-expired-modal');
    if (el) el.remove();
    window.location.assign('/');
  }, 3500);
}

export default async function authFetch(input: RequestInfo, init: AuthFetchInit = {}) {
  const headers = new Headers(init.headers || {});
  const token = readTokenCookie();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const merged: AuthFetchInit = {
    ...init,
    headers,
  };

  const response = await fetch(input, merged);
  const requestUrl = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

  if (response.status !== 401 || merged._retry || requestUrl.includes('/auth/refresh')) {
    return response;
  }

  const refreshUrl = apiBaseUrl ? `${apiBaseUrl}/auth/refresh` : '/api/auth/refresh';
  const refreshResponse = await fetch(refreshUrl, {
    method: 'POST',
    credentials: 'include',
  });

  if (refreshResponse.status === 401) {
    // Attempt server-side logout to remove any refresh record, then clear client cookies.
    try {
      const logoutUrl = apiBaseUrl ? `${apiBaseUrl}/auth/logout` : '/api/auth/logout';
      await fetch(logoutUrl, { method: 'POST', credentials: 'include' });
    } catch (e) {
      // ignore network errors — we'll clear cookies client-side below
    }

    // Clear client-side token cookie (use Expires to avoid Max-Age client-side)
    if (typeof document !== 'undefined') {
      document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    }

    showSessionExpiredMessage();
    return response;
  }

  if (!refreshResponse.ok) {
    return response;
  }

  const refreshData = (await refreshResponse.json()) as { token?: string };
  if (!refreshData.token) {
    return response;
  }

  writeTokenCookie(refreshData.token);

  const retryHeaders = new Headers(init.headers || {});
  retryHeaders.set('Authorization', `Bearer ${refreshData.token}`);

  return fetch(input, {
    ...init,
    _retry: true,
    headers: retryHeaders,
  });
}
