// -------------------- helpers --------------------
const isWeekend = (date) => {
  const d = date.getDay();
  return d === 0 || d === 6;
};

const dayName = (date) =>
  date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();

const dateKey = (date) => date.toISOString().slice(0, 10);

// -------------------- main --------------------
export function calculateCounters({
  year,
  month,
  entries = {},
  policy,
  today = new Date(),
}) {
  today.setHours(0, 0, 0, 0);

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let workingDays = 0;
  let wfo = 0;
  let wfh = 0;
  let leave = 0;
  let holiday = 0;

  // --------- COMMON COUNTING (past + future) ---------
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    if (isWeekend(date)) continue;

    const entry = entries[dateKey(date)];

    if (entry?.type === "HOLIDAY") {
      holiday++;
      continue;
    }

    workingDays++;

    if (entry?.type === "WFO") wfo++;
    if (entry?.type === "WFH") wfh++;
    if (entry?.type === "LEAVE") leave++;
  }

  // ==================================================
  // 🟦 SCENARIO 1 — MONTHLY WFO TARGET
  // ==================================================
  if (policy.scenarioType === "MONTHLY_WFO") {
    const target = policy.monthlyWfoTarget || 0;

    return {
      workingDays,
      wfo,
      wfh,
      leave,
      holiday,
      monthlyWfoRemaining: Math.max(target - wfo, 0),
      compensationWfo: 0,
    };
  }

  // ==================================================
  // 🟩 SCENARIO 2 — FIXED WFO DAYS
  // ==================================================
  const fixedDays = (policy.fixedWfoDays || []).map((d) =>
    d.toUpperCase()
  );

  let futureRequiredWfo = 0;
  let compensationWfo = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    date.setHours(0, 0, 0, 0);

    if (date < today) continue;
    if (isWeekend(date)) continue;
    if (!fixedDays.includes(dayName(date))) continue;

    const entry = entries[dateKey(date)];

    if (!entry) {
      // future fixed day not yet marked
      futureRequiredWfo++;
    } else if (
      entry.type === "HOLIDAY" ||
      entry.type === "LEAVE"
    ) {
      // compensation needed
      compensationWfo++;
    }
  }

  return {
    workingDays,
    wfo,
    wfh,
    leave,
    holiday,
    monthlyWfoRemaining: futureRequiredWfo + compensationWfo,
    compensationWfo,
  };
}
