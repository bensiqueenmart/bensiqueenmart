import { isAuthenticated } from './_auth.js';

/**
 * GitHub Contents-API proxy for the website edit console.
 *
 * Commits target the PUBLIC WEBSITE's data files inside this same repo
 * (repo-relative paths below) — no runtime dependency on any other app.
 * The site itself keeps rendering from its bundled copies at build time.
 *
 * GET  ?path=<file> → { content (parsed JSON), sha }
 * PUT  { path, content (object), sha, message } → { sha: newSha }
 *
 * Security, all server-side:
 * - Requires a valid admin-console session (same import as every other
 *   admin endpoint — single auth, single source of truth).
 * - Path must be exactly one of the registered files — nothing else in
 *   the repo is reachable, and traversal is impossible by construction.
 * - PUT bodies are JSON-validated and capped at 1MB before touching GitHub.
 * - Optimistic locking via blob SHA: concurrent edits 409 instead of
 *   silently overwriting each other.
 * - Upstream failures map to safe messages; the token and GitHub internals
 *   never leave the server.
 */

export const DATA_PATHS = [
  'apps/public-website/src/data/business.json',
  'apps/public-website/src/data/delivery.json',
  'apps/public-website/src/data/faqs.json',
  'apps/public-website/src/data/reviews.json',
  'apps/public-website/src/data/about.json',
  'apps/public-website/src/data/home.json',
  'apps/public-website/src/data/blog.json',
] as const;

const MAX_BYTES = 1024 * 1024;

function getGitHubConfig(): { token: string; owner: string; repo: string; branch: string } {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH ?? 'main';
  if (!token || !owner || !repo) {
    throw new Error('github not configured — set GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO');
  }
  return { token, owner, repo, branch };
}

class GitHubError extends Error {
  status: number;
  constructor(status: number) {
    super(`github ${status}`);
    this.status = status;
  }
}

interface GhFile {
  sha: string;
  text: string;
}

async function ghFetch(
  cfg: { token: string; owner: string; repo: string; branch: string },
  path: string,
  init?: { method: string; body?: string },
): Promise<{ status: number; json: unknown }> {
  const url =
    `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}` +
    (init ? '' : `?ref=${encodeURIComponent(cfg.branch)}&t=${Date.now()}`);
  const res = await fetch(url, {
    method: init?.method ?? 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${cfg.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init?.body,
  });
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

async function ghGetFile(
  cfg: { token: string; owner: string; repo: string; branch: string },
  path: string,
): Promise<GhFile> {
  const { status, json } = await ghFetch(cfg, path);
  if (status === 404) throw new GitHubError(404);
  if (status !== 200 || !json || typeof json !== 'object') throw new GitHubError(status || 502);
  const rec = json as Record<string, unknown>;
  if (typeof rec['content'] !== 'string' || typeof rec['sha'] !== 'string') {
    throw new GitHubError(502);
  }
  const text = Buffer.from((rec['content'] as string).replace(/\n/g, ''), 'base64').toString('utf8');
  return { sha: rec['sha'] as string, text };
}

async function ghPutFile(
  cfg: { token: string; owner: string; repo: string; branch: string },
  path: string,
  text: string,
  sha: string,
  message: string,
): Promise<string> {
  const { status, json } = await ghFetch(cfg, path, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: Buffer.from(text, 'utf8').toString('base64'),
      sha,
      branch: cfg.branch,
    }),
  });
  if (status === 404 || status === 422) throw new GitHubError(409);
  if (status !== 200 && status !== 201) throw new GitHubError(status || 502);
  const rec = (json ?? {}) as Record<string, unknown>;
  const content = rec['content'] as Record<string, unknown> | undefined;
  if (!content || typeof content['sha'] !== 'string') throw new GitHubError(502);
  return content['sha'] as string;
}

function firstString(v: unknown): string | null {
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0] as string;
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function githubFile(req: any, res: any): Promise<void> {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  let cfg: { token: string; owner: string; repo: string; branch: string };
  try {
    cfg = getGitHubConfig();
  } catch {
    res.status(500).json({ error: 'edit console not configured' });
    return;
  }

  try {
    if (req.method === 'GET') {
      const path = firstString(req.query?.path);
      if (!path || !(DATA_PATHS as readonly string[]).includes(path)) {
        res.status(400).json({ error: 'path not allowed' });
        return;
      }
      const file = await ghGetFile(cfg, path);
      let content: unknown;
      try {
        content = JSON.parse(file.text);
      } catch {
        res.status(502).json({ error: 'upstream error' });
        return;
      }
      res.status(200).json({ content, sha: file.sha });
      return;
    }

    if (req.method === 'PUT') {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const path = typeof body['path'] === 'string' ? (body['path'] as string) : null;
      const sha = typeof body['sha'] === 'string' ? (body['sha'] as string) : null;
      const message =
        typeof body['message'] === 'string' && (body['message'] as string).trim()
          ? (body['message'] as string).trim().slice(0, 140)
          : `Update ${path ?? 'site data'}`;
      if (!path || !(DATA_PATHS as readonly string[]).includes(path)) {
        res.status(400).json({ error: 'path not allowed' });
        return;
      }
      if (!sha) {
        res.status(400).json({ error: 'sha required' });
        return;
      }
      if (body['content'] === undefined || body['content'] === null) {
        res.status(400).json({ error: 'content required' });
        return;
      }
      let text: string;
      try {
        text = JSON.stringify(body['content'], null, 4);
      } catch {
        res.status(400).json({ error: 'content must be JSON-serializable' });
        return;
      }
      if (Buffer.byteLength(text, 'utf8') > MAX_BYTES) {
        res.status(400).json({ error: 'content too large' });
        return;
      }
      const newSha = await ghPutFile(cfg, path, text, sha, message);
      res.status(200).json({ sha: newSha });
      return;
    }

    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    if (err instanceof GitHubError) {
      if (err.status === 404) {
        res.status(404).json({ error: 'not found' });
        return;
      }
      if (err.status === 409) {
        res.status(409).json({ error: 'file changed elsewhere — reload and retry' });
        return;
      }
    }
    res.status(502).json({ error: 'upstream error' });
  }
}
