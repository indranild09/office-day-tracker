// counterUtils.js

// -----------------------------
// Helpers
// -----------------------------
function isWeekend(date) {
  const d = date.getDay();
  return d === 0 || d === 6;
}

function getDayName(date) {
  return date
    .toLocaleDateString("en-US", { weekday: "short" })
    .toUpperCase();
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

// -----------------------------
// MAIN COUNTER
// -----------------------------
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

  // -----------------------------
  // BASIC COUNTS (FULL MONTH)
  // -----------------------------
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    date.setHours(0, 0, 0, 0);

    if (isWeekend(date)) continue;

    const key = dateKey(date);
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
  // SCENARIO 1: MONTHLY WFH LIMIT
  // =====================================================
  if (policy.scenarioType === "MONTHLY_WFH") {
    const allowedWfh = policy.wfhLimit || 0;
    const wfhRemaining = Math.max(allowedWfh - wfh, 0);

    return {
      workingDays,
      wfo,
      wfh,
      leave,
      holiday,
      wfhRemaining,
      monthlyWfoRemaining: null,
      compensationWfo: 0,
    };
  }

  // =====================================================
  // SCENARIO 2: FIXED WFO DAYS (CORRECT LOGIC)
  // =====================================================
  if (policy.scenarioType === "FIXED_WFO") {
    const fixedDays = policy.fixedWfoDays.map(d => d.toUpperCase());

    let pendingNormalWfo = 0;
    let compensationWfo = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      date.setHours(0, 0, 0, 0);

      // Only future dates
      if (date < today) continue;
      if (isWeekend(date)) continue;

      const dayName = getDayName(date);
      if (!fixedDays.includes(dayName)) continue;

      const key = dateKey(date);
      const entry = entries[key];

      if (!entry) {
        // Fixed WFO day not yet marked
        pendingNormalWfo++;
        continue;
      }

      if (entry.type === "WFO") {
        // Already completed
        continue;
      }

      if (entry.type === "HOLIDAY" || entry.type === "LEAVE") {
        // Fixed WFO lost → needs compensation
        compensationWfo++;
      }
    }

    const monthlyWfoRemaining =
      pendingNormalWfo + compensationWfo;

    return {
      workingDays,
      wfo,
      wfh,
      leave,
      holiday,
      wfhRemaining: null,
      monthlyWfoRemaining,
      compensationWfo, // 👈 for tooltip “+X due to holidays”
    };
  }

  // -----------------------------
  // Fallback
  // -----------------------------
  return {
    workingDays,
    wfo,
    wfh,
    leave,
    holiday,
    wfhRemaining: null,
    monthlyWfoRemaining: null,
    compensationWfo: 0,
  };
}
