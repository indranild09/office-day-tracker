export function calculateQuarterStats(entries, policy, year, quarter) {
  let wfo = 0;
  let leave = 0;

  Object.values(entries).forEach((e) => {
    if (e.quarter === `${year}-Q${quarter}`) {
      if (e.type === "WFO") wfo++;
      if (e.type === "LEAVE") leave++;
    }
  });

  const required = Math.max(policy.quarterlyTarget - leave, 0);
  const remaining = Math.max(required - wfo, 0);

  return {
    completed: wfo,
    leave,
    required,
    remaining
  };
}
