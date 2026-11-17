import http from 'node:http';
import { config } from 'dotenv';
import productsHandler from './api/products.js';
import productBySlugHandler from './api/products/[slug].js';
import adjustHandler from './api/products/[slug]/adjust.js';
import combosHandler from './api/combos.js';
import comboBySlugHandler from './api/combos/[slug].js';
import signHandler from './api/images/sign.js';
import ordersHandler from './api/orders.js';
import orderByIdHandler from './api/orders/[id].js';
import loginHandler from './api/auth/login.js';
import logoutHandler from './api/auth/logout.js';
import meHandler from './api/auth/me.js';
import githubFileHandler from './api/edit/github-file.js';

config({ path: new URL('../../.env', import.meta.url) });

type Handler = (req: any, res: any) => Promise<void>;

const routes: Array<{ match: (path: string, method: string) => string | null; handler: Handler }> = [
  {
    match: (path, method) => (path === '/api/auth/login' && method === 'POST' ? 'login' : null),
    handler: loginHandler as unknown as Handler,
  },
  {
    match: (path, method) => (path === '/api/auth/logout' && method === 'POST' ? 'logout' : null),
    handler: logoutHandler as unknown as Handler,
  },
  {
    match: (path, method) => (path === '/api/auth/me' && method === 'GET' ? 'me' : null),
    handler: meHandler as unknown as Handler,
  },
  {
    match: (path, method) =>
      path === '/api/edit/github-file' && (method === 'GET' || method === 'PUT') ? 'github-file' : null,
    handler: githubFileHandler as unknown as Handler,
  },
  {
    match: (path) => (path === '/api/products' ? 'products' : null),
    handler: productsHandler as unknown as Handler,
  },
  {
    match: (path) => (path === '/api/combos' ? 'combos' : null),
    handler: combosHandler as unknown as Handler,
  },
  {
    match: (path, method) => (path === '/api/images/sign' && method === 'POST' ? 'sign' : null),
    handler: signHandler as unknown as Handler,
  },
  {
    match: (path) => {
      const m = path.match(/^\/api\/products\/([^/]+)\/adjust$/);
      return m ? `adjust:${decodeURIComponent(m[1])}` : null;
    },
    handler: adjustHandler as unknown as Handler,
  },
  {
    match: (path) => {
      const m = path.match(/^\/api\/products\/([^/]+)$/);
      return m ? `product:${decodeURIComponent(m[1])}` : null;
    },
    handler: productBySlugHandler as unknown as Handler,
  },
  {
    match: (path) => {
      const m = path.match(/^\/api\/combos\/([^/]+)$/);
      return m ? `combo:${decodeURIComponent(m[1])}` : null;
    },
    handler: comboBySlugHandler as unknown as Handler,
  },
  {
    match: (path) => (path === '/api/orders' ? 'orders' : null),
    handler: ordersHandler as unknown as Handler,
  },
  {
    match: (path) => {
      const m = path.match(/^\/api\/orders\/([^/]+)$/);
      return m ? `order:${decodeURIComponent(m[1])}` : null;
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
  res.setHeader = (name: string, value: string | string[]) => {
    nodeRes.setHeader(name, value);
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
        if (id.startsWith('product:')) query.slug = id.slice('product:'.length);
        else if (id.startsWith('adjust:')) query.slug = id.slice('adjust:'.length);
        else if (id.startsWith('combo:')) query.slug = id.slice('combo:'.length);
        else if (id.startsWith('order:')) query.id = id.slice('order:'.length);
        const req: any = { method, query, body, headers: { cookie: nodeReq.headers.cookie } };
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

server.listen(3002, () => {
  console.log('admin-console dev api on http://localhost:3002 (vite proxies /api here)');
});
