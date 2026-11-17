import githubFile from '../../server/github.js';

/**
 * /api/edit/github-file — website edit-console GitHub proxy.
 * Same admin session as every other endpoint in this app.
 * GET  ?path=apps/public-website/src/data/x.json → { content, sha }
 * PUT  { path, content, sha, message? } → { sha }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any): Promise<void> {
  await githubFile(req, res);
}
