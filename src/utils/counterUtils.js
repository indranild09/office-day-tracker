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
      monthlyWfoRemaining: Math.max(
        monthlyWfoRequired - wfo,
        0
      )
    };
  }

  // -----------------------------
  // Scenario 2: FIXED WFO (🔥 KEY FIX)
  // -----------------------------
  const fixedDays = policy.fixedWfoDays.map((d) =>
    d.toUpperCase()
  );

  let futureFixedWfo = 0;
  let futureHolidayComp = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    date.setHours(0, 0, 0, 0);

    const day = date.getDay();
    if (day === 0 || day === 6) continue;

    if (date < today) continue; // ✅ ONLY FUTURE DAYS

    const dayName = date
      .toLocaleDateString("en-US", { weekday: "short" })
      .toUpperCase();

    if (!fixedDays.includes(dayName)) continue;

    futureFixedWfo++;

    const key = date.toISOString().slice(0, 10);
    if (entries[key]?.type === "HOLIDAY") {
      futureHolidayComp++;
    }
  }

  const monthlyWfoRemaining =
    futureFixedWfo + futureHolidayComp;

  return {
    workingDays,
    wfo,
    wfh,
    leave,
    holiday,
    wfhRemaining: null,
    monthlyWfoRemaining
  };
}
