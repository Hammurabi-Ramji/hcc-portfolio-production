import { Hono } from "hono";

const app = new Hono();

// Industry-specific Delivery
app.post("/deliver/:industry", async (c) => {
	const industry = c.req.param("industry");
	return c.json({
		status: "delivered",
		industry,
		payload_type: "JSON_WEBHOOK",
	});
});

export default app;
