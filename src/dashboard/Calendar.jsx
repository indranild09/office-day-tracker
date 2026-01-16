import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc
} from "firebase/firestore";
import { auth, db } from "../services/firebase";
import DayModal from "./DayModal";
import "./calendar.css";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Calendar({ currentDate, onDataChange }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [entries, setEntries] = useState({});

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  useEffect(() => {
    loadMonth();
  }, [currentDate]);

  async function loadMonth() {
    if (!auth.currentUser) return;

    const uid = auth.currentUser.uid;
    const snap = await getDocs(
      collection(db, "users", uid, "calendar")
    );

    const map = {};
    snap.forEach((d) => {
      map[d.id] = d.data();
    });

    setEntries(map);
  }

  const saveEntry = async (type) => {
    try {
      const uid = auth.currentUser.uid;
      const id = selectedDate.toISOString().slice(0, 10);

      if (type === "CLEAR") {
        await deleteDoc(doc(db, "users", uid, "calendar", id));
      } else {
        await setDoc(doc(db, "users", uid, "calendar", id), {
          date: id,
          type,
          month: `${year}-${String(month + 1).padStart(2, "0")}`,
          quarter: `${year}-Q${Math.ceil((month + 1) / 3)}`,
          createdAt: new Date()
        });
      }

      setSelectedDate(null); // close modal
      await loadMonth();     // update calendar UI

      // 🔥 notify Dashboard to recalc stats
      if (onDataChange) onDataChange();

    } catch (err) {
      console.error("Save failed:", err);
      alert("Save failed. Check console.");
    }
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d));
  }

  return (
    <>
      <div className="calendar-container">
        <div className="calendar-header">
          {days.map((d) => (
            <div key={d} className="day-name">
              {d}
            </div>
          ))}
        </div>

        <div className="calendar-grid">
          {cells.map((date, i) => {
            const id = date?.toISOString().slice(0, 10);
            const entry = id ? entries[id] : null;

            return (
              <div
                key={i}
                className={`calendar-cell ${
                  date && (date.getDay() === 0 || date.getDay() === 6)
                    ? "weekend"
                    : ""
                }`}
                onClick={() =>
                  date &&
                  date.getDay() !== 0 &&
                  date.getDay() !== 6 &&
                  setSelectedDate(date)
                }
              >
                {date && <span className="date">{date.getDate()}</span>}
                {entry && (
                  <span className={`tag ${entry.type}`}>
                    {entry.type}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <DayModal
        date={selectedDate}
        onSelect={saveEntry}
        onClose={() => setSelectedDate(null)}
      />
    </>
  );
}
