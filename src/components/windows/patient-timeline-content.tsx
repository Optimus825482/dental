"use client";

import { useState, useEffect } from "react";
import { useWindowStore } from "@/stores/window-store";

interface TreatmentPlanItem {
  id: string;
  status: string;
  treatmentDef: { name: string; code?: string };
  toothNumber?: number;
  unitPrice: number;
}
interface TreatmentSession {
  id: string;
  sessionNo: number;
  date: string;
  status: string;
  notes?: string;
}
interface TreatmentPlan {
  id: string;
  title?: string;
  status: string;
  createdAt: string;
  totalCost: number;
  doctor: { name: string };
  items: TreatmentPlanItem[];
  sessions: TreatmentSession[];
}
interface Appointment {
  id: string;
  startTime: string;
  status: string;
  type?: string;
  doctor: { name: string };
}
interface PatientData {
  id: string;
  firstName: string;
  lastName: string;
  patientNo: string;
  phone: string;
  createdAt: string;
  allergies: { allergen: string }[];
  treatmentPlans: TreatmentPlan[];
  appointments: Appointment[];
}

interface Visit {
  id: string;
  createdAt: string;
  user: { name: string };
  details: {
    visitDate?: string;
    reason?: string;
    diagnosis?: string;
    diagnosisCode?: string;
    status?: string;
  };
}

// ── Renk & etiket haritaları ──────────────────────────────
const PLAN_STATUS: Record<
  string,
  { label: string; bg: string; dot: string; border: string }
> = {
  ACTIVE: {
    label: "Devam Ediyor",
    bg: "bg-emerald-50",
    dot: "bg-emerald-500",
    border: "border-emerald-200",
  },
  DRAFT: {
    label: "Taslak",
    bg: "bg-amber-50",
    dot: "bg-amber-400",
    border: "border-amber-200",
  },
  COMPLETED: {
    label: "Tamamlandı",
    bg: "bg-blue-50",
    dot: "bg-blue-500",
    border: "border-blue-200",
  },
  CANCELLED: {
    label: "İptal",
    bg: "bg-surface-container",
    dot: "bg-outline",
    border: "border-outline-variant/30",
  },
};
const ITEM_STATUS: Record<string, { icon: string; color: string }> = {
  COMPLETED: { icon: "✓", color: "text-emerald-600 bg-emerald-100" },
  IN_PROGRESS: { icon: "▶", color: "text-blue-600 bg-blue-100" },
  PLANNED: { icon: "○", color: "text-on-surface-variant bg-surface-container" },
  CANCELLED: { icon: "✕", color: "text-error bg-error/10" },
};
const APPT_STATUS: Record<
  string,
  { icon: string; color: string; label: string }
