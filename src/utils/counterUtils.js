// src/utils/counterUtils.js

const isWeekend = (date) => {
  const d = date.getDay();
  return d === 0 || d === 6;
};

const getAllDatesOfMonth = (year, month) => {
  const dates = [];
  const lastDay = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= lastDay; d++) {
    dates.push(new Date(year, month, d));
  }
  return dates;
};

export function calculateCounters({ year, month, entries, policy }) {
  const dates = getAllDatesOfMonth(year, month);

  let holiday = 0;
  let leave = 0;
  let wfo = 0;
  let wfh = 0;

  dates.forEach((date) => {
    const key = date.toISOString().slice(0, 10);
    const entry = entries[key];

    if (!entry || isWeekend(date)) return;

    if (entry.type === "HOLIDAY") holiday++;
    if (entry.type === "LEAVE") leave++;
    if (entry.type === "WFO") wfo++;
    if (entry.type === "WFH") wfh++;
  });

  // ===== SCENARIO 1 : MONTHLY_WFH =====
  if (policy.scenarioType === "MONTHLY_WFH") {
    const workingDays = dates.filter(
      (d) => !isWeekend(d)
    ).length - holiday;

    const totalWfoRequired = workingDays - policy.monthlyWfhLimit;

    return {
      workingDays,
      holiday,
      leave,
      wfo,
      wfh,
      wfhRemaining: Math.max(policy.monthlyWfhLimit - wfh, 0),
      monthlyWfoRemaining: Math.max(totalWfoRequired - wfo, 0),
      compensationWfo: 0,
    };
  }

  // ===== SCENARIO 2 : FIXED_WFO =====
  const fixedDays = policy.fixedWfoDays; // e.g. ["Tue","Wed","Thu"]

  let baseWfoObligation = 0;
  let compensationWfo = 0;
  let workingDays = 0;

  dates.forEach((date) => {
    if (isWeekend(date)) return;

    const dayName = date.toLocaleString("en-US", { weekday: "short" });
    const key = date.toISOString().slice(0, 10);
    const entry = entries[key];

    workingDays++;

    if (fixedDays.includes(dayName)) {
      baseWfoObligation++;

      if (entry?.type === "HOLIDAY") {
        compensationWfo++;
      }
    }
  });

  const requiredWfo = baseWfoObligation + compensationWfo;

  return {
    workingDays,
    holiday,
    leave,
    wfo,
    wfh,
    monthlyWfoRemaining: Math.max(requiredWfo - wfo, 0),
    compensationWfo,
  };
}
