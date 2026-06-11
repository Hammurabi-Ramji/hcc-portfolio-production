import { Hono } from "hono";

const app = new Hono();

// 3rd Party API Integrations
app.get("/connectors", async (c) => {
	return c.json({
		available: ["Stripe", "Twilio", "SendGrid", "OpenAI", "Slack"],
		active: ["Stripe", "OpenAI"],
	});
});

export default app;
