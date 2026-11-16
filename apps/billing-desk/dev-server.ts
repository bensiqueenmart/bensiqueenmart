import http from 'node:http';
import { config } from 'dotenv';
import productsHandler from './api/products.js';
import ordersHandler from './api/orders.js';
import orderByIdHandler from './api/orders/[id].js';

config({ path: new URL('../../.env', import.meta.url) });

type Handler = (req: any, res: any) => Promise<void>;

const routes: Array<{ match: (path: string, method: string) => string | null; handler: Handler }> = [
  {
    match: (path, method) => (path === '/api/products' && method === 'GET' ? 'products' : null),
    handler: productsHandler as unknown as Handler,
  },
  {
    match: (path) => (path === '/api/orders' ? 'orders' : null),
    handler: ordersHandler as unknown as Handler,
  },
  {
    match: (path) => {
      const m = path.match(/^\/api\/orders\/([^/]+)$/);
      return m ? decodeURIComponent(m[1]) : null;
    },
    handler: orderByIdHandler as unknown as Handler,
  },
];

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
    const query: Record<string, string | string[]> = {};
    url.searchParams.forEach((value, key) => {
      const prev = query[key];
      if (prev === undefined) query[key] = value;
      else if (Array.isArray(prev)) prev.push(value);
      else query[key] = [prev, value];
    });

    for (const route of routes) {
      const id = route.match(url.pathname, method);
      if (id !== null) {
        if (id !== 'products' && id !== 'orders') query.id = id;
        const req: any = { method, query, body };
        try {
          await route.handler(req, makeRes(nodeRes));
        } catch (err) {
          nodeRes.statusCode = 500;
          nodeRes.setHeader('Content-Type', 'application/json');
          nodeRes.end(JSON.stringify({ error: err instanceof Error ? err.message : 'internal error' }));
        }
        return;
      }
    }
    nodeRes.statusCode = 404;
    nodeRes.setHeader('Content-Type', 'application/json');
    nodeRes.end(JSON.stringify({ error: 'not found' }));
  });
});

server.listen(3001, () => {
  console.log('billing-desk dev api on http://localhost:3001 (vite proxies /api here)');
});
