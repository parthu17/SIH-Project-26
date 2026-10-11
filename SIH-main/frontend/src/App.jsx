import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Camera, MapPin, ShieldCheck, AlertTriangle, CheckCircle2, Circle,
  Smartphone, LayoutDashboard, RefreshCw, Radio, ChevronLeft, ChevronRight,
  Video, Zap, Clock, Building2, ClipboardList, Wifi, Sparkles, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import {
  API_ORIGIN, getInstitutions, getInspections, getPending,
  submitInspection as apiSubmitInspection, triggerSurprise as apiTriggerSurprise,
  resetDemo as apiResetDemo
} from "./api";

// ---------- design tokens ----------
const C = {
  ink: "#16233D",
  inkSoft: "#3E4C63",
  steel: "#5C6B84",
  steelFaint: "#8492A8",
  line: "#DDE3E2",
  lineSoft: "#E9ECEA",
  paper: "#EEF1F0",
  panel: "#FFFFFF",
  teal: "#1F7A6C",
  tealSoft: "#E4F1EE",
  amber: "#B8842E",
  amberSoft: "#F6EBD8",
  red: "#AD3B30",
  redSoft: "#F7E6E3",
};

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, 'Roboto Mono', Menlo, monospace";

// ---------- helpers ----------
const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => Date.now();

function fmtTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function fmtRelative(ts) {
  const diff = now() - ts;
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return "just now";
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function riskBand(score) {
  if (score >= 65) return { label: "High", color: C.red, bg: C.redSoft };
  if (score >= 35) return { label: "Moderate", color: C.amber, bg: C.amberSoft };
  return { label: "Low", color: C.teal, bg: C.tealSoft };
}

// ---------- global styles ----------
function GlobalStyle() {
  return (
    <style>{`
      .ix * { box-sizing: border-box; }
      .ix button, .ix input, .ix textarea { font-family: inherit; }
      .ix button:focus-visible, .ix input:focus-visible, .ix textarea:focus-visible {
        outline: 2px solid ${C.teal}; outline-offset: 2px;
      }
      @keyframes ixPulse { 0%,100%{ opacity:1 } 50%{ opacity:.35 } }
      @keyframes ixFadeSlide { from{ opacity:0; transform:translateY(4px);} to{ opacity:1; transform:translateY(0);} }
      @keyframes ixSlideX { from{ opacity:0; transform:translateX(10px);} to{ opacity:1; transform:translateX(0);} }
      @keyframes ixPop { from{ transform:scale(.6); opacity:0;} to{ transform:scale(1); opacity:1;} }
      @keyframes ixToastIn { from{ opacity:0; transform:translate(-50%,-10px);} to{ opacity:1; transform:translate(-50%,0);} }
      .ix-pulse-dot { animation: ixPulse 1.8s ease-in-out infinite; }
      .ix-enter { animation: ixFadeSlide .3s ease both; }
      .ix-enter-x { animation: ixSlideX .28s ease both; }
      .ix-pop { animation: ixPop .35s cubic-bezier(.34,1.56,.64,1) both; }
      .ix-row {
        transition: box-shadow .18s ease, transform .18s ease, border-color .18s ease;
      }
      .ix-row:hover {
        box-shadow: 0 4px 14px rgba(22,35,61,0.09);
        transform: translateY(-1px);
        border-color: ${C.steelFaint};
      }
      .ix-btn-primary {
        transition: background .15s ease, transform .1s ease;
      }
      .ix-btn-primary:hover:not(:disabled) { background: #0F1929; }
      .ix-btn-primary:active:not(:disabled) { transform: scale(.98); }
      .ix-btn-ghost { transition: background .15s ease, color .15s ease, border-color .15s ease; }
      .ix-btn-ghost:hover { background: rgba(255,255,255,0.08); border-color: #56668A; }
      .ix-toggle-btn { transition: background .18s ease, color .18s ease; }
      .ix-queue-item { transition: background .15s ease, border-color .15s ease, transform .15s ease; }
      .ix-queue-item:hover { background: #fff; border-color: ${C.steelFaint}; transform: translateX(2px); }
      .ix-capture { transition: background .18s ease, border-color .18s ease, transform .1s ease; }
      .ix-capture:active { transform: scale(.99); }
      .ix-check-row { transition: opacity .15s ease; }
      .ix-check-row:hover { opacity: .75; }
      .ix-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
      .ix-scrollbar::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 4px; }
      .ix-bar-fill { transition: width .5s cubic-bezier(.34,1.2,.64,1); }
      .ix-badge { transition: background .3s ease, color .3s ease; }
      .ix-reset-icon { transition: transform .4s ease; }
      .ix-reset:hover .ix-reset-icon { transform: rotate(180deg); }
    `}</style>
  );
}

// ---------- toast ----------
function Toast({ toast }) {
  if (!toast) return null;
  const tone = toast.type === "warn" ? { bg: C.ink, icon: <Zap size={13} color={C.amber} /> }
    : toast.type === "success" ? { bg: C.ink, icon: <CheckCircle2 size={13} color={C.teal} /> }
    : { bg: C.ink, icon: <Sparkles size={13} color="#fff" /> };
  return (
    <div style={{
      position: "fixed", top: 18, left: "50%", zIndex: 50,
      background: tone.bg, color: "#fff", padding: "9px 16px", borderRadius: 999,
      fontSize: 12.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 8,
      boxShadow: "0 8px 24px rgba(15,25,41,0.28)", animation: "ixToastIn .25s ease both",
      whiteSpace: "nowrap",
    }}>
      {tone.icon} {toast.msg}
    </div>
  );
}

// ---------- app ----------
export default function App() {
  const [view, setView] = useState("dashboard"); // 'dashboard' | 'inspector'
  const [institutions, setInstitutions] = useState(null);
  const [inspections, setInspections] = useState(null);
  const [pending, setPending] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState(now());
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const notify = useCallback((msg, type = "info") => {
    setToast({ msg, type, id: uid() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setClock(now()), 30000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const [instData, inspData, pendData] = await Promise.all([
      getInstitutions(), getInspections(), getPending(),
    ]);
    setInstitutions(instData);
    setInspections(inspData);
    setPending(pendData);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const submitInspection = useCallback(async (payload, photoFile) => {
    const record = await apiSubmitInspection(payload, photoFile);
    await load();
    notify(record.flagged ? "Inspection synced \u2014 issues flagged" : "Inspection synced \u2014 all clear", record.flagged ? "warn" : "success");
    return record;
  }, [load, notify]);

  const triggerSurprise = useCallback(async () => {
    const assignment = await apiTriggerSurprise();
    await load();
    notify(`Surprise inspection assigned to ${assignment.inspector}`, "info");
  }, [load, notify]);

  const resetDemo = useCallback(async () => {
    await apiResetDemo();
    await load();
    notify("Demo data reset", "info");
  }, [load, notify]);

  if (loading || !institutions) {
    return (
      <div className="ix" style={{ fontFamily: FONT, background: C.paper, minHeight: 500, display: "flex", alignItems: "center", justifyContent: "center", color: C.steel, gap: 8 }}>
        <GlobalStyle />
        <RefreshCw size={14} className="ix-pulse-dot" /> Loading Inspectra…
      </div>
    );
  }

  return (
    <div className="ix" style={{ fontFamily: FONT, background: C.paper, minHeight: 600, color: C.ink, position: "relative" }}>
      <GlobalStyle />
      <Toast toast={toast} />
      <TopBar view={view} setView={setView} clock={clock} onReset={resetDemo} pendingCount={pending.length} />
      {view === "dashboard" ? (
        <Dashboard key="dash" institutions={institutions} inspections={inspections} pending={pending} onSurprise={triggerSurprise} />
      ) : (
        <InspectorApp key="insp" institutions={institutions} pending={pending} onSubmit={submitInspection} />
      )}
    </div>
  );
}

// ---------- top bar ----------
function TopBar({ view, setView, clock, onReset, pendingCount }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 20px", background: C.ink, color: "#fff",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em" }}>Inspectra</span>
        <span style={{ fontSize: 12, color: "#9AA7BD", display: "flex", alignItems: "baseline", gap: 8 }}>
          Real-Time Monitoring &amp; Inspection
          <span style={{ fontFamily: MONO, fontSize: 10.5, color: "#6E7DA0" }}>SIH26095</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: 6, fontSize: 10.5, color: "#8FE0C8" }}>
          <span className="ix-pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#3FC79A", display: "inline-block" }} />
          LIVE
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {pendingCount > 0 && (
          <span style={{ fontSize: 11, color: "#E9C079", display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={11} /> {pendingCount} pending
          </span>
        )}
        <span style={{ fontFamily: MONO, fontSize: 12, color: "#9AA7BD" }}>
          {new Date(clock).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
        </span>
        <button onClick={onReset} title="Reset demo data" className="ix-btn-ghost ix-reset" style={{
          display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid #3E4C63",
          color: "#C9D2E0", borderRadius: 6, padding: "6px 10px", fontSize: 12, cursor: "pointer",
        }}>
          <RefreshCw size={13} className="ix-reset-icon" /> Reset
        </button>
        <div style={{ display: "flex", background: "#0F1929", borderRadius: 8, padding: 3 }}>
          <ToggleBtn active={view === "dashboard"} onClick={() => setView("dashboard")} icon={<LayoutDashboard size={14} />} label="Dashboard" />
          <ToggleBtn active={view === "inspector"} onClick={() => setView("inspector")} icon={<Smartphone size={14} />} label="Inspector App" />
        </div>
      </div>
    </div>
  );
}

function ToggleBtn({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} className="ix-toggle-btn" style={{
      display: "flex", alignItems: "center", gap: 6, border: "none", cursor: "pointer",
      padding: "7px 12px", borderRadius: 6, fontSize: 12.5, fontWeight: 600,
      background: active ? "#fff" : "transparent", color: active ? C.ink : "#8492A8",
    }}>
      {icon} {label}
    </button>
  );
}

// ================= DASHBOARD =================
function Dashboard({ institutions, inspections, pending, onSurprise }) {
  const flaggedCount = inspections.filter(i => i.flagged).length;
  const highRisk = institutions.filter(i => i.riskScore >= 65).length;

  const buckets = useMemo(() => {
    const b = { Low: 0, Moderate: 0, High: 0 };
    institutions.forEach(i => { b[riskBand(i.riskScore).label]++; });
    return b;
  }, [institutions]);
  const maxBucket = Math.max(1, ...Object.values(buckets));

  const alerts = useMemo(() => (
    inspections.filter(i => i.flagged).slice(0, 5)
  ), [inspections]);

  return (
    <div className="ix-enter" style={{ padding: 24, display: "grid", gap: 20 }}>
      {/* stat row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <StatCard icon={<Building2 size={16} />} label="Institutions monitored" value={institutions.length} accentBar={C.steel} />
        <StatCard icon={<ClipboardList size={16} />} label="Inspections logged" value={inspections.length} accentBar={C.ink} />
        <StatCard icon={<Clock size={16} />} label="Pending assignments" value={pending.length} accent={pending.length ? C.amber : undefined} accentBar={pending.length ? C.amber : C.line} />
        <StatCard icon={<AlertTriangle size={16} />} label="Critical alerts" value={flaggedCount} accent={flaggedCount ? C.red : undefined} accentBar={flaggedCount ? C.red : C.line} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
        {/* institution list */}
        <Panel title="Institutions" subtitle={`${highRisk} flagged as high risk`}>
          <div className="ix-scrollbar" style={{ display: "grid", gap: 10, maxHeight: 420, overflowY: "auto", paddingRight: 4 }}>
            {institutions.slice().sort((a, b) => b.riskScore - a.riskScore).map((inst, idx) => {
              const band = riskBand(inst.riskScore);
              return (
                <div key={inst.id} className="ix-row" style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 14px", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8,
                  animationDelay: `${idx * 30}ms`,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{inst.name}</div>
                    <div style={{ fontSize: 12, color: C.steel, marginTop: 4, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                      <span>{inst.category}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {inst.cctv === "online"
                          ? <Wifi size={11} color={C.teal} />
                          : <Video size={11} color={C.red} />}
                        CCTV {inst.cctv}
                      </span>
                      <span style={{ fontFamily: MONO, fontSize: 11 }}>last visit {fmtRelative(inst.lastInspection)}</span>
                    </div>
                  </div>
                  <div className="ix-badge" style={{
                    fontSize: 12, fontWeight: 700, color: band.color, background: band.bg,
                    borderRadius: 20, padding: "5px 13px", whiteSpace: "nowrap", marginLeft: 12,
                    display: "flex", alignItems: "center", gap: 5,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: band.color, display: "inline-block" }} />
                    {band.label} · {inst.riskScore}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* alerts + surprise engine */}
        <div style={{ display: "grid", gap: 20, alignContent: "start" }}>
          <Panel title="Critical alerts" subtitle="From flagged inspections">
            {alerts.length === 0 ? (
              <EmptyNote icon={<ShieldCheck size={18} color={C.teal} />} text="No critical alerts right now." />
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {alerts.map((a, idx) => (
                  <div key={a.id} className="ix-enter" style={{ padding: "10px 12px", background: C.redSoft, borderRadius: 8, borderLeft: `3px solid ${C.red}`, animationDelay: `${idx * 40}ms` }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>{a.institutionName}</div>
                    <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 3 }}>{a.notes || "Checklist issue flagged"}</div>
                    <div style={{ fontSize: 10.5, color: C.steel, marginTop: 4, fontFamily: MONO }}>{fmtTime(a.timestamp)} · {a.inspector}</div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Smart Inspection Engine">
            <p style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.5, margin: "0 0 12px" }}>
              Randomly assigns a surprise inspection, weighted toward higher-risk institutions, so visits stay unpredictable.
            </p>
            <button onClick={onSurprise} className="ix-btn-primary" style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
              background: C.ink, color: "#fff", border: "none", borderRadius: 8, padding: "11px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
              <Zap size={14} /> Trigger surprise inspection
            </button>
            {pending.length > 0 && (
              <div className="ix-scrollbar" style={{ marginTop: 12, display: "grid", gap: 6, maxHeight: 160, overflowY: "auto" }}>
                {pending.map((p, idx) => (
                  <div key={p.id} className="ix-enter" style={{ fontSize: 11.5, color: C.inkSoft, background: C.amberSoft, borderRadius: 6, padding: "8px 10px", animationDelay: `${idx * 40}ms` }}>
                    <b>{p.institutionName}</b> assigned to {p.inspector} <span style={{ color: C.steel }}>· awaiting visit</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
        {/* recent inspections table */}
        <Panel title="Recent inspections">
          {inspections.length === 0 ? (
            <EmptyNote icon={<ClipboardList size={18} color={C.steel} />} text="No inspections logged yet." />
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ textAlign: "left", color: C.steel, fontSize: 11 }}>
                  <th style={{ padding: "0 8px 8px 0", fontWeight: 600 }}>Institution</th>
                  <th style={{ padding: "0 8px 8px", fontWeight: 600 }}>Inspector</th>
                  <th style={{ padding: "0 8px 8px", fontWeight: 600 }}>Attendance</th>
                  <th style={{ padding: "0 8px 8px", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "0 0 8px", fontWeight: 600 }}>When</th>
                </tr>
              </thead>
              <tbody>
                {inspections.slice(0, 8).map(i => (
                  <tr key={i.id} style={{ borderTop: `1px solid ${C.lineSoft}` }}>
                    <td style={{ padding: "9px 8px 9px 0", fontWeight: 600 }}>{i.institutionName}</td>
                    <td style={{ padding: "9px 8px" }}>{i.inspector}</td>
                    <td style={{ padding: "9px 8px", fontFamily: MONO }}>{i.attendance}/{i.expected}</td>
                    <td style={{ padding: "9px 8px" }}>
                      {i.flagged ? (
                        <span style={{ color: C.red, display: "flex", alignItems: "center", gap: 4 }}><AlertTriangle size={12} /> Flagged</span>
                      ) : (
                        <span style={{ color: C.teal, display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={12} /> Clear</span>
                      )}
                    </td>
                    <td style={{ padding: "9px 0", color: C.steel, fontFamily: MONO, fontSize: 11.5 }}>{fmtRelative(i.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        {/* risk distribution */}
        <Panel title="Risk distribution">
          <div style={{ display: "grid", gap: 14, paddingTop: 4 }}>
            {Object.entries(buckets).map(([label, count]) => {
              const band = riskBand(label === "High" ? 90 : label === "Moderate" ? 50 : 10);
              return (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                    <span style={{ color: C.inkSoft, fontWeight: 600 }}>{label}</span>
                    <span style={{ fontFamily: MONO, color: C.steel }}>{count}</span>
                  </div>
                  <div style={{ background: C.lineSoft, borderRadius: 5, height: 8, overflow: "hidden" }}>
                    <div className="ix-bar-fill" style={{ width: `${(count / maxBucket) * 100}%`, height: "100%", background: band.color, borderRadius: 5 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, accent, accentBar }) {
  return (
    <div className="ix-row" style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: "14px 16px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accentBar || C.line }} />
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.steel, fontSize: 11.5, fontWeight: 600 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 27, fontWeight: 700, marginTop: 7, color: accent || C.ink, letterSpacing: "-0.01em" }}>{value}</div>
    </div>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: 18, boxShadow: "0 1px 2px rgba(22,35,61,0.03)" }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: "-0.01em" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11.5, color: C.steel, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function EmptyNote({ text, icon }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "20px 0", color: C.steel }}>
      {icon}
      <span style={{ fontSize: 12.5 }}>{text}</span>
    </div>
  );
}

// ================= INSPECTOR APP (phone frame) =================
function InspectorApp({ institutions, pending, onSubmit }) {
  const [screen, setScreen] = useState("queue"); // 'queue' | 'form' | 'done'
  const [active, setActive] = useState(null);
  const [lastRecord, setLastRecord] = useState(null);

  const queueItems = useMemo(() => {
    const surprises = pending.map(p => ({ id: p.institutionId, name: p.institutionName, type: "Surprise", inspector: p.inspector }));
    const scheduled = institutions
      .filter(i => !pending.find(p => p.institutionId === i.id))
      .slice(0, 3)
      .map(i => ({ id: i.id, name: i.name, type: "Scheduled", inspector: "You" }));
    return [...surprises, ...scheduled];
  }, [institutions, pending]);

  function openForm(inst) {
    setActive(institutions.find(i => i.id === inst.id));
    setScreen("form");
  }

  async function handleSubmit(payload, photoFile) {
    const record = await onSubmit(payload, photoFile);
    setLastRecord(record);
    setScreen("done");
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "28px 20px 40px" }}>
      <div style={{
        width: 375, background: "#fff", borderRadius: 34, border: `8px solid ${C.ink}`,
        boxShadow: "0 24px 48px rgba(22,35,61,0.2)", overflow: "hidden", position: "relative",
      }}>
        {/* notch */}
        <div style={{
          position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
          width: 84, height: 18, background: C.ink, borderRadius: 12, zIndex: 2,
        }} />
        {/* phone status bar */}
        <div style={{ background: C.ink, color: "#fff", padding: "10px 18px 8px", fontSize: 11, fontFamily: MONO, display: "flex", justifyContent: "space-between" }}>
          <span>Inspectra Field</span>
          <span>9:41</span>
        </div>

        <div style={{ minHeight: 480 }}>
          {screen === "queue" && <div key="queue" className="ix-enter-x"><QueueScreen items={queueItems} onOpen={openForm} /></div>}
          {screen === "form" && active && <div key="form" className="ix-enter-x"><FormScreen inst={active} onBack={() => setScreen("queue")} onSubmit={handleSubmit} /></div>}
          {screen === "done" && lastRecord && <div key="done" className="ix-enter-x"><DoneScreen record={lastRecord} onDone={() => setScreen("queue")} /></div>}
        </div>
      </div>
    </div>
  );
}

function QueueScreen({ items, onOpen }) {
  return (
    <div style={{ padding: "16px 16px 22px" }}>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>Today's queue</div>
      <div style={{ fontSize: 12, color: C.steel, marginBottom: 16 }}>{items.length} institution{items.length !== 1 ? "s" : ""} assigned</div>
      {items.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "50px 0", color: C.steel }}>
          <CheckCircle2 size={28} color={C.teal} />
          <span style={{ fontSize: 12.5 }}>All caught up for today.</span>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((it, idx) => (
            <button key={it.id} onClick={() => onOpen(it)} className="ix-queue-item ix-enter" style={{
              textAlign: "left", background: C.paper, border: `1px solid ${C.line}`, borderRadius: 10,
              padding: "12px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
              animationDelay: `${idx * 50}ms`,
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{it.name}</div>
                <div style={{ fontSize: 11, color: C.steel, marginTop: 3 }}>
                  {it.type === "Surprise" ? <span style={{ color: C.amber, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><Zap size={10} /> Surprise visit</span> : "Scheduled visit"}
                </div>
              </div>
              <ChevronRight size={16} color={C.steel} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FormScreen({ inst, onBack, onSubmit }) {
  const [attendance, setAttendance] = useState("");
  const [expected, setExpected] = useState("50");
  const [facilityOk, setFacilityOk] = useState(true);
  const [hygieneOk, setHygieneOk] = useState(true);
  const [documentsOk, setDocumentsOk] = useState(true);
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const canSubmit = attendance !== "" && !!photoFile;

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function submit() {
    setSubmitting(true);
    await onSubmit({
      institutionId: inst.id,
      inspector: "You",
      attendance: Number(attendance),
      expected: Number(expected) || 1,
      facilityOk, hygieneOk, documentsOk, notes,
    }, photoFile);
    setSubmitting(false);
  }

  return (
    <div style={{ padding: "14px 16px 22px" }}>
      <button onClick={onBack} className="ix-btn-ghost" style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: C.steel, fontSize: 12, padding: "4px 0", marginBottom: 10, cursor: "pointer", borderRadius: 4 }}>
        <ChevronLeft size={14} /> Queue
      </button>
      <div style={{ fontSize: 15, fontWeight: 700 }}>{inst.name}</div>
      <div style={{ fontSize: 11.5, color: C.steel, marginTop: 2 }}>{inst.category}</div>

      <div style={{ marginTop: 16 }}>
        <FieldLabel>Attendance</FieldLabel>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={attendance} onChange={e => setAttendance(e.target.value.replace(/\D/g, ""))} placeholder="present"
            style={inputStyle} />
          <input value={expected} onChange={e => setExpected(e.target.value.replace(/\D/g, ""))} placeholder="expected"
            style={inputStyle} />
        </div>
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
        <CheckRow label="Facility in order" val={facilityOk} onChange={setFacilityOk} />
        <CheckRow label="Hygiene standards met" val={hygieneOk} onChange={setHygieneOk} />
        <CheckRow label="Documents up to date" val={documentsOk} onChange={setDocumentsOk} />
      </div>

      <div style={{ marginTop: 14 }}>
        <FieldLabel>Notes</FieldLabel>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Optional observations"
          style={{ ...inputStyle, width: "100%", resize: "none", boxSizing: "border-box" }} />
      </div>

      <div style={{ marginTop: 14 }}>
        <FieldLabel>Evidence</FieldLabel>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <button onClick={() => fileInputRef.current?.click()} className="ix-capture" style={{
          width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          background: photoFile ? C.tealSoft : C.paper, border: `1.5px dashed ${photoFile ? C.teal : C.line}`,
          borderRadius: 10, padding: "16px", cursor: "pointer",
        }}>
          {photoFile ? (
            <img src={photoPreview} alt="evidence" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }} />
          ) : (
            <Camera size={20} color={C.steel} />
          )}
          <span style={{ fontSize: 11.5, color: photoFile ? C.teal : C.steel, fontWeight: 600 }}>
            {photoFile ? "Photo captured & geo-tagged (tap to retake)" : "Capture photo evidence"}
          </span>
          {photoFile && (
            <span className="ix-pop" style={{ fontSize: 10, fontFamily: MONO, color: C.steel, display: "flex", alignItems: "center", gap: 3 }}>
              <MapPin size={10} /> {inst.lat.toFixed(4)}, {inst.lng.toFixed(4)} · {fmtTime(now())}
            </span>
          )}
        </button>
      </div>

      <button disabled={!canSubmit || submitting} onClick={submit} className="ix-btn-primary" style={{
        width: "100%", marginTop: 18, background: canSubmit ? C.ink : C.lineSoft, color: canSubmit ? "#fff" : C.steel,
        border: "none", borderRadius: 8, padding: "12px", fontSize: 13.5, fontWeight: 700,
        cursor: canSubmit ? "pointer" : "not-allowed",
      }}>
        {submitting ? "Submitting…" : "Submit inspection"}
      </button>
    </div>
  );
}

function FieldLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 600, color: C.steel, marginBottom: 6 }}>{children}</div>;
}

const inputStyle = {
  flex: 1, border: `1px solid ${C.line}`, borderRadius: 8, padding: "9px 10px", fontSize: 13,
  fontFamily: FONT, outline: "none", background: "#fff", transition: "border-color .15s ease",
};

function CheckRow({ label, val, onChange }) {
  return (
    <button onClick={() => onChange(!val)} className="ix-check-row" style={{
      display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left",
    }}>
      {val ? <CheckCircle2 size={18} color={C.teal} /> : <Circle size={18} color={C.line} />}
      <span style={{ fontSize: 12.5, color: C.ink }}>{label}</span>
    </button>
  );
}

function DoneScreen({ record, onDone }) {
  return (
    <div style={{ padding: "40px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <div className="ix-pop" style={{
        width: 56, height: 56, borderRadius: "50%",
        background: record.flagged ? C.redSoft : C.tealSoft,
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
      }}>
        {record.flagged
          ? <AlertTriangle size={26} color={C.red} />
          : <ShieldCheck size={26} color={C.teal} />}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700 }}>Inspection submitted</div>
      <div style={{ fontSize: 12.5, color: C.steel, marginTop: 6, lineHeight: 1.5 }}>
        {record.flagged
          ? "Issues were detected — this has been flagged on the official dashboard."
          : "No issues found. Institution risk score updated."}
      </div>
      {record.photoUrl && (
        <img src={`${API_ORIGIN}${record.photoUrl}`} alt="evidence" style={{ width: 84, height: 84, objectFit: "cover", borderRadius: 10, marginTop: 14 }} />
      )}
      {typeof record.prevRisk === "number" && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: 12, fontFamily: MONO, color: C.inkSoft }}>
          risk {record.prevRisk}
          {record.flagged ? <ArrowUpRight size={13} color={C.red} /> : <ArrowDownRight size={13} color={C.teal} />}
        </div>
      )}
      <div style={{ fontSize: 10.5, fontFamily: MONO, color: C.steel, marginTop: 14, display: "flex", alignItems: "center", gap: 4 }}>
        <Radio size={11} className="ix-pulse-dot" /> synced to dashboard
      </div>
      <button onClick={onDone} className="ix-btn-primary" style={{
        marginTop: 22, background: C.ink, color: "#fff", border: "none", borderRadius: 8,
        padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
      }}>
        Back to queue
      </button>
    </div>
  );
}
