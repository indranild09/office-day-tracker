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

  useEffect(() => {
    loadUserProfile();
  }, []);

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

  async function loadMonthData() {
  const snap = await getDocs(
    collection(db, "users", user.uid, "calendar")
  );

  const entries = {};

  snap.forEach((docSnap) => {
    const data = docSnap.data();

    if (data.month === monthKey && data.date) {
      // ✅ THIS is the key fix
      entries[data.date] = data;
    }
  });

  const monthlyStats = calculateCounters({
    year,
    month,
    entries,
    policy,
    today: new Date(),
  });

  setStats(monthlyStats);

  if (policy.scenarioType === "FIXED_WFO") {
    const q = Math.ceil((month + 1) / 3);
    setQuarterStats(
      calculateQuarterStats(entries, policy, year, q)
    );
  } else {
    setQuarterStats(null);
  }
}

  const getGreeting = () => {
    if (!firstName) return "Hey";
    if (firstName === "Pallavi") return `Hey Sexy ${firstName}`;
    if (firstName === "Pallu") return `Hey ${firstName} Darling`;
    return `Hey ${firstName}`;
  };

  if (!policy || !stats) return null;

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div>
          <h2>
            {currentDate.toLocaleString("default", { month: "long" })} {year}
          </h2>
          <p>{getGreeting()}, manage your in-office and remote days.</p>
        </div>

        <div className="actions">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>◀</button>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>▶</button>
          <button className="logout" onClick={() => signOut(auth)}>Logout</button>
        </div>
      </header>

      <Calendar currentDate={currentDate} onDataChange={loadMonthData} />

      <h3>Monthly Summary</h3>
      <div className="stats">
        <div className="stat-card">Working Days: {stats.workingDays}</div>
        <div className="stat-card">WFO Done: {stats.wfo}</div>
        <div className="stat-card">WFH Done: {stats.wfh}</div>
        <div className="stat-card">Leave: {stats.leave}</div>
        <div className="stat-card">Holiday: {stats.holiday}</div>

        <div className="stat-card highlight">
          Monthly WFO Remaining: {stats.monthlyWfoRemaining}
          {stats.compensationWfo > 0 && (
            <span title={`+${stats.compensationWfo} due to holidays`} style={{ marginLeft: 8 }}>
              (+{stats.compensationWfo})
            </span>
          )}
        </div>
      </div>

      {policy.scenarioType === "FIXED_WFO" && quarterStats && (
        <>
          <h3>Quarterly Summary</h3>
          <div className="stats">
            <div className="stat-card">Quarterly Target: {policy.quarterlyTarget}</div>
            <div className="stat-card">WFO Completed: {quarterStats.completed}</div>
            <div className="stat-card">Leave Taken: {quarterStats.leave}</div>
            <div className="stat-card highlight">
              Quarterly WFO Remaining: {quarterStats.remaining}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
