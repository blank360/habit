import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import AuthPage from "./components/AuthPage";
import HabitTracker from "./components/HabitTracker";
import "./index.css";

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return unsub;
  }, []);

  if (user === undefined) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        color: "var(--text-muted)",
        fontFamily: "var(--font-body)",
        fontSize: 13,
        letterSpacing: "0.04em",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 12, color: "var(--accent)" }}>◈</div>
          Initializing...
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;
  return <HabitTracker user={user} />;
}
