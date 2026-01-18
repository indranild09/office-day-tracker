export function calculateMonthlyStats(entries, policy, year, month) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let wfo = 0;
  let wfh = 0;
  let leave = 0;
  let holiday = 0;

  Object.values(entries).forEach((e) => {
    if (e.type === "WFO") wfo++;
    if (e.type === "WFH") wfh++;
    if (e.type === "LEAVE") leave++;
    if (e.type === "HOLIDAY") holiday++;
  });

  // -----------------------------
  // Working days (Mon–Fri)
  // -----------------------------
  let workingDays = 0;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, month, d).getDay();
    if (day !== 0 && day !== 6) workingDays++;
  }

  workingDays -= holiday;

  // -----------------------------
  // Scenario 1: Monthly WFH
  // -----------------------------
  if (policy.scenarioType === "MONTHLY_WFH") {
    const monthlyWfoRequired =
      workingDays - policy.wfhLimit - leave;

    return {
      workingDays,
      wfo,
      wfh,
      leave,
      holiday,
      wfhRemaining: Math.max(policy.wfhLimit - wfh, 0),
      monthlyWfoRemaining: Math.max(monthlyWfoRequired - wfo, 0),
    };
  }

  // -----------------------------
  // Scenario 2: FIXED WFO (CORRECT LOGIC)
  // -----------------------------
  const fixedDays = policy.fixedWfoDays.map(d => d.toUpperCase());

  let futureFixedWfoSlots = 0;
  let futureHolidayOnFixedDay = 0;
  let futureCompletedWfo = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    date.setHours(0, 0, 0, 0);

    if (date < today) continue;

    const day = date.getDay();
    if (day === 0 || day === 6) continue;

    const dayName = date
      .toLocaleDateString("en-US", { weekday: "short" })
      .toUpperCase();

    if (!fixedDays.includes(dayName)) continue;

    futureFixedWfoSlots++;

    const key = date.toISOString().slice(0, 10);
    const entry = entries[key];

    if (entry?.type === "HOLIDAY") {
      futureHolidayOnFixedDay++;
    }

    if (entry?.type === "WFO") {
      futureCompletedWfo++;
    }
  }

  // Every holiday on a fixed WFO day adds ONE extra WFO later
  const totalFutureWfoRequired =
    futureFixedWfoSlots + futureHolidayOnFixedDay;

  const monthlyWfoRemaining = Math.max(
    totalFutureWfoRequired - futureCompletedWfo,
    0
  );

  return {
    workingDays,
    wfo,
    wfh,
    leave,
    holiday,
    wfhRemaining: null,
    monthlyWfoRemaining,
  };
}
