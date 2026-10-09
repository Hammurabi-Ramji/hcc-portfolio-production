import { Hono } from "hono";

const app = new Hono();

// Property Management Logic
app.get("/listings", async (c) => {
	return c.json({ properties: [], type: "residential" });
});

app.post("/viewings", async (c) => {
	return c.json({ viewingId: "VW-222", status: "confirmed" });
});

export default app;
