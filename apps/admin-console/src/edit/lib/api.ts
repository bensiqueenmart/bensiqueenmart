/**
 * Session-aware fetch for the edit console. Auth rides on the admin-console
 * session cookie (same-origin via the /edit-api proxy), so no tokens ever
 * touch the browser. A 401 means the admin session expired — listeners (the
 * Website tab) redirect to the admin login.
 */
export const EDIT_SESSION_EXPIRED = 'edit-session-expired';

export async function apiFetch(apiBase: string, path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${apiBase}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (res.status === 401 && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EDIT_SESSION_EXPIRED));
  }
  return res;
}
