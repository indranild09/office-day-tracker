import { useEffect, useState } from "react";
import Calendar from "./Calendar";
import { signOut } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { calculateCounters } from "../utils/counterUtils";
import { calculateQuarterStats } from "../utils/quarterUtils";

export default function Dashboard({ user }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [policy, setPolicy] = useState(null);
  const [stats, setStats] = useState(null);
  const [quarterStats, setQuarterStats] = useState(null);
  const [firstName, setFirstName] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

  const getQuarter = (m) => Math.ceil((m + 1) / 3);

  // -------------------------
  // Load user profile
  // -------------------------
  useEffect(() => {
    loadUserProfile();
  }, []);

  // -------------------------
  // Reload month data
  // -------------------------
  useEffect(() => {
    if (policy) loadMonthData();
  }, [currentDate, policy]);

  async function loadUserProfile() {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) return;

    const data = snap.data();
    setPolicy(data.policy || null);
    setFirstName(data.firstName?.trim() || "");
  }

  // -------------------------
  // Load calendar entries
  // -------------------------
  async function loadMonthData() {
    const snap = await getDocs(
      collection(db, "users", user.uid, "calendar")
    );

    // ✅ IMPORTANT: date-keyed entries
    const entries = {};

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.month === monthKey && data.date) {
        entries[data.date] = data;
      }
    });

    const monthlyStats = calculateCounters({
      year,
      month,
      entries,
      policy,
    });

    setStats(monthlyStats);

    if (policy.scenarioType === "FIXED_WFO") {
      const q = getQuarter(month);
      setQuarterStats(
        calculateQuarterStats(entries, policy, year, q)
      );
    } else {
      setQuarterStats(null);
    }
  }

  // -------------------------
  // Greeting
  // -------------------------
  const getGreeting = () => {
    if (!firstName) return "Hey";
    if (firstName === "Pallavi") return `Hey Sexy ${firstName}`;
    if (firstName === "Pallu") return `Hey ${firstName} Darling`;
    return `Hey ${firstName}`;
  };

  const prevMonth = () =>
    setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () =>
    setCurrentDate(new Date(year, month + 1, 1));

  // -------------------------
  // Loading guard
  // -------------------------
  if (!policy || !stats) {
    return <div style={{ padding: 24 }}>Loading dashboard…</div>;
  }

  return (
    <div className="dashboard">
      {/* HEADER */}
      <header className="dash-header">
        <div className="header-left">
          <h2 className="month-title">
            {currentDate.toLocaleString("default", { month: "long" })} {year}
          </h2>
          <p className="greeting-text">
            {getGreeting()}, manage your in-office and remote days.
          </p>
        </div>

        <div className="actions">
          <button onClick={prevMonth}>◀</button>
          <button onClick={nextMonth}>▶</button>
          <button className="logout" onClick={() => signOut(auth)}>
            Logout
          </button>
        </div>
      </header>

      {/* CALENDAR */}
      <Calendar
        currentDate={currentDate}
        onDataChange={loadMonthData}
      />

      {/* MONTHLY SUMMARY */}
      <h3 style={{ marginBottom: 12, opacity: 0.9 }}>
        Monthly Summary
      </h3>

      <div className="stats">
        <div className="stat-card">Working Days: {stats.workingDays}</div>
        <div className="stat-card">WFO Done: {stats.wfo}</div>
        <div className="stat-card">WFH Done: {stats.wfh}</div>
        <div className="stat-card">Leave: {stats.leave}</div>
        <div className="stat-card">Holiday: {stats.holiday}</div>

        {/* Scenario 1 */}
        {policy.scenarioType === "MONTHLY_WFH" && (
          <div className="stat-card">
            WFH Remaining: {stats.wfhRemaining}
          </div>
        )}

        {/* Common */}
        <div className="stat-card highlight">
          Monthly WFO Remaining: {stats.monthlyWfoRemaining}
          {stats.compensationWfo > 0 && (
            <span
              title={`+${stats.compensationWfo} due to holidays on WFO days`}
              style={{
                marginLeft: 8,
                fontSize: 12,
                opacity: 0.8,
                cursor: "help",
              }}
            >
              (+{stats.compensationWfo})
            </span>
          )}
        </div>
      </div>

      {/* QUARTERLY SUMMARY */}
      {policy.scenarioType === "FIXED_WFO" && quarterStats && (
        <>
          <h3 style={{ marginBottom: 12, opacity: 0.9 }}>
            Quarterly Summary
          </h3>

          <div className="stats">
            <div className="stat-card">
              Quarterly Target: {policy.quarterlyTarget}
            </div>
            <div className="stat-card">
              WFO Completed: {quarterStats.completed}
            </div>
            <div className="stat-card">
              Leave Taken: {quarterStats.leave}
            </div>
            <div className="stat-card highlight">
              Quarterly WFO Remaining: {quarterStats.remaining}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
