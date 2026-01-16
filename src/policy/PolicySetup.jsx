import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];

export default function PolicySetup({ user, onDone }) {
  const [type, setType] = useState("MONTHLY_WFH");
  const [wfhLimit, setWfhLimit] = useState("");
  const [quarterlyTarget, setQuarterlyTarget] = useState("");
  const [fixedDays, setFixedDays] = useState([]);

  const toggleDay = (day) => {
    setFixedDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  };

  const savePolicy = async () => {
    if (type === "MONTHLY_WFH" && !wfhLimit) {
      alert("Enter monthly WFH limit");
      return;
    }

    if (type === "FIXED_WFO" && (!quarterlyTarget || fixedDays.length === 0)) {
      alert("Select WFO days and quarterly target");
      return;
    }

    await setDoc(doc(db, "users", user.uid), {
      policy: {
        scenarioType: type,
        wfhLimit: Number(wfhLimit),
        fixedWfoDays: fixedDays,
        quarterlyTarget: Number(quarterlyTarget)
      }
    });

    onDone();
  };

  return (
    <div className="app">
      <div className="auth-card">
        <h2 className="title">Set Your Office Policy</h2>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="select"
        >
          <option value="MONTHLY_WFH">Monthly WFH</option>
          <option value="FIXED_WFO">Fixed WFO + Quarterly</option>
        </select>

        {type === "MONTHLY_WFH" && (
          <input
            type="number"
            placeholder="Monthly WFH limit"
            value={wfhLimit}
            onChange={(e) => setWfhLimit(e.target.value)}
          />
        )}

        {type === "FIXED_WFO" && (
          <>
            <input
              type="number"
              placeholder="Quarterly WFO target"
              value={quarterlyTarget}
              onChange={(e) => setQuarterlyTarget(e.target.value)}
            />

            <div className="days-grid">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  className={`day-btn ${
                    fixedDays.includes(day) ? "selected" : ""
                  }`}
                  onClick={() => toggleDay(day)}
                >
                  {day}
                </button>
              ))}
            </div>
          </>
        )}

        <button className="save-btn" onClick={savePolicy}>
          Save Policy
        </button>
      </div>
    </div>
  );
}
