import { apiFetch } from './api.js';

export interface RemoteFile<T> {
  content: T;
  sha: string;
}

async function readError(res: Response, fallback: string): Promise<Error> {
  const body = await res.json().catch(() => ({}));
  const msg = (body as { error?: unknown }).error;
  return new Error(typeof msg === 'string' && msg ? msg : fallback);
}

export async function getDataFile<T>(apiBase: string, path: string): Promise<RemoteFile<T>> {
  const res = await apiFetch(apiBase, `/github-file?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw await readError(res, `fetch failed (${res.status})`);
  return (await res.json()) as RemoteFile<T>;
}

export async function putDataFile<T>(
  apiBase: string,
  path: string,
  content: T,
  sha: string,
  message: string,
): Promise<string> {
  const res = await apiFetch(apiBase, '/github-file', {
    method: 'PUT',
    body: JSON.stringify({ path, content, sha, message }),
  });
  if (!res.ok) throw await readError(res, `save failed (${res.status})`);
  const body = (await res.json()) as { sha?: unknown };
  if (typeof body.sha !== 'string') throw new Error('save failed (bad response)');
  return body.sha;
}
