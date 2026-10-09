import { Hono } from "hono";

const app = new Hono();

// Content & Event Logic
app.get("/content", async (c) => {
	return c.json({ media: [], type: "streaming" });
});

app.post("/tickets/book", async (c) => {
	return c.json({ ticketId: "TKT-333", status: "reserved" });
});

export default app;
