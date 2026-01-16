export function calculateMonthlyStats(entries, policy, year, month) {
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

  // Total working days (Mon–Fri)
  let workingDays = 0;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, month, d).getDay();
    if (day !== 0 && day !== 6) workingDays++;
  }

  workingDays -= holiday;

  // ✅ Monthly WFO required
  let monthlyWfoRequired = workingDays - leave;

  if (policy.scenarioType === "MONTHLY_WFH") {
    monthlyWfoRequired -= policy.wfhLimit;
  }

  const monthlyWfoRemaining = Math.max(
    monthlyWfoRequired - wfo,
    0
  );

  return {
    workingDays,
    wfo,
    wfh,
    leave,
    holiday,
    wfhRemaining:
      policy.scenarioType === "MONTHLY_WFH"
        ? Math.max(policy.wfhLimit - wfh, 0)
        : null,
    monthlyWfoRemaining
  };
}
