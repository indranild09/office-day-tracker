export function calculateCounters({
  year,
  month,              // 0-based
  entries = {},        // { "YYYY-MM-DD": { type: "WFO" | "WFH" | "LEAVE" | "HOLIDAY" } }
  policy
}) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let workingDays = 0;
  let wfo = 0;
  let wfh = 0;
  let leave = 0;
  let holiday = 0;

  // ---------- BASIC COUNTS ----------
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const day = date.getDay(); // 0 Sun, 6 Sat
    if (day === 0 || day === 6) continue;

    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const entry = entries[key];

    if (entry?.type === "HOLIDAY") {
      holiday++;
      continue;
    }

    workingDays++;

    if (entry?.type === "WFO") wfo++;
    if (entry?.type === "WFH") wfh++;
    if (entry?.type === "LEAVE") leave++;
  }

  // =====================================================
  // 🔵 SCENARIO 1 — MONTHLY WFH
  // =====================================================
  if (policy.scenarioType === "MONTHLY_WFH") {
    const effectiveWorkingDays = workingDays;
    const totalWfoRequired =
      Math.max(effectiveWorkingDays - policy.wfhLimit, 0);

    return {
      workingDays: effectiveWorkingDays,
      wfo,
      wfh,
      leave,
      holiday,
      wfhRemaining: Math.max(policy.wfhLimit - wfh, 0),
      monthlyWfoRemaining: Math.max(totalWfoRequired - wfo, 0),
      compensationWfo: 0
    };
  }

  // =====================================================
  // 🟢 SCENARIO 2 — FIXED WFO (OBLIGATION-BASED)
  // =====================================================
  const fixedDays = policy.fixedWfoDays.map(d => d.toLowerCase());

  let requiredWfo = 0;
  let compensationWfo = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const day = date.getDay();
    if (day === 0 || day === 6) continue;

    const dayName = date
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();

    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const entry = entries[key];

    if (fixedDays.includes(dayName)) {
  // Base fixed WFO obligation
  requiredWfo++;

  // Holiday on fixed WFO day → add extra obligation
  if (entry?.type === "HOLIDAY") {
    compensationWfo++;
    requiredWfo++; // 🔥 THIS LINE IS THE FIX
  }
}

  }

  return {
    workingDays,
    wfo,
    wfh,
    leave,
    holiday,
    monthlyWfoRemaining: Math.max(requiredWfo - wfo, 0),
    compensationWfo
  };
}