> = {
  SCHEDULED: { icon: "📅", color: "text-blue-600", label: "Planlandı" },
  CONFIRMED: { icon: "✅", color: "text-violet-600", label: "Onaylandı" },
  IN_PROGRESS: { icon: "▶", color: "text-primary", label: "Devam Ediyor" },
  COMPLETED: { icon: "✓", color: "text-emerald-600", label: "Tamamlandı" },
  CANCELLED: { icon: "✕", color: "text-error", label: "İptal" },
  NO_SHOW: { icon: "⚠", color: "text-amber-600", label: "Gelmedi" },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PatientTimelineContent({ patientId }: { patientId: string }) {
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewVisit, setShowNewVisit] = useState(false);
  const [visitReason, setVisitReason] = useState("");
  const [visitDate, setVisitDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { openWindow } = useWindowStore();

  useEffect(() => {
    Promise.all([
      fetch(`/api/patients/${patientId}`).then((r) => r.json()),
      fetch(`/api/patients/visit?patientId=${patientId}`).then((r) => r.json()),
    ])
      .then(([p, v]) => {
        setPatient(p);
        setVisits(v.visits || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [patientId]);

  function toggle(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function saveNewVisit() {
    if (!visitReason.trim() || !patient) return;
    setSaving(true);
    const res = await fetch("/api/patients/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: patient.id,
        visitDate,
        reason: visitReason,
      }),
    });
    if (res.ok) {
      const newVisit = await res.json();
      setVisits((prev) => [newVisit, ...prev]);
      setShowNewVisit(false);
      setVisitReason("");
    }
    setSaving(false);
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  if (!patient)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-outline">
        <span className="text-4xl">⚠️</span>
        <p className="text-sm font-bold">Hasta bulunamadı</p>
      </div>
    );

  // ── Timeline olaylarını oluştur ───────────────────────
  type TLEvent =
    | { kind: "registered"; date: string }
    | { kind: "visit"; visit: Visit; date: string }
    | { kind: "plan"; plan: TreatmentPlan; date: string }
    | {
        kind: "appointment";
        appt: Appointment;
        date: string;
        upcoming: boolean;
      };

  const now = new Date();
  const events: TLEvent[] = [
    { kind: "registered" as const, date: patient.createdAt },
    ...visits.map((v) => ({
      kind: "visit" as const,
      visit: v,
      date: v.createdAt,
    })),
    ...patient.treatmentPlans.map((p) => ({
      kind: "plan" as const,
      plan: p,
      date: p.createdAt,
    })),
    ...patient.appointments.map((a) => ({
      kind: "appointment" as const,
      appt: a,
      date: a.startTime,
      upcoming: new Date(a.startTime) > now && a.status !== "CANCELLED",
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-3.5 border-b border-outline-variant/20 bg-white shrink-0">
        <div className="w-11 h-11 rounded-2xl bg-primary-container/20 flex items-center justify-center font-bold text-base text-primary shrink-0">
          {patient.firstName?.[0]}
          {patient.lastName?.[0]}
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-on-surface text-sm">
            {patient.firstName} {patient.lastName}
          </h2>
          <p className="text-xs text-on-surface-variant">
            {patient.phone} · {patient.patientNo}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              openWindow(
                `patient-${patientId}`,
                `${patient.firstName} ${patient.lastName}`,
                "clinical_notes",
              )
            }
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-outline-variant/30 text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            👤 Hasta Kartı
          </button>
          <button
            onClick={() =>
              openWindow(
                `finance-${patientId}`,
                `Cari Hesap — ${patient.firstName} ${patient.lastName}`,
                "payments",
              )
            }
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-outline-variant/30 text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            💳 Cari
          </button>
          <button
            onClick={() =>
              openWindow("calendar", "Randevu Takvimi", "calendar_month")
            }
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-outline-variant/30 text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            📅 Randevu
          </button>
          <button
            onClick={() => setShowNewVisit(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:brightness-110 transition-all shadow-sm"
          >
            + Yeni İşlem
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="relative">
          {/* Dikey çizgi */}
          <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-outline-variant/20" />

          <div className="space-y-1">
            {events.map((ev) => {
              // ── KAYIT ──────────────────────────────────
              if (ev.kind === "registered")
                return (
                  <div
                    key="reg"
                    className="relative flex items-start gap-4 pb-4"
                  >
                    <div className="w-9 h-9 rounded-full bg-surface-container border-2 border-white shadow-sm flex items-center justify-center shrink-0 z-10">
                      <span className="text-sm">🏥</span>
                    </div>
                    <div className="flex-1 pt-1.5">
                      <div className="bg-surface-container/50 border border-outline-variant/20 rounded-xl px-4 py-2.5">
                        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider">
                          Sistem Kaydı
                        </p>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {fmtDate(ev.date)}
                        </p>
                      </div>
                    </div>
                  </div>
                );

              // ── HASTA KABUL KAYDI ──────────────────────
              if (ev.kind === "visit") {
                const vd = ev.visit.details || {};
                const vstStatus = vd.status || "open";
                const vstColors: Record<string, string> = {
                  open: "bg-blue-50 border-blue-200",
                  diagnosed: "bg-amber-50 border-amber-200",
                  treated: "bg-emerald-50 border-emerald-200",
                  planned: "bg-violet-50 border-violet-200",
                };
                const vstDots: Record<string, string> = {
                  open: "bg-blue-500",
                  diagnosed: "bg-amber-500",
                  treated: "bg-emerald-500",
                  planned: "bg-violet-500",
                };
                const vstLabels: Record<string, string> = {
                  open: "Açık",
                  diagnosed: "Teşhis Yapıldı",
                  treated: "Tedavi Edildi",
                  planned: "Plan Oluşturuldu",
                };
                return (
                  <div
                    key={ev.visit.id}
                    className="relative flex items-start gap-4 pb-3"
                  >
                    <div
                      className={`w-9 h-9 rounded-full ${vstDots[vstStatus] || "bg-blue-500"} border-2 border-white shadow-md flex items-center justify-center shrink-0 z-10`}
                    >
                      <span className="text-white text-xs">👤</span>
                    </div>
                    <div className="flex-1">
                      <button
                        onClick={() =>
                          openWindow(
                            `visit-${ev.visit.id}-${patient.id}`,
                            `${patient.firstName} ${patient.lastName} — Hasta Kabul`,
                            "clinical_notes",
                          )
                        }
                        className={`w-full text-left border rounded-xl px-4 py-3 hover:brightness-95 transition-all ${vstColors[vstStatus] || "bg-blue-50 border-blue-200"}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-bold text-on-surface">
                            Hasta Kabul
                            {vd.visitDate && (
                              <span className="ml-2 text-xs font-normal text-on-surface-variant">
                                {new Date(vd.visitDate).toLocaleDateString(
                                  "tr-TR",
                                )}
                              </span>
                            )}
                          </p>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${vstColors[vstStatus]}`}
                          >
                            {vstLabels[vstStatus]}
                          </span>
                        </div>
                        {vd.reason && (
                          <p className="text-xs text-on-surface-variant truncate">
                            📋 {vd.reason}
                          </p>
                        )}
                        {vd.diagnosisCode && (
                          <p className="text-xs text-amber-700 mt-0.5">
                            🔬 {vd.diagnosisCode}
                            {vd.diagnosis
                              ? ` — ${vd.diagnosis.slice(0, 60)}...`
                              : ""}
                          </p>
                        )}
                        <p className="text-[10px] text-on-surface-variant mt-1 flex items-center gap-1">
                          <span>›</span> Detaylar için tıklayın
                        </p>
                      </button>
                    </div>
                  </div>
                );
              }

              // ── TEDAVİ PLANI ───────────────────────────
              if (ev.kind === "plan") {
                const s = PLAN_STATUS[ev.plan.status] || PLAN_STATUS.DRAFT;
                const isOpen = expanded[ev.plan.id] !== false; // default açık
                const completedItems = ev.plan.items.filter(
                  (i) => i.status === "COMPLETED",
                ).length;
                const pct = ev.plan.items.length
                  ? Math.round((completedItems / ev.plan.items.length) * 100)
                  : 0;

                return (
                  <div
                    key={ev.plan.id}
                    className="relative flex items-start gap-4 pb-2"
                  >
                    {/* Dot */}
                    <div
                      className={`w-9 h-9 rounded-full ${s.dot} border-2 border-white shadow-md flex items-center justify-center shrink-0 z-10`}
                    >
                      <span className="text-white text-xs">📋</span>
                    </div>

                    <div className="flex-1">
                      {/* Plan başlığı */}
                      <div
                        className={`border ${s.border} ${s.bg} rounded-xl overflow-hidden`}
                      >
                        <button
                          onClick={() => toggle(ev.plan.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:brightness-95 transition-all"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-on-surface">
                                {ev.plan.title || "Tedavi Planı"}
                              </p>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg} border ${s.border}`}
                              >
                                {s.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-on-surface-variant mt-0.5">
                              {ev.plan.doctor.name} · {fmtDate(ev.date)} ·{" "}
                              {ev.plan.items.length} işlem
                            </p>
                            {/* Progress bar */}
                            {ev.plan.items.length > 0 && (
                              <div className="flex items-center gap-2 mt-1.5">
                                <div className="flex-1 h-1.5 bg-white/60 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 rounded-full transition-all"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-on-surface-variant">
                                  %{pct}
                                </span>
                              </div>
                            )}
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full bg-white/60 flex items-center justify-center text-on-surface-variant transition-transform duration-200 shrink-0 ${isOpen ? "rotate-45" : ""}`}
                          >
                            <span className="text-sm font-bold">+</span>
                          </div>
                        </button>

                        {/* Alt dallar */}
                        {isOpen && (
                          <div className="border-t border-white/40 px-4 pb-3 pt-2 space-y-1.5">
                            {/* İşlemler */}
                            {ev.plan.items.length > 0 && (
                              <div>
                                <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1.5">
                                  İşlemler
                                </p>
                                <div className="space-y-1">
                                  {ev.plan.items.map((item) => {
                                    const ist =
                                      ITEM_STATUS[item.status] ||
                                      ITEM_STATUS.PLANNED;
                                    return (
                                      <div
                                        key={item.id}
                                        className="flex items-center gap-2 pl-3 border-l-2 border-white/50"
                                      >
                                        <span
                                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${ist.color}`}
                                        >
                                          {ist.icon}
                                        </span>
                                        <span className="text-xs text-on-surface flex-1 truncate">
                                          {item.treatmentDef.name}
                                          {item.toothNumber && (
                                            <span className="text-on-surface-variant ml-1">
                                              (Diş {item.toothNumber})
                                            </span>
                                          )}
                                        </span>
                                        <span className="text-[10px] font-bold text-on-surface-variant shrink-0">
                                          {Number(
                                            item.unitPrice,
                                          ).toLocaleString("tr-TR")}{" "}
                                          ₺
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Seanslar */}
                            {ev.plan.sessions.length > 0 && (
                              <div className="mt-2">
                                <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1.5">
                                  Seanslar
                                </p>
                                <div className="space-y-1">
                                  {ev.plan.sessions.map((s) => (
                                    <div
                                      key={s.id}
                                      className="flex items-center gap-2 pl-3 border-l-2 border-white/50"
                                    >
                                      <span className="text-[10px] font-bold text-on-surface-variant w-16 shrink-0">
                                        Seans {s.sessionNo}
                                      </span>
                                      <span className="text-xs text-on-surface-variant">
                                        {fmtDate(s.date)}
                                      </span>
                                      <span
                                        className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full ${s.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : s.status === "SCHEDULED" ? "bg-blue-100 text-blue-700" : "bg-surface-container text-on-surface-variant"}`}
                                      >
                                        {s.status === "COMPLETED"
                                          ? "Tamamlandı"
                                          : s.status === "SCHEDULED"
                                            ? "Planlandı"
                                            : s.status}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Toplam */}
                            <div className="flex justify-between items-center pt-2 border-t border-white/40 mt-2">
                              <span className="text-[10px] text-on-surface-variant">
                                Toplam Tutar
                              </span>
                              <span className="text-sm font-black text-on-surface">
                                {Number(ev.plan.totalCost).toLocaleString(
                                  "tr-TR",
                                )}{" "}
                                ₺
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // ── RANDEVU ────────────────────────────────
              if (ev.kind === "appointment") {
                const as_ =
                  APPT_STATUS[ev.appt.status] || APPT_STATUS.SCHEDULED;
                const isUpcoming = ev.upcoming;

                return (
                  <div
                    key={ev.appt.id}
                    className="relative flex items-start gap-4 pb-2"
                  >
                    <div
                      className={`w-9 h-9 rounded-full border-2 border-white shadow-sm flex items-center justify-center shrink-0 z-10 ${isUpcoming ? "bg-blue-100" : "bg-surface-container"}`}
                    >
                      <span className="text-sm">{as_.icon}</span>
                    </div>
                    <div
                      className={`flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${isUpcoming ? "bg-blue-50 border-blue-200" : "bg-white border-outline-variant/15"}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-on-surface">
                            {ev.appt.type || "Randevu"}
                          </p>
                          {isUpcoming && (
                            <span className="text-[9px] font-black text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                              Yaklaşan
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-on-surface-variant">
                          {ev.appt.doctor.name} ·{" "}
                          {fmtDateTime(ev.appt.startTime)}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold shrink-0 ${as_.color}`}
                      >
                        {as_.label}
                      </span>
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      </div>

      {/* Yeni İşlem Modal */}
      {showNewVisit && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-50"
            onClick={() => setShowNewVisit(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <h3 className="font-bold text-on-surface text-base mb-4">
                Yeni İşlem Başlat
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Geliş Tarihi
                  </label>
                  <input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Geliş Nedeni / Şikayet
                  </label>
                  <textarea
                    value={visitReason}
                    onChange={(e) => setVisitReason(e.target.value)}
                    placeholder="Kısaca yazın..."
                    rows={3}
                    autoFocus
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 text-sm focus:border-primary outline-none resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowNewVisit(false)}
                  className="flex-1 py-2 rounded-xl border border-outline-variant/40 text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={saveNewVisit}
                  disabled={saving || !visitReason.trim()}
                  className="flex-1 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {saving ? "..." : "Kaydet ve Devam Et"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
