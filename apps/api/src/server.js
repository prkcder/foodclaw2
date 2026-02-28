import express from "express";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "api" });
});

// --- Users/Profile ---
app.post("/v1/users", (_req, res) => res.status(201).json({ message: "create user (stub)" }));
app.get("/v1/users/:userId", (req, res) => res.json({ userId: req.params.userId, message: "get user (stub)" }));
app.put("/v1/users/:userId/dietary-profile", (req, res) => res.json({ userId: req.params.userId, body: req.body, message: "update dietary profile (stub)" }));
app.put("/v1/users/:userId/policy", (req, res) => res.json({ userId: req.params.userId, body: req.body, message: "update policy (stub)" }));

// --- Integrations ---
app.post("/v1/integrations/calendar/google/connect", (_req, res) => res.json({ message: "connect google calendar (stub)" }));
app.post("/v1/integrations/delivery/:provider/connect", (req, res) => res.json({ provider: req.params.provider, message: "connect delivery provider (stub)" }));
app.post("/v1/integrations/:accountId/disconnect", (req, res) => res.json({ accountId: req.params.accountId, message: "disconnect (stub)" }));

// --- Planning/Orders ---
app.post("/v1/meal-intents/plan-now", (_req, res) => res.json({ message: "plan now (stub)" }));
app.get("/v1/meal-intents/:intentId", (req, res) => res.json({ intentId: req.params.intentId, message: "get intent (stub)" }));
app.post("/v1/meal-intents/:intentId/confirm", (req, res) => res.json({ intentId: req.params.intentId, message: "confirm intent (stub)" }));
app.post("/v1/meal-intents/:intentId/cancel", (req, res) => res.json({ intentId: req.params.intentId, message: "cancel intent (stub)" }));
app.get("/v1/orders/:orderId", (req, res) => res.json({ orderId: req.params.orderId, message: "get order (stub)" }));

// --- Webhooks ---
app.post("/v1/webhooks/providers/:provider/order-status", (req, res) => res.json({ provider: req.params.provider, payload: req.body, message: "provider order webhook (stub)" }));
app.post("/v1/webhooks/calendar/google", (req, res) => res.json({ payload: req.body, message: "calendar webhook (stub)" }));

// --- Notifications ---
app.post("/v1/notifications/test", (_req, res) => res.json({ message: "notification test (stub)" }));

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`[api] listening on :${port}`);
});
