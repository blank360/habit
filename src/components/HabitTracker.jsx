import React, { useState, useEffect, useCallback } from "react";
import {
  doc, setDoc, getDoc, onSnapshot
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, ReferenceLine
} from "recharts";

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const DEFAULT_HABITS = ["", "", "", "", "", "", "", "", "", ""];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}

function getTodayDay() {
  return new Date().getDate();
}

function getDaysInMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
}

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "var(--surface2)",
        border: "1px solid var(--border-bright)",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 12,
        fontFamily: "var(--font-body)",
      }}>
        <div style={{ color: "var(--text-muted)", marginBottom: 2 }}>Day {label}</div>
        <div style={{ color: "var(--accent)", fontWeight: 600 }}>
          {payload[0].value} / 10 habits
        </div>
      </div>
    );
  }
  return null;
};

export default function HabitTracker({ user }) {
  const monthKey = getMonthKey();
  const todayDay = getTodayDay();
  const daysInMonth = getDaysInMonth();
  const d = new Date();
  const monthLabel = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

  const [habits, setHabits] = useState(DEFAULT_HABITS);
  const [checks, setChecks] = useState({}); // { "habitIdx_day": true }
  const [editingIdx, setEditingIdx] = useState(null);
  const [editingVal, setEditingVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const docRef = doc(db, "users", user.uid, "months", monthKey);

  // Live sync from Firestore
  useEffect(() => {
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.habits) setHabits(data.habits);
        if (data.checks) setChecks(data.checks);
      }
      setLoaded(true);
    });
    return unsub;
  }, [user.uid, monthKey]);

  // Save to Firestore
  const save = useCallback(async (newHabits, newChecks) => {
    setSaving(true);
    try {
      await setDoc(docRef, { habits: newHabits, checks: newChecks }, { merge: true });
    } catch(e) { console.error(e); }
    setSaving(false);
  }, [docRef]);

  const toggleCheck = (habitIdx, day) => {
    const key = `${habitIdx}_${day}`;
    const newChecks = { ...checks, [key]: !checks[key] };
    if (!newChecks[key]) delete newChecks[key];
    setChecks(newChecks);
    save(habits, newChecks);
  };

  const startEdit = (idx) => {
    setEditingIdx(idx);
    setEditingVal(habits[idx] || "");
  };

  const commitEdit = () => {
    if (editingIdx === null) return;
    const newHabits = [...habits];
    newHabits[editingIdx] = editingVal;
    setHabits(newHabits);
    save(newHabits, checks);
    setEditingIdx(null);
  };

  // Build score graph data
  const graphData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    let count = 0;
    habits.forEach((_, hIdx) => {
      if (checks[`${hIdx}_${day}`]) count++;
    });
    return { day, score: count };
  }).filter(d => d.day <= todayDay);

  const totalChecked = Object.values(checks).filter(Boolean).length;
  const todayScore = (() => {
    let c = 0;
    habits.forEach((_, hIdx) => { if (checks[`${hIdx}_${todayDay}`]) c++; });
    return c;
  })();
  const activeDays = new Set(
    Object.keys(checks).filter(k => checks[k]).map(k => k.split("_")[1])
  ).size;

  if (!loaded) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh" }}>
        <div style={{ color:"var(--text-muted)", fontFamily:"var(--font-body)", fontSize:13 }}>
          Loading your habits...
        </div>
      </div>
    );
  }

  return (
    <div style={s.root}>
      {/* Ambient blobs */}
      <div style={s.blob1} />
      <div style={s.blob2} />

      {/* Header */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.logoMark}>◈</span>
          <div>
            <h1 style={s.appTitle}>Habit Forge</h1>
            <p style={s.appSub}>{monthLabel}</p>
          </div>
        </div>
        <div style={s.headerRight}>
          <div style={s.userBadge}>
            <div style={s.userAvatar}>
              {(user.displayName || user.email || "?")[0].toUpperCase()}
            </div>
            <span style={s.userName}>{user.displayName || user.email}</span>
          </div>
          {saving && <span style={s.savingDot} title="Saving..." />}
          <button style={s.signOutBtn} onClick={() => signOut(auth)} title="Sign out">
            ⎋
          </button>
        </div>
      </header>

      {/* Stats row */}
      <div style={s.statsRow}>
        <Stat label="Today's Score" value={`${todayScore}/10`} accent />
        <Stat label="Total Checks" value={totalChecked} />
        <Stat label="Active Days" value={activeDays} />
        <Stat label="Month" value={monthLabel} />
      </div>

      {/* Habit Grid */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>Habits / Protocols</h2>
          <span style={s.sectionHint}>Click a habit name to edit • Click cells to check</span>
        </div>

        <div style={s.tableWrap}>
          <div style={s.tableScroll}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={{ ...s.th, ...s.habitCol }}>Habit</th>
                  {DAYS.slice(0, daysInMonth).map(d => (
                    <th key={d} style={{
                      ...s.th, ...s.dayCol,
                      ...(d === todayDay ? s.todayCol : {}),
                      ...(d > todayDay ? s.futureCol : {})
                    }}>
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {habits.map((habit, hIdx) => (
                  <tr key={hIdx} style={s.row}>
                    <td style={s.habitCell}>
                      <span style={s.habitNum}>{hIdx + 1}</span>
                      {editingIdx === hIdx ? (
                        <input
                          autoFocus
                          style={s.habitInput}
                          value={editingVal}
                          onChange={e => setEditingVal(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={e => { if (e.key === "Enter") commitEdit(); }}
                          placeholder={`Habit ${hIdx + 1}`}
                          maxLength={40}
                        />
                      ) : (
                        <span
                          style={{ ...s.habitName, ...(habit ? {} : s.habitPlaceholder) }}
                          onClick={() => startEdit(hIdx)}
                        >
                          {habit || `+ Add habit ${hIdx + 1}`}
                        </span>
                      )}
                    </td>
                    {DAYS.slice(0, daysInMonth).map(day => {
                      const key = `${hIdx}_${day}`;
                      const checked = !!checks[key];
                      const isToday = day === todayDay;
                      const isFuture = day > todayDay;
                      return (
                        <td
                          key={day}
                          style={{
                            ...s.checkCell,
                            ...(isToday ? s.todayCheckCell : {}),
                            ...(isFuture ? s.futureCheckCell : {}),
                          }}
                          onClick={() => !isFuture && toggleCheck(hIdx, day)}
                          title={isFuture ? "Future day" : checked ? "Mark incomplete" : "Mark complete"}
                        >
                          <div style={{
                            ...s.checkBox,
                            ...(checked ? s.checkBoxDone : {}),
                            ...(isFuture ? s.checkBoxFuture : {}),
                          }}>
                            {checked && <span style={s.checkMark}>✓</span>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Score Graph */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>Daily Score Graph</h2>
          <span style={s.sectionHint}>Habits completed per day</span>
        </div>
        <div style={s.graphCard}>
          {graphData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={graphData} margin={{ top: 10, right: 16, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="accentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-body)" }}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: "Day of Month", position: "insideBottom", offset: -2, fill: "var(--text-muted)", fontSize: 11 }}
                />
                <YAxis
                  domain={[0, 10]}
                  ticks={[0,2,4,6,8,10]}
                  tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-body)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={10} stroke="rgba(200,240,96,0.15)" strokeDasharray="4 4" />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
                  fill="url(#accentGrad)"
                  dot={{ fill: "var(--accent)", r: 3, strokeWidth: 0 }}
                  activeDot={{ fill: "var(--accent)", r: 5, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={s.emptyGraph}>
              Start tracking today to see your score graph
            </div>
          )}
        </div>

        {/* Score heatmap row */}
        <div style={s.scoreRow}>
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            let count = 0;
            habits.forEach((_, hIdx) => { if (checks[`${hIdx}_${day}`]) count++; });
            const pct = count / 10;
            const isFuture = day > todayDay;
            return (
              <div key={day} style={s.scoreCell}>
                <div style={{
                  ...s.scoreBar,
                  height: isFuture ? 4 : Math.max(4, pct * 56),
                  background: isFuture
                    ? "var(--border)"
                    : pct >= 0.8
                      ? "var(--accent)"
                      : pct >= 0.5
                        ? "rgba(200,240,96,0.5)"
                        : pct > 0
                          ? "rgba(200,240,96,0.25)"
                          : "var(--border)",
                  borderRadius: 3,
                }} title={isFuture ? "" : `Day ${day}: ${count}/10`} />
                <span style={s.scoreDayLabel}>{day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer style={s.footer}>
        <span style={s.quote}>"Success is the product of daily habits." — James Clear</span>
      </footer>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div style={s.stat}>
      <span style={{ ...s.statValue, ...(accent ? { color: "var(--accent)" } : {}) }}>
        {value}
      </span>
      <span style={s.statLabel}>{label}</span>
    </div>
  );
}

const s = {
  root: {
    minHeight: "100vh",
    padding: "24px 20px 40px",
    maxWidth: 1280,
    margin: "0 auto",
    position: "relative",
    animation: "fadeIn 0.4s ease",
  },
  blob1: {
    position: "fixed", top: 0, left: 0, width: 500, height: 500,
    background: "radial-gradient(circle, rgba(200,240,96,0.05) 0%, transparent 70%)",
    pointerEvents: "none", zIndex: 0,
  },
  blob2: {
    position: "fixed", bottom: 0, right: 0, width: 400, height: 400,
    background: "radial-gradient(circle, rgba(124,106,245,0.06) 0%, transparent 70%)",
    pointerEvents: "none", zIndex: 0,
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: 28, position: "relative", zIndex: 1,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  logoMark: { fontSize: 28, color: "var(--accent)", fontFamily: "var(--font-display)" },
  appTitle: {
    fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22,
    letterSpacing: "-0.5px", color: "var(--text)",
  },
  appSub: { fontSize: 12, color: "var(--text-muted)", marginTop: 1 },
  headerRight: { display: "flex", alignItems: "center", gap: 12 },
  userBadge: {
    display: "flex", alignItems: "center", gap: 8,
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: 20, padding: "5px 12px 5px 6px",
  },
  userAvatar: {
    width: 26, height: 26, borderRadius: "50%",
    background: "var(--accent)", color: "#0a0a0b",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, fontWeight: 700, fontFamily: "var(--font-display)",
  },
  userName: { fontSize: 12, color: "var(--text-dim)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  savingDot: {
    width: 6, height: 6, borderRadius: "50%",
    background: "var(--accent)", display: "inline-block",
    animation: "pulse-glow 1s ease infinite",
  },
  signOutBtn: {
    background: "var(--surface2)", border: "1px solid var(--border)",
    borderRadius: 8, padding: "6px 10px", color: "var(--text-muted)",
    fontSize: 16, transition: "all 0.2s",
  },
  statsRow: {
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12,
    marginBottom: 28, position: "relative", zIndex: 1,
  },
  stat: {
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: 14, padding: "16px 20px",
    display: "flex", flexDirection: "column", gap: 4,
  },
  statValue: {
    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22,
    color: "var(--text)", letterSpacing: "-0.5px",
  },
  statLabel: { fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" },
  section: { marginBottom: 28, position: "relative", zIndex: 1 },
  sectionHeader: {
    display: "flex", alignItems: "baseline", gap: 12, marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16,
    color: "var(--text)", letterSpacing: "-0.3px",
  },
  sectionHint: { fontSize: 11, color: "var(--text-muted)" },
  tableWrap: {
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: 16, overflow: "hidden",
  },
  tableScroll: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 900 },
  th: {
    padding: "10px 0", textAlign: "center", fontSize: 11,
    color: "var(--text-muted)", fontFamily: "var(--font-body)",
    fontWeight: 500, letterSpacing: "0.04em",
    borderBottom: "1px solid var(--border)",
    position: "sticky", top: 0, background: "var(--surface)", zIndex: 2,
  },
  habitCol: {
    width: 220, textAlign: "left", padding: "10px 16px",
    borderRight: "1px solid var(--border)",
  },
  dayCol: { width: 32, minWidth: 28 },
  todayCol: { color: "var(--accent)", fontWeight: 700 },
  futureCol: { opacity: 0.4 },
  row: {
    borderBottom: "1px solid var(--border)",
    transition: "background 0.15s",
  },
  habitCell: {
    padding: "8px 14px", display: "flex", alignItems: "center", gap: 8,
    borderRight: "1px solid var(--border)", minWidth: 220,
  },
  habitNum: {
    fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-body)",
    minWidth: 16, textAlign: "right",
  },
  habitName: {
    fontSize: 13, color: "var(--text)", cursor: "pointer",
    flex: 1, transition: "color 0.15s",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  habitPlaceholder: { color: "var(--text-muted)", fontStyle: "italic" },
  habitInput: {
    background: "transparent", border: "none", borderBottom: "1px solid var(--accent)",
    color: "var(--text)", fontSize: 13, fontFamily: "var(--font-body)",
    padding: "2px 0", flex: 1, outline: "none",
  },
  checkCell: {
    textAlign: "center", padding: "6px 2px", cursor: "pointer",
    transition: "background 0.1s",
  },
  todayCheckCell: { background: "rgba(200,240,96,0.04)" },
  futureCheckCell: { opacity: 0.3, cursor: "default" },
  checkBox: {
    width: 22, height: 22, borderRadius: 6, margin: "0 auto",
    border: "1.5px solid var(--border-bright)",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.15s", background: "transparent",
  },
  checkBoxDone: {
    background: "var(--accent)", border: "1.5px solid var(--accent)",
    animation: "check-pop 0.25s ease",
  },
  checkBoxFuture: { border: "1.5px solid var(--border)", opacity: 0.5 },
  checkMark: { fontSize: 12, color: "#0a0a0b", fontWeight: 700, lineHeight: 1 },
  graphCard: {
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: 16, padding: "24px 16px 16px",
    marginBottom: 16,
  },
  emptyGraph: {
    height: 180, display: "flex", alignItems: "center", justifyContent: "center",
    color: "var(--text-muted)", fontSize: 13, fontStyle: "italic",
  },
  scoreRow: {
    display: "flex", gap: 3, alignItems: "flex-end",
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: 16, padding: "20px 16px 12px",
    overflowX: "auto",
  },
  scoreCell: {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: 6, flex: "1 0 auto", minWidth: 16,
    justifyContent: "flex-end", height: 78,
  },
  scoreBar: {
    width: "100%", maxWidth: 22, borderRadius: 3,
    transition: "height 0.3s ease, background 0.3s ease",
  },
  scoreDayLabel: { fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-body)" },
  footer: {
    textAlign: "center", marginTop: 40, position: "relative", zIndex: 1,
  },
  quote: { fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-serif)", fontStyle: "italic" },
};
