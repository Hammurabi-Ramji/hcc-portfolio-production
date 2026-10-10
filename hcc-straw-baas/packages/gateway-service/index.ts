import { Hono } from "hono";

const app = new Hono();

// API Gateway & Routing
app.all("/v1/*", async (c) => {
	const path = c.req.path;
	return c.json({
		gateway: "HOLO-9 Gateway",
		version: "1.0.0",
		proxy_to: path,
		timestamp: new Date().toISOString(),
	});
});

export default app;
