import http from 'node:http';
import { config } from 'dotenv';
import productsHandler from './api/products.js';

config({ path: new URL('../../.env', import.meta.url) });

type Handler = (req: any, res: any) => Promise<void>;

function makeRes(nodeRes: http.ServerResponse) {
  const res: any = {};
  res.status = (code: number) => {
    nodeRes.statusCode = code;
    return res;
  };
  res.json = (body: unknown) => {
    nodeRes.setHeader('Content-Type', 'application/json');
    nodeRes.end(JSON.stringify(body));
    return res;
  };
  return res;
}

const server = http.createServer((nodeReq, nodeRes) => {
  const url = new URL(nodeReq.url ?? '/', 'http://localhost');
  const method = (nodeReq.method ?? 'GET').toUpperCase();

  let chunks = '';
  nodeReq.on('data', (c) => {
    chunks += c;
  });
  nodeReq.on('end', async () => {
    let body: unknown;
    if (chunks) {
      try {
        body = JSON.parse(chunks);
      } catch {
        body = undefined;
      }
    }
    const query: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      query[key] = value;
    });
    const req: any = { method, query, body, headers: { cookie: nodeReq.headers.cookie } };
    const run = async (handler: Handler) => {
      try {
        await handler(req, makeRes(nodeRes));
      } catch (err) {
        nodeRes.statusCode = 500;
        nodeRes.setHeader('Content-Type', 'application/json');
        nodeRes.end(JSON.stringify({ error: err instanceof Error ? err.message : 'internal error' }));
      }
    };
    if (url.pathname === '/api/products' && method === 'GET') {
      await run(productsHandler as unknown as Handler);
      return;
    }
    nodeRes.statusCode = 404;
    nodeRes.setHeader('Content-Type', 'application/json');
    nodeRes.end(JSON.stringify({ error: 'not found' }));
  });
});

server.listen(3003, () => {
  console.log('public-website dev api on http://localhost:3003 (vite proxies /api here)');
});
