/**
 * MVP agent loop (stub)
 * Runs every 5 minutes.
 */

function inferArrivalWindow(userSchedule) {
  // TODO: replace with calendar + commute logic
  return {
    targetArrivalAt: new Date(Date.now() + 60 * 60 * 1000),
    decisionDeadlineAt: new Date(Date.now() + 20 * 60 * 1000)
  };
}

function filterCandidatesByHardConstraints(candidates, profile) {
  return candidates.filter((c) => {
    const hasAllergenConflict = c.ingredients.some((i) => profile.allergens?.includes(i));
    const overBudget = profile.maxMealPriceCents && c.priceCents > profile.maxMealPriceCents;
    return !hasAllergenConflict && !overBudget;
  });
}

function rankCandidates(candidates, profile) {
  return candidates
    .map((c) => ({
      ...c,
      rankScore: (profile.likedCuisines?.includes(c.cuisine) ? 0.3 : 0) +
        Math.max(0, 1 - c.etaMinutes / 120) +
        Math.max(0, 1 - c.priceCents / (profile.maxMealPriceCents || 3000))
    }))
    .sort((a, b) => b.rankScore - a.rankScore);
}

async function runPlannerCycle() {
  console.log("[worker] cycle start", new Date().toISOString());

  // TODO: fetch eligible users from DB
  const users = [
    {
      id: "demo-user",
      policy: { autoOrderEnabled: true, confidenceThreshold: 0.75 },
      profile: {
        allergens: ["peanut"],
        likedCuisines: ["korean", "japanese"],
        maxMealPriceCents: 2500
      }
    }
  ];

  for (const user of users) {
    const _window = inferArrivalWindow([]);

    // TODO: fetch from provider adapters
    const rawCandidates = [
      { id: "1", name: "Bibimbap", cuisine: "korean", ingredients: ["beef"], priceCents: 1700, etaMinutes: 35 },
      { id: "2", name: "Pad Thai", cuisine: "thai", ingredients: ["peanut"], priceCents: 1600, etaMinutes: 30 }
    ];

    const filtered = filterCandidatesByHardConstraints(rawCandidates, user.profile);
    const ranked = rankCandidates(filtered, user.profile);
    const best = ranked[0];

    if (!best) {
      console.log(`[worker] user=${user.id} no safe candidates`);
      continue;
    }

    const confidence = Math.min(0.95, 0.55 + (best.rankScore || 0) / 2);

    if (user.policy.autoOrderEnabled && confidence >= user.policy.confidenceThreshold) {
      console.log(`[worker] user=${user.id} AUTO_ORDER candidate=${best.name} confidence=${confidence.toFixed(2)}`);
      // TODO: place order via provider adapter + persist order
    } else {
      console.log(`[worker] user=${user.id} ASK_CONFIRMATION candidate=${best.name} confidence=${confidence.toFixed(2)}`);
      // TODO: enqueue user confirmation notification
    }
  }

  console.log("[worker] cycle end");
}

runPlannerCycle();
setInterval(runPlannerCycle, 5 * 60 * 1000);
