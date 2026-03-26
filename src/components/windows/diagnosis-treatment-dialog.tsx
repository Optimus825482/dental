"use client";

import { useState, useEffect, useRef } from "react";

interface TreatmentDef {
  id: string;
  code?: string;
  name: string;
  price: number;
  duration: number;
}
interface Doctor {
  id: string;
  name: string;
  color: string;
}
interface DiagnosisCode {
  id: string;
  code: string;
  description: string;
  parentCode: string | null;
}

interface PlanItem {
  id: string; // local uuid
  treatmentDefId: string;
  treatmentName: string;
  toothNumbers: number[];
  unitPrice: number;
  quantity: number;
  duration: number; // dakika
  // Takvimde yerleştirildikten sonra dolar:
  scheduledDate?: string; // YYYY-MM-DD
  scheduledHour?: number; // 8-20
  scheduledMinute?: number; // 0 veya 30
  chairNo?: number;
}

type Step =
  | "diagnosis"
  | "decision"
  | "single_session"
  | "plan_builder"
  | "plan_scheduling";

interface Props {
  patientId: string;
  patientName: string;
  selectedTeeth: number[];
  onClose: () => void;
  onSaved: () => void;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8..20
const CHAIRS = [1, 2, 3];
const CHAIR_LABELS = ["Koltuk 1", "Koltuk 2", "Koltuk 3"];

function uid() {
  return Math.random().toString(36).slice(2);
}
function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function weekStart(d: Date) {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay() + 1);
  return r;
}

