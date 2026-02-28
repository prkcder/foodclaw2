import express from "express";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, service: "api", db: "up" });
  } catch {
    res.status(503).json({ ok: false, service: "api", db: "down" });
  }
});

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function coerceStringArray(v) {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => typeof x === "string").map((x) => x.trim()).filter(Boolean);
}

// --- Users/Profile ---
app.post("/v1/users", async (req, res) => {
  try {
    const { email, name, timezone, homeAddress, homeLat, homeLng } = req.body || {};

    if (!isNonEmptyString(email)) {
      return res.status(400).json({ error: "email is required" });
    }

    const created = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        name: isNonEmptyString(name) ? name.trim() : null,
        timezone: isNonEmptyString(timezone) ? timezone.trim() : undefined,
        homeAddress: isNonEmptyString(homeAddress) ? homeAddress.trim() : null,
        homeLat: typeof homeLat === "number" ? homeLat : null,
        homeLng: typeof homeLng === "number" ? homeLng : null
      }
    });

    return res.status(201).json(created);
  } catch (err) {
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "user with this email already exists" });
    }
    console.error("POST /v1/users failed", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

app.get("/v1/users/:userId", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      include: { dietaryProfile: true }
    });

    if (!user) return res.status(404).json({ error: "user_not_found" });
    return res.json(user);
  } catch (err) {
    console.error("GET /v1/users/:userId failed", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

app.put("/v1/users/:userId/dietary-profile", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "user_not_found" });

    const allergens = coerceStringArray(req.body?.allergens);
    const restrictions = coerceStringArray(req.body?.restrictions);
    const dislikedIngredients = coerceStringArray(req.body?.dislikedIngredients);
    const likedCuisines = coerceStringArray(req.body?.likedCuisines);

    let maxMealPriceCents = null;
    if (req.body?.maxMealPriceCents !== undefined && req.body?.maxMealPriceCents !== null) {
      if (!Number.isInteger(req.body.maxMealPriceCents) || req.body.maxMealPriceCents < 0) {
        return res.status(400).json({ error: "maxMealPriceCents must be a non-negative integer" });
      }
      maxMealPriceCents = req.body.maxMealPriceCents;
    }

    const profile = await prisma.dietaryProfile.upsert({
      where: { userId },
      create: {
        userId,
        allergens,
        restrictions,
        dislikedIngredients,
        likedCuisines,
        maxMealPriceCents
      },
      update: {
        allergens,
        restrictions,
        dislikedIngredients,
        likedCuisines,
        maxMealPriceCents
      }
    });

    return res.json(profile);
  } catch (err) {
    console.error("PUT /v1/users/:userId/dietary-profile failed", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

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

async function shutdown() {
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
