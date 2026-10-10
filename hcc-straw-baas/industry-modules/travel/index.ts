import { Hono } from "hono";

const app = new Hono();

// Booking & Itinerary Logic
app.get("/bookings", async (c) => {
	return c.json({ bookings: [], status: "upcoming" });
});

app.post("/flights/search", async (c) => {
	return c.json({ results: [], count: 0 });
});

export default app;
