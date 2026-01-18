import { useState } from "react";
import { auth, db } from "../services/firebase";
import { doc, setDoc } from "firebase/firestore";

const DAY_MAP = {
  MON: "monday",
  TUE: "tuesday",
  WED: "wednesday",
  THU: "thursday",
  FRI: "friday",
};

export default function PolicySetup({ onDone }) {
  const user = auth.currentUser;

  const [scenarioType, setScenarioType] = useState("MONTHLY_WFH");

  // Scenario 1
  const [wfhLimit, setWfhLimit] = useState("");

  // Scenario 2
  const [fixedDays, setFixedDays] = useState([]);
  const [quarterlyTarget, setQuarterlyTarget] = useState("");

  const toggleDay = (day) => {
    setFixedDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  };

  const savePolicy = async () => {
    if (!user) return;

    if (
      scenarioType === "MONTHLY_WFH" &&
      (!wfhLimit || Number(wfhLimit) < 0)
    ) {
      alert("Please enter valid WFH limit");
      return;
    }

    if (
      scenarioType === "FIXED_WFO" &&
      (fixedDays.length === 0 || !quarterlyTarget)
    ) {
      alert("Please select WFO days and quarterly target");
      return;
    }

    // ✅ CLEAN, SCENARIO-AWARE POLICY OBJECT
    const policy =
      scenarioType === "MONTHLY_WFH"
        ? {
            scenarioType: "MONTHLY_WFH",
            wfhLimit: Number(wfhLimit),
          }
        : {
            scenarioType: "FIXED_WFO",
            fixedWfoDays: fixedDays.map((d) => DAY_MAP[d]),
            quarterlyTarget: Number(quarterlyTarget),
          };

    await setDoc(
      doc(db, "users", user.uid),
      { policy },
      { merge: true }
    );

    onDone?.();
  };

  return (
    <div className="policy-card">
      <h2>Set Your Office Policy</h2>

      {/* Scenario Type */}
      <div className="field">
        <label>Policy Type</label>
        <select
          value={scenarioType}
          onChange={(e) => setScenarioType(e.target.value)}
        >
          <option value="MONTHLY_WFH">Monthly WFH Based</option>
          <option value="FIXED_WFO">Fixed WFO Days</option>
        </select>
      </div>

      {/* Scenario 1 */}
      {scenarioType === "MONTHLY_WFH" && (
        <div className="field">
          <label>WFH Allowed (per month)</label>
          <input
            type="number"
            value={wfhLimit}
            onChange={(e) => setWfhLimit(e.target.value)}
            placeholder="e.g. 10"
          />
        </div>
      )}

      {/* Scenario 2 */}
      {scenarioType === "FIXED_WFO" && (
        <>
          <div className="field">
            <label>Fixed WFO Days</label>
            <div className="day-selector">
              {Object.keys(DAY_MAP).map((day) => (
                <button
                  key={day}
                  className={fixedDays.includes(day) ? "active" : ""}
                  onClick={() => toggleDay(day)}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Quarterly WFO Target</label>
            <input
              type="number"
              value={quarterlyTarget}
              onChange={(e) => setQuarterlyTarget(e.target.value)}
              placeholder="e.g. 36"
            />
          </div>
        </>
      )}

      <button className="save-btn" onClick={savePolicy}>
        Save Policy
      </button>
    </div>
  );
}
