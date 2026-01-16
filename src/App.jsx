import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "./services/firebase";

import Login from "./auth/Login";
import Register from "./auth/Register";
import Dashboard from "./dashboard/Dashboard";
import PolicySetup from "./policy/PolicySetup";

import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("login"); // login | register
  const [policySet, setPolicySet] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // 🔍 Check if policy exists
        const ref = doc(db, "users", currentUser.uid);
        const snap = await getDoc(ref);

        if (snap.exists() && snap.data()?.policy) {
          setPolicySet(true);
        } else {
          setPolicySet(false);
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <p style={{ color: "white", textAlign: "center" }}>Loading...</p>;
  }

  // ✅ Logged in but policy not set
  if (user && !policySet) {
    return <PolicySetup user={user} onDone={() => setPolicySet(true)} />;
  }

  // ✅ Logged in and policy set
  if (user && policySet) {
    return <Dashboard user={user} />;
  }

  // ❌ Not logged in
  return (
    <div className="app">
      <div className="auth-card">
        <h1 className="title">Office Day Tracker 🚀</h1>

        <div className="tabs">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        {mode === "login" ? <Login /> : <Register />}
      </div>
    </div>
  );
}

export default App;
