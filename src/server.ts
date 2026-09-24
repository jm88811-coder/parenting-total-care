import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import type { Profile } from "./types.js";
import { buildChecklist } from "./logic/checklist.js";
import { matchBenefits } from "./logic/benefits.js";
import { buildTimeline } from "./logic/timeline.js";
import { buildTodos } from "./logic/todos.js";
import { buildDashboard } from "./logic/dashboard.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

function parseProfile(body: unknown): Profile | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;

  if (typeof b.babyDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.babyDate)) return null;
  if (b.babyDateType !== "dueDate" && b.babyDateType !== "birthDate") return null;
  if (typeof b.isFirstChild !== "boolean") return null;
  if (b.feedingPlan !== "breastfeeding" && b.feedingPlan !== "formula" && b.feedingPlan !== "undecided") return null;
  if (typeof b.hasCar !== "boolean") return null;
  if (typeof b.hasWashingMachine !== "boolean") return null;
  if (typeof b.plansToUseCrib !== "boolean") return null;
  if (typeof b.region !== "string" || b.region.length === 0) return null;
  if (b.expectedUsageMonths !== undefined && typeof b.expectedUsageMonths !== "number") return null;
  if (typeof b.isEmployed !== "boolean") return null;
  if (typeof b.lowIncomeHousehold !== "boolean") return null;

  return {
    babyDate: b.babyDate,
    babyDateType: b.babyDateType,
    isFirstChild: b.isFirstChild,
    feedingPlan: b.feedingPlan,
    hasCar: b.hasCar,
    hasWashingMachine: b.hasWashingMachine,
    plansToUseCrib: b.plansToUseCrib,
    region: b.region,
    expectedUsageMonths: b.expectedUsageMonths as number | undefined,
    isEmployed: b.isEmployed,
    lowIncomeHousehold: b.lowIncomeHousehold,
  };
}

function withProfile(handler: (profile: Profile, res: express.Response) => void) {
  return (req: express.Request, res: express.Response) => {
    const profile = parseProfile(req.body?.profile);
    if (!profile) {
      res.status(400).json({ error: "프로필 정보가 올바르지 않습니다." });
      return;
    }
    try {
      handler(profile, res);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다." });
    }
  };
}

app.post(
  "/api/checklist",
  withProfile((profile, res) => {
    res.json(buildChecklist(profile));
  })
);

app.post(
  "/api/benefits",
  withProfile((profile, res) => {
    res.json({ benefits: matchBenefits(profile) });
  })
);

app.post(
  "/api/timeline",
  withProfile((profile, res) => {
    res.json({ timeline: buildTimeline(profile) });
  })
);

app.post(
  "/api/todos",
  withProfile((profile, res) => {
    res.json({ todos: buildTodos(profile) });
  })
);

app.post(
  "/api/dashboard",
  withProfile((profile, res) => {
    res.json(buildDashboard(profile));
  })
);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`육아 토탈케어 앱 실행 중: http://localhost:${PORT}`);
});
