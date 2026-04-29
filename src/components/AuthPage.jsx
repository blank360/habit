import React, { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";

const provider = new GoogleAuthProvider();

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(err.message.replace("Firebase: ", "").replace(/\(auth.*\)\.?/, ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.root}>
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.logoIcon}>◈</span>
          <h1 style={styles.title}>Habit Forge</h1>
          <p style={styles.subtitle}>Build better habits, one day at a time.</p>
        </div>

        <div style={styles.features}>
          {["Track 10 habits daily", "Real-time sync across devices", "Visualize your progress"].map((f, i) => (
            <div key={i} style={styles.feature}>
              <span style={styles.featureDot}>◆</span>
              <span>{f}</span>
            </div>
          ))}
        </div>

        <button
          style={{ ...styles.googleBtn, ...(loading ? styles.googleBtnLoading : {}) }}
          onClick={handleGoogle}
          disabled={loading}
        >
          {loading ? (
            <span style={styles.spinner}>⟳</span>
          ) : (
            <svg style={styles.googleIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          <span style={styles.googleBtnText}>
            {loading ? "Signing in..." : "Continue with Google"}
          </span>
        </button>

        {error && <p style={styles.error}>{error}</p>}

        <p style={styles.quote}>
          <em>"Success is the product of daily habits."</em>
          <br />
          <span style={styles.quoteAuthor}>— James Clear</span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh", display: "flex", alignItems: "center",
    justifyContent: "center", padding: "24px",
    position: "relative", overflow: "hidden", background: "var(--bg)",
  },
  blob1: {
    position: "absolute", top: "-10%", left: "-5%", width: 500, height: 500,
    borderRadius: "50%", pointerEvents: "none",
    background: "radial-gradient(circle, rgba(200,240,96,0.07) 0%, transparent 70%)",
  },
  blob2: {
    position: "absolute", bottom: "-10%", right: "-5%", width: 400, height: 400,
    borderRadius: "50%", pointerEvents: "none",
    background: "radial-gradient(circle, rgba(124,106,245,0.08) 0%, transparent 70%)",
  },
  card: {
    width: "100%", maxWidth: 400,
    background: "var(--surface)", border: "1px solid var(--border-bright)",
    borderRadius: 20, padding: "44px 36px",
    boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
    animation: "fadeIn 0.5s ease", position: "relative", zIndex: 1,
  },
  header: { textAlign: "center", marginBottom: 32 },
  logoIcon: {
    display: "block", fontSize: 34, color: "var(--accent)",
    fontFamily: "var(--font-display)", marginBottom: 12,
  },
  title: {
    fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28,
    letterSpacing: "-0.5px", color: "var(--text)", marginBottom: 6,
  },
  subtitle: { color: "var(--text-muted)", fontSize: 13 },
  features: {
    display: "flex", flexDirection: "column", gap: 10, marginBottom: 32,
    padding: "18px 20px", background: "var(--surface2)",
    borderRadius: 12, border: "1px solid var(--border)",
  },
  feature: { display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "var(--text-dim)" },
  featureDot: { fontSize: 7, color: "var(--accent)" },
  googleBtn: {
    width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
    gap: 12, padding: "13px 20px", background: "#fff", borderRadius: 11,
    border: "none", cursor: "pointer", transition: "all 0.2s",
    boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
  },
  googleBtnLoading: { opacity: 0.7, cursor: "not-allowed" },
  googleIcon: { width: 20, height: 20, flexShrink: 0 },
  googleBtnText: {
    fontFamily: "var(--font-display)", fontWeight: 700,
    fontSize: 14, color: "#1a1a1a", letterSpacing: "0.01em",
  },
  spinner: { fontSize: 18, color: "#555" },
  error: {
    marginTop: 14, color: "var(--danger)", fontSize: 12,
    padding: "8px 12px", background: "rgba(255,77,109,0.1)",
    borderRadius: 8, border: "1px solid rgba(255,77,109,0.2)", textAlign: "center",
  },
  quote: {
    marginTop: 28, textAlign: "center", color: "var(--text-muted)",
    fontSize: 12, fontFamily: "var(--font-serif)", fontStyle: "italic", lineHeight: 1.7,
  },
  quoteAuthor: {
    fontStyle: "normal", fontSize: 11,
    fontFamily: "var(--font-body)", color: "var(--text-dim)",
  },
};