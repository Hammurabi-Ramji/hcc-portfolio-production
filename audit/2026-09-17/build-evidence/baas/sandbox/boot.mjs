// Audit sandbox bootstrap: import the real service default exports and serve them.
import { serve } from '@hono/node-server';

const auth = (await import('./packages/auth-service/index.ts')).default;
const data = (await import('./packages/data-service/index.ts')).default;

serve({ fetch: auth.fetch, port: 3101 }, (info) => {
  console.log(`auth-service on http://localhost:${info.port}`);
});
serve({ fetch: data.fetch, port: 3102 }, (info) => {
  console.log(`data-service on http://localhost:${info.port}`);
});
