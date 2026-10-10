import { Hono } from "hono";

const app = new Hono();

// Online Store Logic
app.get("/products", async (c) => {
	return c.json({ products: [], category: "all" });
});

app.post("/orders", async (c) => {
	return c.json({ orderId: "ORD-555", status: "processing" });
});

export default app;