export function DiagnosisTreatmentDialog({
  patientId,
  patientName,
  selectedTeeth,
  onClose,
  onSaved,
}: Props) {
  const [step, setStep] = useState<Step>("diagnosis");

  // Teşhis
  const [diagCode, setDiagCode] = useState("");
  const [diagCodeSearch, setDiagCodeSearch] = useState("");
  const [diagCodes, setDiagCodes] = useState<DiagnosisCode[]>([]);
  const [diagNote, setDiagNote] = useState("");
  const [diagDoctorId, setDiagDoctorId] = useState("");
  const [showCodeDropdown, setShowCodeDropdown] = useState(false);

  // Ortak
  const [treatments, setTreatments] = useState<TreatmentDef[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [saving, setSaving] = useState(false);

  // Tek seans
  const [singleTreatmentId, setSingleTreatmentId] = useState("");
  const [singleDoctorId, setSingleDoctorId] = useState("");
  const [singlePrice, setSinglePrice] = useState("");
  const [singleNote, setSingleNote] = useState("");

  // Tedavi planı
  const [planTitle, setPlanTitle] = useState("");
  const [planDoctorId, setPlanDoctorId] = useState("");
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [addingItem, setAddingItem] = useState(false);
  const [newItem, setNewItem] = useState<
    Partial<PlanItem & { treatmentName?: string }>
  >({
    toothNumbers: selectedTeeth,
    quantity: 1,
  });

  // Takvim planlama
  const [calWeek, setCalWeek] = useState(() => weekStart(new Date()));
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [calAppointments, setCalAppointments] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/treatments").then((r) => r.json()),
      fetch("/api/doctors").then((r) => r.json()),
      fetch("/api/diagnosis-codes").then((r) => r.json()),
    ]).then(([t, d, dc]) => {
      setTreatments(t.treatments || []);
      setDoctors(d.doctors || []);
      setDiagCodes(dc.codes || []);
      if (d.doctors?.length) {
        setDiagDoctorId(d.doctors[0].id);
        setSingleDoctorId(d.doctors[0].id);
        setPlanDoctorId(d.doctors[0].id);
      }
    });
  }, []);

  // Takvim adımına geçince o haftanın randevularını çek
  useEffect(() => {
    if (step !== "plan_scheduling") return;
    const from = fmtDate(calWeek);
    const to = fmtDate(addDays(calWeek, 6));
    fetch(`/api/appointments?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((d) => setCalAppointments(d.appointments || []));
  }, [step, calWeek]);

  const filteredCodes = diagCodes
    .filter(
      (c) =>
        c.code.toLowerCase().includes(diagCodeSearch.toLowerCase()) ||
        c.description.toLowerCase().includes(diagCodeSearch.toLowerCase()),
    )
    .slice(0, 8);

  function selectCode(c: DiagnosisCode) {
    setDiagCode(c.code);
    setDiagCodeSearch(`${c.code} — ${c.description}`);
    setShowCodeDropdown(false);
  }

  function goToDecision() {
    setSingleDoctorId(diagDoctorId);
    setPlanDoctorId(diagDoctorId);
    setStep("decision");
  }

  function addPlanItem() {
    if (!newItem.treatmentDefId) return;
    const t = treatments.find((t) => t.id === newItem.treatmentDefId);
    setPlanItems((prev) => [
      ...prev,
      {
        id: uid(),
        treatmentDefId: newItem.treatmentDefId!,
        treatmentName: t?.name || "",
        toothNumbers: newItem.toothNumbers || [],
        unitPrice: newItem.unitPrice ?? t?.price ?? 0,
        quantity: newItem.quantity || 1,
        duration: t?.duration || 30,
      },
    ]);
    setNewItem({ toothNumbers: [], quantity: 1 });
    setAddingItem(false);
  }

  // Sürükle-bırak: slot'a bırakıldığında item'ı güncelle
  function handleDropOnSlot(
    date: string,
    hour: number,
    minute: number,
    chair: number,
  ) {
    if (!draggingId) return;
    setPlanItems((prev) =>
      prev.map((item) =>
        item.id === draggingId
          ? {
              ...item,
              scheduledDate: date,
              scheduledHour: hour,
              scheduledMinute: minute,
              chairNo: chair,
            }
          : item,
      ),
    );
    setDraggingId(null);
  }

  const unscheduled = planItems.filter((i) => !i.scheduledDate);
  const scheduled = planItems.filter((i) => i.scheduledDate);
  const allScheduled = planItems.length > 0 && unscheduled.length === 0;

  async function saveSingleSession() {
    if (!singleTreatmentId) return;
    setSaving(true);
    const treatment = treatments.find((t) => t.id === singleTreatmentId);
    const price = parseFloat(singlePrice) || treatment?.price || 0;
    if (selectedTeeth.length > 0) {
      await Promise.all(
        selectedTeeth.map((tooth) =>
          fetch("/api/dental-chart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              patientId,
              toothNumber: tooth,
              condition: "FILLED",
              notes: diagNote,
            }),
          }),
        ),
      );
    }
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId,
        type: "CHARGE",
        amount: price,
        description: `${treatment?.name || "Tedavi"}${selectedTeeth.length ? ` — Diş: ${selectedTeeth.join(", ")}` : ""}${diagCode ? ` (${diagCode})` : ""}`,
      }),
    });
    setSaving(false);
    onSaved();
  }

  async function savePlanWithSchedule() {
    if (!planDoctorId || !allScheduled) return;
    setSaving(true);
    const res = await fetch("/api/treatment-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId,
        doctorId: planDoctorId,
        title: planTitle || "Tedavi Planı",
        notes: diagNote,
        items: planItems.map((item) => ({
          treatmentDefId: item.treatmentDefId,
          toothNumber: item.toothNumbers[0] || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: 0,
        })),
      }),
    });
    if (res.ok) {
      const plan = await res.json();
      await Promise.all(
        scheduled.map((item) => {
          const start = new Date(
            `${item.scheduledDate}T${String(item.scheduledHour).padStart(2, "0")}:${String(item.scheduledMinute || 0).padStart(2, "0")}:00`,
          );
          const end = new Date(start.getTime() + item.duration * 60000);
          return fetch("/api/appointments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              patientId,
              doctorId: planDoctorId,
              chairNo: item.chairNo || 1,
              startTime: start.toISOString(),
              endTime: end.toISOString(),
              type: item.treatmentName,
              notes: `Tedavi Planı: ${plan.title}`,
            }),
          });
        }),
      );
    }
    setSaving(false);
    onSaved();
  }

  const totalPlanCost = planItems.reduce(
    (s, i) => s + i.unitPrice * i.quantity,
    0,
  );
  const canProceed = diagCode.trim() !== "" || diagNote.trim() !== "";

  const DoctorSelect = ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 text-sm focus:border-primary outline-none"
    >
      {doctors.map((d) => (
        <option key={d.id} value={d.id}>
          {d.name}
        </option>
      ))}
    </select>
  );

  // Takvim adımı tam ekran modal olacak
  if (step === "plan_scheduling") {
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(calWeek, i));
    return (
      <div
        className="fixed inset-0 z-[700] flex flex-col bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/15 bg-gradient-to-r from-surface-container-high to-surface-container shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep("plan_builder")}
              className="p-1.5 hover:bg-surface-container rounded-lg"
            >
              <span className="material-symbols-outlined text-on-surface-variant">
                arrow_back
              </span>
            </button>
            <span className="material-symbols-outlined text-primary">
              event_available
            </span>
            <div>
              <h3 className="font-headline font-bold text-on-surface text-[15px]">
                Randevu Takviminde Planla
              </h3>
              <p className="text-xs text-on-surface-variant">
                {patientName} · İşlemleri sürükleyip takvime bırakın
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2 py-1 rounded-full ${allScheduled ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
            >
              {scheduled.length}/{planItems.length} yerleştirildi
            </span>
            <button
              onClick={savePlanWithSchedule}
              disabled={saving || !allScheduled}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold hover:brightness-110 transition-all disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              {saving ? "Kaydediliyor..." : "Planı Kaydet"}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-surface-container rounded-lg"
            >
              <span className="material-symbols-outlined text-on-surface-variant">
                close
              </span>
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sol: Bekleyen işlemler */}
          <div className="w-56 border-r border-outline-variant/15 flex flex-col shrink-0 bg-surface-container-low/30">
            <div className="px-3 py-2.5 border-b border-outline-variant/10">
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                Bekleyen İşlemler
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {unscheduled.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 text-emerald-600 gap-1">
                  <span className="material-symbols-outlined text-2xl">
                    check_circle
                  </span>
                  <p className="text-xs font-bold">Tümü yerleştirildi</p>
                </div>
              ) : (
                unscheduled.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDraggingId(item.id)}
                    onDragEnd={() => setDraggingId(null)}
                    className={`p-2.5 rounded-xl border-2 cursor-grab active:cursor-grabbing select-none transition-all ${draggingId === item.id ? "border-primary bg-primary-container/20 opacity-60" : "border-outline-variant/30 bg-white hover:border-primary/40 hover:shadow-sm"}`}
                  >
                    <p className="text-xs font-bold text-on-surface truncate">
                      {item.treatmentName}
                    </p>
                    {item.toothNumbers.length > 0 && (
                      <p className="text-[10px] text-on-surface-variant">
                        Diş: {item.toothNumbers.join(", ")}
                      </p>
                    )}
                    <p className="text-[10px] text-primary font-semibold mt-0.5">
                      {item.duration} dk ·{" "}
                      {item.unitPrice.toLocaleString("tr-TR")} ₺
                    </p>
                  </div>
                ))
              )}
              {/* Yerleştirilenler */}
              {scheduled.length > 0 && (
                <>
                  <div className="pt-2 pb-1">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                      Yerleştirilenler
                    </p>
                  </div>
                  {scheduled.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => setDraggingId(item.id)}
                      onDragEnd={() => setDraggingId(null)}
                      className="p-2.5 rounded-xl border-2 border-emerald-200 bg-emerald-50 cursor-grab active:cursor-grabbing select-none"
                    >
                      <p className="text-xs font-bold text-emerald-800 truncate">
                        {item.treatmentName}
                      </p>
                      <p className="text-[10px] text-emerald-600">
                        {new Date(item.scheduledDate!).toLocaleDateString(
                          "tr-TR",
                          { day: "numeric", month: "short" },
                        )}{" "}
                        {String(item.scheduledHour).padStart(2, "0")}:
                        {String(item.scheduledMinute || 0).padStart(2, "0")}
                        {" · "}
                        {CHAIR_LABELS[(item.chairNo || 1) - 1]}
                      </p>
                      <button
                        onClick={() =>
                          setPlanItems((prev) =>
                            prev.map((p) =>
                              p.id === item.id
                                ? {
                                    ...p,
                                    scheduledDate: undefined,
                                    scheduledHour: undefined,
                                    scheduledMinute: undefined,
                                    chairNo: undefined,
                                  }
                                : p,
                            ),
                          )
                        }
                        className="text-[10px] text-error hover:underline mt-0.5"
                      >
                        Kaldır
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Sağ: Haftalık takvim */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Hafta navigasyon */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-outline-variant/10 shrink-0 bg-white">
              <button
                onClick={() => setCalWeek((w) => addDays(w, -7))}
                className="p-1 hover:bg-surface-container rounded-lg"
              >
                <span className="material-symbols-outlined text-sm">
                  chevron_left
                </span>
              </button>
              <span className="text-sm font-bold text-on-surface">
                {calWeek.toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                })}{" "}
                —{" "}
                {addDays(calWeek, 6).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <button
                onClick={() => setCalWeek((w) => addDays(w, 7))}
                className="p-1 hover:bg-surface-container rounded-lg"
              >
                <span className="material-symbols-outlined text-sm">
                  chevron_right
                </span>
              </button>
              <button
                onClick={() => setCalWeek(weekStart(new Date()))}
                className="ml-2 px-2 py-1 text-xs font-bold text-primary bg-primary/10 rounded-lg hover:bg-primary/20"
              >
                Bugün
              </button>
            </div>

            {/* Takvim grid */}
            <div className="flex-1 overflow-auto">
              <div className="min-w-[700px]">
                {/* Gün başlıkları */}
                <div className="flex sticky top-0 z-10 bg-white border-b border-outline-variant/15">
                  <div className="w-12 shrink-0" />
                  {weekDays.map((day, di) => {
                    const isToday = fmtDate(day) === fmtDate(new Date());
                    return (
                      <div
                        key={di}
                        className="flex-1 text-center py-2 border-r border-outline-variant/10 last:border-0"
                      >
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase">
                          {day.toLocaleDateString("tr-TR", {
                            weekday: "short",
                          })}
                        </p>
                        <p
                          className={`text-sm font-black ${isToday ? "text-primary" : "text-on-surface"}`}
                        >
                          {day.getDate()}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Saat satırları */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="flex border-b border-outline-variant/8"
                  >
                    <div className="w-12 shrink-0 flex items-start justify-center pt-1 text-[10px] font-bold text-on-surface-variant/60">
                      {String(hour).padStart(2, "0")}:00
                    </div>
                    {weekDays.map((day, di) => {
                      const dateStr = fmtDate(day);
                      // Mevcut randevular bu slot'ta mı?
                      const existing = calAppointments.filter((a) => {
                        const s = new Date(a.startTime);
                        return fmtDate(s) === dateStr && s.getHours() === hour;
                      });
                      // Planlanmış item bu slot'ta mı?
                      const placed = scheduled.filter(
                        (i) =>
                          i.scheduledDate === dateStr &&
                          i.scheduledHour === hour,
                      );

                      return (
                        <div
                          key={di}
                          className="flex-1 border-r border-outline-variant/8 last:border-0 relative"
                          style={{ height: 60 }}
                        >
                          {/* :00 ve :30 drop zone'ları */}
                          {[0, 30].map((min) => (
                            <div
                              key={min}
                              className="absolute left-0 right-0 h-[30px] hover:bg-primary/5 transition-colors"
                              style={{ top: min === 0 ? 0 : 30 }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.add("bg-primary/10");
                              }}
                              onDragLeave={(e) =>
                                e.currentTarget.classList.remove(
                                  "bg-primary/10",
                                )
                              }
                              onDrop={(e) => {
                                e.currentTarget.classList.remove(
                                  "bg-primary/10",
                                );
                                handleDropOnSlot(dateStr, hour, min, 1);
                              }}
                            >
                              {min === 0 && (
                                <div className="absolute left-0 right-0 top-[30px] h-px bg-outline-variant/10" />
                              )}
                            </div>
                          ))}
                          {/* Mevcut randevular */}
                          {existing.map((a) => (
                            <div
                              key={a.id}
                              className="absolute left-0.5 right-0.5 top-0.5 bg-primary-container/30 border border-primary/20 rounded text-[9px] font-bold text-primary px-1 py-0.5 truncate z-10 pointer-events-none"
                            >
                              {a.patient?.firstName} {a.patient?.lastName}
                            </div>
                          ))}
                          {/* Yerleştirilen plan işlemleri */}
                          {placed.map((item) => (
                            <div
                              key={item.id}
                              draggable
                              onDragStart={() => setDraggingId(item.id)}
                              onDragEnd={() => setDraggingId(null)}
                              className="absolute left-0.5 right-0.5 top-0.5 bg-emerald-100 border border-emerald-400 rounded text-[9px] font-bold text-emerald-800 px-1 py-0.5 truncate z-20 cursor-grab"
                            >
                              {item.treatmentName}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal modal (diagnosis / decision / single_session / plan_builder)
  return (
    <div
      className="fixed inset-0 z-[700] flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[560px] max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline-variant/15 bg-gradient-to-r from-surface-container-high to-surface-container shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              medical_information
            </span>
            <h3 className="font-headline font-bold text-on-surface text-[15px]">
              {step === "diagnosis" && "Teşhis Girişi"}
              {step === "decision" && "Tedavi Kararı"}
              {step === "single_session" && "Tek Seans Tedavi"}
              {step === "plan_builder" && "Tedavi Planı — İşlemler"}
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            {["diagnosis", "decision", "plan_builder"].map((s, i) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-colors ${step === s ? "bg-primary" : i < ["diagnosis", "decision", "single_session", "plan_builder"].indexOf(step) ? "bg-primary/40" : "bg-outline-variant/30"}`}
              />
            ))}
            <button
              onClick={onClose}
              className="ml-2 p-1 hover:bg-surface-container rounded-lg"
            >
              <span className="material-symbols-outlined text-on-surface-variant text-lg">
                close
              </span>
            </button>
          </div>
        </div>

        {/* Seçili dişler */}
        {selectedTeeth.length > 0 && (
          <div className="px-5 pt-3 pb-0 flex items-center gap-2 shrink-0">
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Seçili Dişler:
            </p>
            <div className="flex gap-1 flex-wrap">
              {selectedTeeth.map((n) => (
                <span
                  key={n}
                  className="w-8 h-8 bg-primary-container/15 rounded-lg flex items-center justify-center font-bold text-primary border border-primary/15 text-sm"
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* ── TEŞHİS ── */}
          {step === "diagnosis" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                  Teşhisi Koyan Hekim
                </label>
                <select
                  value={diagDoctorId}
                  onChange={(e) => {
                    setDiagDoctorId(e.target.value);
                    setSingleDoctorId(e.target.value);
                    setPlanDoctorId(e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 text-sm focus:border-primary outline-none"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                  ICD-10 Tanı Kodu{" "}
                  <span className="text-outline normal-case font-normal">
                    (opsiyonel)
                  </span>
                </label>
                <div className="relative">
                  <input
                    value={diagCodeSearch}
                    onChange={(e) => {
                      setDiagCodeSearch(e.target.value);
                      setShowCodeDropdown(true);
                      setDiagCode("");
                    }}
                    onFocus={() => setShowCodeDropdown(true)}
                    placeholder="Kod veya açıklama ara... (ör: K02.1)"
                    className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/40 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                  {showCodeDropdown &&
                    diagCodeSearch.length >= 1 &&
                    filteredCodes.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-outline-variant/20 rounded-xl shadow-lg z-10 overflow-hidden max-h-48 overflow-y-auto">
                        {filteredCodes.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => selectCode(c)}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-surface-container-low transition-colors text-left"
                          >
                            <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                              {c.code}
                            </span>
                            <span className="text-sm text-on-surface truncate">
                              {c.description}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                </div>
                {diagCode && (
                  <p className="text-xs text-primary font-semibold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">
                      check_circle
                    </span>
                    Seçildi: {diagCode}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                  Teşhis Notu{" "}
                  <span className="text-outline normal-case font-normal">
                    (opsiyonel)
                  </span>
                </label>
                <textarea
                  value={diagNote}
                  onChange={(e) => setDiagNote(e.target.value)}
                  rows={3}
                  placeholder="Klinik bulgular, hastanın şikayeti..."
                  className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/40 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                />
              </div>
            </div>
          )}

          {/* ── KARAR ── */}
          {step === "decision" && (
            <div className="space-y-3">
              <p className="text-sm text-on-surface-variant mb-4">
                Teşhis kaydedildi. Tedavi türünü seçin:
              </p>
              <button
                onClick={() => setStep("single_session")}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-emerald-600 text-2xl">
                    bolt
                  </span>
                </div>
                <div>
                  <p className="font-bold text-on-surface">Tek Seans Tedavi</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Tedavi bugün tamamlandı. İşlem cari hesaba işlenir.
                  </p>
                </div>
              </button>
              <button
                onClick={() => setStep("plan_builder")}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-primary/20 bg-primary-container/5 hover:bg-primary-container/10 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-container/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-2xl">
                    assignment
                  </span>
                </div>
                <div>
                  <p className="font-bold text-on-surface">
                    Tedavi Planı Oluştur
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Birden fazla seans. İşlemleri ekle, takvimde randevulara
                    yerleştir.
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* ── TEK SEANS ── */}
          {step === "single_session" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                  Hekim
                </label>
                <select
                  value={singleDoctorId}
                  onChange={(e) => setSingleDoctorId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 text-sm focus:border-primary outline-none"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                  Yapılan İşlem
                </label>
                <select
                  value={singleTreatmentId}
                  onChange={(e) => {
                    setSingleTreatmentId(e.target.value);
                    const t = treatments.find((t) => t.id === e.target.value);
                    if (t) setSinglePrice(String(t.price));
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/40 text-sm focus:border-primary outline-none"
                >
                  <option value="">İşlem seçin...</option>
                  {treatments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.code ? ` (${t.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                  Ücret (₺)
                </label>
                <input
                  type="number"
                  value={singlePrice}
                  onChange={(e) => setSinglePrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/40 text-sm focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                  Not (opsiyonel)
                </label>
                <input
                  value={singleNote}
                  onChange={(e) => setSingleNote(e.target.value)}
                  placeholder="Ek not..."
                  className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/40 text-sm focus:border-primary outline-none"
                />
              </div>
              {singleTreatmentId && singlePrice && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-emerald-800">
                    Cari hesaba işlenecek:
                  </span>
                  <span className="text-lg font-black text-emerald-700">
                    {parseFloat(singlePrice).toLocaleString("tr-TR")} ₺
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── PLAN BUILDER ── */}
          {step === "plan_builder" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                    Plan Başlığı
                  </label>
                  <input
                    value={planTitle}
                    onChange={(e) => setPlanTitle(e.target.value)}
                    placeholder="ör: Kanal + Kaplama"
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                    Hekim
                  </label>
                  <select
                    value={planDoctorId}
                    onChange={(e) => setPlanDoctorId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 text-sm focus:border-primary outline-none"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Yapılacak İşlemler
                  </label>
                  <button
                    onClick={() => setAddingItem(true)}
                    className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    <span className="material-symbols-outlined text-sm">
                      add
                    </span>
                    İşlem Ekle
                  </button>
                </div>
                {planItems.length === 0 && !addingItem && (
                  <div className="text-center py-6 border-2 border-dashed border-outline-variant/30 rounded-xl text-on-surface-variant/50">
                    <span className="material-symbols-outlined text-2xl">
                      add_circle
                    </span>
                    <p className="text-xs mt-1">Henüz işlem eklenmedi</p>
                  </div>
                )}
                <div className="space-y-2">
                  {planItems.map((item, i) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/20"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">
                          {item.treatmentName}
                        </p>
                        <p className="text-[11px] text-on-surface-variant">
                          {item.toothNumbers.length > 0
                            ? `Diş: ${item.toothNumbers.join(", ")} · `
                            : ""}
                          {item.duration} dk ·{" "}
                          {item.unitPrice.toLocaleString("tr-TR")} ₺
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setPlanItems((prev) => prev.filter((_, j) => j !== i))
                        }
                        className="p-1 hover:bg-error/10 rounded-lg text-outline hover:text-error transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">
                          delete
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
                {addingItem && (
                  <div className="mt-2 p-3 bg-primary-container/5 border border-primary/15 rounded-xl space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newItem.treatmentDefId || ""}
                        onChange={(e) => {
                          const t = treatments.find(
                            (t) => t.id === e.target.value,
                          );
                          setNewItem({
                            ...newItem,
                            treatmentDefId: e.target.value,
                            unitPrice: t?.price,
                            treatmentName: t?.name,
                          });
                        }}
                        className="px-2 py-1.5 rounded-lg border border-outline-variant/40 text-sm outline-none col-span-2"
                      >
                        <option value="">İşlem seçin...</option>
                        {treatments.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={newItem.unitPrice || ""}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            unitPrice: parseFloat(e.target.value),
                          })
                        }
                        placeholder="Ücret (₺)"
                        className="px-2 py-1.5 rounded-lg border border-outline-variant/40 text-sm outline-none"
                      />
                      <input
                        type="number"
                        value={newItem.quantity || 1}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            quantity: parseInt(e.target.value),
                          })
                        }
                        placeholder="Adet"
                        min={1}
                        className="px-2 py-1.5 rounded-lg border border-outline-variant/40 text-sm outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={addPlanItem}
                        disabled={!newItem.treatmentDefId}
                        className="flex-1 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold disabled:opacity-50"
                      >
                        Ekle
                      </button>
                      <button
                        onClick={() => setAddingItem(false)}
                        className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs"
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {planItems.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-primary-container/10 rounded-xl border border-primary/15">
                  <span className="text-sm font-semibold text-on-surface">
                    {planItems.length} işlem
                  </span>
                  <span className="text-base font-black text-primary">
                    {totalPlanCost.toLocaleString("tr-TR")} ₺
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-outline-variant/10 flex justify-between items-center shrink-0">
          <button
            onClick={
              step === "diagnosis"
                ? onClose
                : () => setStep(step === "decision" ? "diagnosis" : "decision")
            }
            className="px-4 py-2 rounded-xl border border-outline-variant/30 text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            {step === "diagnosis" ? "İptal" : "Geri"}
          </button>

          {step === "diagnosis" && (
            <button
              onClick={goToDecision}
              disabled={!canProceed || !diagDoctorId}
              className="px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              Teşhisi Kaydet{" "}
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
            </button>
          )}

          {step === "single_session" && (
            <button
              onClick={saveSingleSession}
              disabled={saving || !singleTreatmentId}
              className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              {saving ? "Kaydediliyor..." : "Kaydet ve Cari Hesaba İşle"}
            </button>
          )}

          {step === "plan_builder" && (
            <button
              onClick={() => setStep("plan_scheduling")}
              disabled={planItems.length === 0}
              className="px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">
                calendar_month
              </span>
              Takvimde Randevu Planla →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
