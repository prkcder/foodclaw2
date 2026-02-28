# foodclaw2 v1 Architecture

## 1) System Components

- **API service (`apps/api`)**
  - Auth/session endpoints
  - User profile/preferences management
  - Integrations (calendar/provider connect callbacks)
  - Order requests + status webhooks
  - Notification outbox

- **Worker service (`apps/worker`)**
  - Periodic schedule scan
  - Arrival-time inference
  - Meal planning + ranking loop
  - Order orchestration state machine
  - Retry/dead-letter handling

- **Postgres + Prisma (`packages/db`)**
  - Source of truth for users, preferences, schedules, intents, orders, events

- **Shared package (`packages/shared`)**
  - Type-safe enums and DTOs

## 2) Data Model (tables)

1. `users`
   - `id` (uuid, pk)
   - `email` (unique)
   - `name`
   - `timezone`
   - `home_address`
   - `home_lat`, `home_lng`
   - `created_at`, `updated_at`

2. `dietary_profiles`
   - `id` (uuid, pk)
   - `user_id` (fk users)
   - `allergens` (text[])
   - `restrictions` (text[]) // vegan, halal, gluten_free...
   - `disliked_ingredients` (text[])
   - `liked_cuisines` (text[])
   - `max_meal_price_cents` (int)
   - `updated_at`

3. `connected_accounts`
   - `id` (uuid, pk)
   - `user_id` (fk users)
   - `provider_type` (enum: CALENDAR_GOOGLE, DELIVERY_MOCK, DELIVERY_UBER_EATS, DELIVERY_DOORDASH)
   - `access_token_encrypted`
   - `refresh_token_encrypted`
   - `scopes` (text[])
   - `status` (enum: ACTIVE, REVOKED, ERROR)
   - `created_at`, `updated_at`

4. `schedule_events`
   - `id` (uuid, pk)
   - `user_id` (fk users)
   - `external_event_id`
   - `title`
   - `location`
   - `start_at`, `end_at`
   - `commute_minutes_estimate`
   - `ingested_at`

5. `meal_intents`
   - `id` (uuid, pk)
   - `user_id` (fk users)
   - `target_arrival_at`
   - `decision_deadline_at`
   - `status` (enum: PLANNING, NEEDS_CONFIRMATION, CONFIRMED, ORDERED, CANCELED, FAILED)
   - `reason` (text)
   - `created_at`, `updated_at`

6. `meal_candidates`
   - `id` (uuid, pk)
   - `meal_intent_id` (fk meal_intents)
   - `provider_type`
   - `external_store_id`
   - `external_item_id`
   - `name`
   - `price_cents`
   - `eta_minutes`
   - `ingredients` (text[])
   - `constraint_flags` (jsonb)
   - `rank_score` (float)

7. `orders`
   - `id` (uuid, pk)
   - `user_id` (fk users)
   - `meal_intent_id` (fk meal_intents)
   - `provider_type`
   - `external_order_id`
   - `status` (enum: CREATED, PLACED, PREPARING, PICKED_UP, DELIVERED, CANCELED, FAILED)
   - `subtotal_cents`, `fees_cents`, `tip_cents`, `total_cents`
   - `placed_at`, `delivered_at`

8. `order_events`
   - `id` (uuid, pk)
   - `order_id` (fk orders)
   - `event_type`
   - `payload` (jsonb)
   - `created_at`

9. `notification_outbox`
   - `id` (uuid, pk)
   - `user_id` (fk users)
   - `channel` (enum: PUSH, SMS, WHATSAPP, TELEGRAM)
   - `template_key`
   - `payload` (jsonb)
   - `status` (enum: PENDING, SENT, FAILED)
   - `scheduled_at`, `sent_at`

10. `agent_runs`
    - `id` (uuid, pk)
    - `user_id` (fk users)
    - `meal_intent_id` (nullable fk)
    - `run_type` (enum: SCHEDULE_SCAN, PLANNING, FOLLOW_UP)
    - `input` (jsonb)
    - `output` (jsonb)
    - `confidence` (float)
    - `created_at`

## 3) API Surface (REST)

### User/Profile
- `POST /v1/users`
- `GET /v1/users/:userId`
- `PUT /v1/users/:userId/dietary-profile`
- `PUT /v1/users/:userId/policy`

### Integrations
- `POST /v1/integrations/calendar/google/connect`
- `POST /v1/integrations/delivery/:provider/connect`
- `POST /v1/integrations/:accountId/disconnect`

### Planning / Orders
- `POST /v1/meal-intents/plan-now`
- `GET /v1/meal-intents/:intentId`
- `POST /v1/meal-intents/:intentId/confirm`
- `POST /v1/meal-intents/:intentId/cancel`
- `GET /v1/orders/:orderId`

### Webhooks
- `POST /v1/webhooks/providers/:provider/order-status`
- `POST /v1/webhooks/calendar/google`

### Notifications
- `POST /v1/notifications/test`

## 4) Agent Loop (v1)

### Trigger Sources
- Cron every 5 minutes
- Calendar webhook event updates
- Provider order status webhooks

### Planning Loop
1. Fetch users with active integrations.
2. Infer arrival window from upcoming events + commute estimate.
3. Create/refresh `meal_intent`.
4. Fetch candidate meals from providers.
5. Hard-filter candidates violating dietary/allergen/budget constraints.
6. AI rank remaining candidates (taste fit, variety, ETA fit).
7. If top candidate confidence >= threshold and `auto_order=true`, place order.
8. Else create confirmation request notification.
9. Track order events and send ETA updates.

### Guardrails
- Never place order if allergen conflict detected.
- Never exceed `max_meal_price_cents` unless explicit user override.
- Quiet hours respected unless `urgent_delivery=true`.

## 5) MVP Non-Goals
- Multi-user household optimization
- Dynamic tip bidding strategies
- Full cross-provider cart normalization
- Advanced RL personalization (use simple feedback loop first)
