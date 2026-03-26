"use client";
import { useState, useEffect, useCallback, useRef } from "react";

interface Doctor {
  id: string;
  name: string;
  color: string;
}
interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  chairNo: number;
  type: string | null;
  status: string;
  notes: string | null;
  patient: { id: string; firstName: string; lastName: string; phone: string };
  doctor: { id: string; name: string; color: string };
}
interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  patientNo: string;
  phone: string;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8..20
const CHAIRS = ["Koltuk 1", "Koltuk 2", "Koltuk 3"];
const SLOT_H = 60; // px per hour

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-50 border-l-4 border-blue-400 text-blue-900",
  CONFIRMED: "bg-violet-50 border-l-4 border-violet-400 text-violet-900",
  IN_PROGRESS:
    "bg-primary-container/20 border-l-4 border-primary text-on-primary-container",
  COMPLETED: "bg-emerald-50 border-l-4 border-emerald-500 text-emerald-900",
  CANCELLED:
    "bg-surface-container border-l-4 border-outline text-on-surface-variant line-through opacity-60",
  NO_SHOW: "bg-amber-50 border-l-4 border-amber-400 text-amber-900 opacity-70",
};

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
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7));
  return r;
}

export function CalendarContent() {
  const [view, setView] = useState<"day" | "week">("day");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Yeni randevu formu
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    patientSearch: "",
    patientId: "",
    doctorId: "",
    chairNo: 1,
    date: fmtDate(new Date()),
    startHour: "09",
    startMin: "00",
    duration: 30,
    type: "Muayene",
    notes: "",
  });
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [searchingPat, setSearchingPat] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sürükle-bırak
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffset = useRef(0); // px from top of appointment

  // Sağ tık menüsü
  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
    appt: Appointment;
  } | null>(null);

  const fetchDoctors = useCallback(async () => {
    const res = await fetch("/api/doctors");
    if (res.ok) {
      const d = await res.json();
      setDoctors(d.doctors || []);
    }
  }, []);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    let url: string;
    if (view === "week") {
      const ws = weekStart(currentDate);
      const we = addDays(ws, 6);
      url = `/api/appointments?from=${fmtDate(ws)}&to=${fmtDate(we)}`;
    } else {
      url = `/api/appointments?date=${fmtDate(currentDate)}`;
    }
    if (selectedDoctor) url += `&doctorId=${selectedDoctor}`;
    const res = await fetch(url);
    if (res.ok) {
      const d = await res.json();
      setAppointments(d.appointments || []);
    }
    setLoading(false);
  }, [currentDate, selectedDoctor, view]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Hasta arama
  useEffect(() => {
    if (formData.patientSearch.length < 2) {
      setPatientResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearchingPat(true);
      const res = await fetch(
        `/api/patients?search=${encodeURIComponent(formData.patientSearch)}&limit=5`,
      );
      if (res.ok) {
        const d = await res.json();
        setPatientResults(d.patients || []);
      }
      setSearchingPat(false);
    }, 300);
    return () => clearTimeout(t);
  }, [formData.patientSearch]);

  function getPos(apt: Appointment) {
    const s = new Date(apt.startTime);
    const e = new Date(apt.endTime);
    const top = (s.getHours() + s.getMinutes() / 60 - 8) * SLOT_H + 2;
    const height = Math.max(
      28,
      ((e.getTime() - s.getTime()) / 3600000) * SLOT_H - 4,
    );
    return { top, height };
  }

  // Drag: randevuyu yeni saate taşı
  async function handleDrop(
    e: React.DragEvent,
    chairIdx: number,
    hourFloat: number,
  ) {
    e.preventDefault();
    if (!draggingId) return;
    const apt = appointments.find((a) => a.id === draggingId);
    if (!apt) return;
    const duration =
      (new Date(apt.endTime).getTime() - new Date(apt.startTime).getTime()) /
      60000;
    const newHour = Math.floor(hourFloat);
    const newMin = hourFloat % 1 >= 0.5 ? 30 : 0;
    const base = new Date(apt.startTime);
    base.setHours(newHour, newMin, 0, 0);
    const newEnd = new Date(base.getTime() + duration * 60000);

    // Optimistic update
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === draggingId
          ? {
              ...a,
              chairNo: chairIdx + 1,
              startTime: base.toISOString(),
              endTime: newEnd.toISOString(),
            }
          : a,
      ),
    );
    setDraggingId(null);

    // API güncelle
    await fetch(`/api/appointments/${draggingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chairNo: chairIdx + 1,
        startTime: base.toISOString(),
        endTime: newEnd.toISOString(),
      }),
    });
  }

  async function handleStatusChange(apptId: string, status: string) {
    setCtxMenu(null);
    setAppointments((prev) =>
      prev.map((a) => (a.id === apptId ? { ...a, status } : a)),
    );
    await fetch(`/api/appointments/${apptId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function handleDelete(apptId: string) {
    setCtxMenu(null);
    if (!confirm("Bu randevuyu iptal etmek istediğinize emin misiniz?")) return;
    setAppointments((prev) =>
      prev.map((a) => (a.id === apptId ? { ...a, status: "CANCELLED" } : a)),
    );
    await fetch(`/api/appointments/${apptId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
  }

  async function handleNewAppointment(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.patientId || !formData.doctorId) return;
    setSaving(true);
    const start = new Date(
      `${formData.date}T${formData.startHour}:${formData.startMin}:00`,
    );
    const end = new Date(start.getTime() + formData.duration * 60000);
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: formData.patientId,
        doctorId: formData.doctorId,
        chairNo: formData.chairNo,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        type: formData.type,
        notes: formData.notes,
      }),
    });
    if (res.ok) {
      setShowForm(false);
      fetchAppointments();
    }
    setSaving(false);
  }

  const nav = (n: number) =>
    setCurrentDate((d) =>
      view === "week" ? addDays(d, n * 7) : addDays(d, n),
    );
  const dateLabel =
    view === "week"
      ? `${weekStart(currentDate).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} — ${addDays(weekStart(currentDate), 6).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}`
      : currentDate.toLocaleDateString("tr-TR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });

  const dayColumns =
    view === "week"
      ? Array.from({ length: 7 }, (_, i) => addDays(weekStart(currentDate), i))
      : [currentDate];

  return (
    <div className="flex h-full" onClick={() => setCtxMenu(null)}>
      {/* Sidebar */}
      <div className="w-52 border-r border-outline-variant/10 p-4 bg-surface-container-low/30 shrink-0 flex flex-col gap-3">
        <div className="flex bg-surface-container rounded-lg p-0.5 gap-0.5">
          {(["day", "week"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${view === v ? "bg-white shadow-sm text-primary" : "text-on-surface-variant"}`}
            >
              {v === "day" ? "Gün" : "Hafta"}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={() => nav(-1)}
            className="p-1 hover:bg-white rounded-lg"
          >
            <span className="material-symbols-outlined text-sm">
              chevron_left
            </span>
          </button>
          <p className="text-[11px] font-bold text-on-surface text-center leading-tight">
            {dateLabel}
          </p>
          <button
            onClick={() => nav(1)}
            className="p-1 hover:bg-white rounded-lg"
          >
            <span className="material-symbols-outlined text-sm">
              chevron_right
            </span>
          </button>
        </div>
        <button
          onClick={() => setCurrentDate(new Date())}
          className="w-full py-1.5 text-xs font-bold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          Bugün
        </button>

        <div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
            Hekimler
          </p>
          {doctors.map((d) => (
            <div
              key={d.id}
              onClick={() =>
                setSelectedDoctor(selectedDoctor === d.id ? null : d.id)
              }
              className={`flex items-center gap-2 p-2 rounded-xl text-sm cursor-pointer mb-1 transition-all ${selectedDoctor === d.id || !selectedDoctor ? "bg-white shadow-sm border border-outline-variant/10" : "opacity-40 hover:opacity-70"}`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <span className="font-medium text-on-surface text-xs truncate">
                {d.name}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-auto">
          <button
            onClick={() => {
              setShowForm(true);
              setFormData((f) => ({
                ...f,
                date: fmtDate(currentDate),
                doctorId: doctors[0]?.id || "",
              }));
            }}
            className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>Yeni
            Randevu
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto relative">
        {/* Üst bar: Yeni Randevu + Koltuk başlıkları */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-outline-variant/15">
          {/* Yeni Randevu butonu */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-outline-variant/10">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              {view === "day"
                ? currentDate.toLocaleDateString("tr-TR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })
                : dateLabel}
            </span>
            <button
              onClick={() => {
                setShowForm(true);
                setFormData((f) => ({
                  ...f,
                  date: fmtDate(currentDate),
                  doctorId: doctors[0]?.id || "",
                }));
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:brightness-110 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Yeni Randevu
            </button>
          </div>
          <div className="flex ml-16">
            {view === "week"
              ? dayColumns.map((day, di) => {
                  const isToday = fmtDate(day) === fmtDate(new Date());
                  return (
                    <div
                      key={di}
                      className="flex-1 py-2 text-center border-r border-outline-variant/10 last:border-0"
                    >
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase">
                        {day.toLocaleDateString("tr-TR", { weekday: "short" })}
                      </p>
                      <p
                        className={`text-sm font-black ${isToday ? "text-primary" : "text-on-surface"}`}
                      >
                        {day.getDate()}
                      </p>
                    </div>
                  );
                })
              : CHAIRS.map((c) => (
                  <div
                    key={c}
                    className="flex-1 py-3 text-center font-headline font-bold text-sm text-primary uppercase tracking-tight border-r border-outline-variant/10 last:border-0"
                  >
                    {c}
                  </div>
                ))}
          </div>
        </div>

        <div className="flex" style={{ minHeight: SLOT_H * 13 }}>
          {/* Saat sütunu */}
          <div className="w-16 shrink-0 border-r border-outline-variant/10">
            {HOURS.map((h) => (
              <div
                key={h}
                className="flex items-start justify-center pt-1 text-[11px] font-bold text-on-surface-variant"
                style={{ height: SLOT_H }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Kolon(lar) */}
          <div className="flex-1 flex">
            {view === "day"
              ? // Gün görünümü: 3 koltuk
                CHAIRS.map((_, ci) => (
                  <ChairColumn
                    key={ci}
                    chairIdx={ci}
                    hours={HOURS}
                    slotH={SLOT_H}
                    appointments={appointments.filter(
                      (a) => a.chairNo === ci + 1,
                    )}
                    draggingId={draggingId}
                    onDragStart={(id, offset) => {
                      setDraggingId(id);
                      dragOffset.current = offset;
                    }}
                    onDrop={(e, hourFloat) => handleDrop(e, ci, hourFloat)}
                    onContextMenu={(e, appt) => {
                      e.preventDefault();
                      setCtxMenu({ x: e.clientX, y: e.clientY, appt });
                    }}
                  />
                ))
              : // Hafta görünümü: 7 gün, tek koltuk
                dayColumns.map((day, di) => {
                  const dayStr = fmtDate(day);
                  const dayAppts = appointments.filter(
                    (a) => fmtDate(new Date(a.startTime)) === dayStr,
                  );
                  return (
                    <ChairColumn
                      key={di}
                      chairIdx={0}
                      hours={HOURS}
                      slotH={SLOT_H}
                      appointments={dayAppts}
                      draggingId={draggingId}
                      onDragStart={(id, offset) => {
                        setDraggingId(id);
                        dragOffset.current = offset;
                      }}
                      onDrop={(e, hourFloat) => handleDrop(e, 0, hourFloat)}
                      onContextMenu={(e, appt) => {
                        e.preventDefault();
                        setCtxMenu({ x: e.clientX, y: e.clientY, appt });
                      }}
                    />
                  );
                })}
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-30">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* Sağ tık menüsü */}
      {ctxMenu && (
        <>
          <div
            className="fixed inset-0 z-[800]"
            onClick={() => setCtxMenu(null)}
          />
          <div
            className="fixed z-[810] w-52 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.15)] border border-outline-variant/20 py-1.5 overflow-hidden"
            style={{ left: ctxMenu.x, top: ctxMenu.y }}
          >
            <div className="px-4 py-2 border-b border-outline-variant/10">
              <p className="text-xs font-bold text-on-surface truncate">
                {ctxMenu.appt.patient.firstName} {ctxMenu.appt.patient.lastName}
              </p>
              <p className="text-[10px] text-on-surface-variant">
                {new Date(ctxMenu.appt.startTime).toLocaleTimeString("tr-TR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            {[
              {
                status: "CONFIRMED",
                label: "Onayla",
                icon: "verified",
                color: "text-violet-600",
              },
              {
                status: "IN_PROGRESS",
                label: "Başladı",
                icon: "play_circle",
                color: "text-primary",
              },
              {
                status: "COMPLETED",
                label: "Tamamlandı",
                icon: "check_circle",
                color: "text-emerald-600",
              },
              {
                status: "NO_SHOW",
                label: "Gelmedi",
                icon: "person_off",
                color: "text-amber-600",
              },
            ].map((item) => (
              <button
                key={item.status}
                onClick={() => handleStatusChange(ctxMenu.appt.id, item.status)}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low transition-colors text-left"
              >
                <span
                  className={`material-symbols-outlined text-lg ${item.color}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {item.icon}
                </span>
                <span className="text-sm font-semibold text-on-surface">
                  {item.label}
                </span>
              </button>
            ))}
            <div className="h-px bg-outline-variant/15 mx-3 my-1" />
            <button
              onClick={() => handleDelete(ctxMenu.appt.id)}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-error/5 transition-colors text-left"
            >
              <span className="material-symbols-outlined text-lg text-error">
                cancel
              </span>
              <span className="text-sm font-semibold text-error">İptal Et</span>
            </button>
          </div>
        </>
      )}

      {/* Yeni Randevu Formu */}
      {showForm && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-[700]"
            onClick={() => setShowForm(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[710] p-4">
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-headline font-bold text-on-surface text-base">
                  Yeni Randevu
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1 hover:bg-surface-container rounded-lg"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">
                    close
                  </span>
                </button>
              </div>
              <form onSubmit={handleNewAppointment} className="space-y-3">
                {/* Hasta arama */}
                <div className="relative">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Hasta
                  </label>
                  <input
                    value={formData.patientSearch}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        patientSearch: e.target.value,
                        patientId: "",
                      }))
                    }
                    placeholder="Ad soyad veya telefon..."
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 text-sm focus:border-primary outline-none"
                  />
                  {formData.patientId && (
                    <p className="text-xs text-primary font-semibold mt-0.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">
                        check_circle
                      </span>
                      Hasta seçildi
                    </p>
                  )}
                  {patientResults.length > 0 && !formData.patientId && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-outline-variant/20 rounded-xl shadow-lg z-10 overflow-hidden">
                      {patientResults.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() =>
                            setFormData((f) => ({
                              ...f,
                              patientId: p.id,
                              patientSearch: `${p.firstName} ${p.lastName}`,
                            }))
                          }
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-container-low text-left text-sm"
                        >
                          <span className="font-bold text-on-surface">
                            {p.firstName} {p.lastName}
                          </span>
                          <span className="text-on-surface-variant text-xs">
                            {p.phone}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                      Hekim
                    </label>
                    <select
                      value={formData.doctorId}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, doctorId: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 text-sm outline-none"
                      required
                    >
                      <option value="">Seçin...</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                      Koltuk
                    </label>
                    <select
                      value={formData.chairNo}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          chairNo: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 text-sm outline-none"
                    >
                      {CHAIRS.map((c, i) => (
                        <option key={i + 1} value={i + 1}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                      Tarih
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, date: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 text-sm outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                      Saat
                    </label>
                    <div className="flex gap-1">
                      <select
                        value={formData.startHour}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            startHour: e.target.value,
                          }))
                        }
                        className="flex-1 px-2 py-2 rounded-xl border border-outline-variant/40 text-sm outline-none"
                      >
                        {HOURS.map((h) => (
                          <option key={h} value={String(h).padStart(2, "0")}>
                            {String(h).padStart(2, "0")}
                          </option>
                        ))}
                      </select>
                      <select
                        value={formData.startMin}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            startMin: e.target.value,
                          }))
                        }
                        className="flex-1 px-2 py-2 rounded-xl border border-outline-variant/40 text-sm outline-none"
                      >
                        {["00", "15", "30", "45"].map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                      Süre (dk)
                    </label>
                    <select
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          duration: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 text-sm outline-none"
                    >
                      {[15, 30, 45, 60, 90, 120].map((d) => (
                        <option key={d} value={d}>
                          {d} dk
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    İşlem Türü
                  </label>
                  <input
                    value={formData.type}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, type: e.target.value }))
                    }
                    placeholder="Muayene, Dolgu, Kanal..."
                    list="appt-types"
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 text-sm outline-none"
                  />
                  <datalist id="appt-types">
                    {[
                      "Muayene",
                      "Kontrol",
                      "Dolgu",
                      "Kanal Tedavisi",
                      "Diş Çekimi",
                      "Diş Taşı Temizliği",
                      "İmplant",
                      "Ortodonti",
                    ].map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Not (opsiyonel)
                  </label>
                  <input
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, notes: e.target.value }))
                    }
                    placeholder="Ek not..."
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 text-sm outline-none"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2 rounded-xl border border-outline-variant/40 text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={
                      saving || !formData.patientId || !formData.doctorId
                    }
                    className="flex-1 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    {saving ? "Kaydediliyor..." : "Randevu Oluştur"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── ChairColumn bileşeni ──────────────────────────────────
interface ChairColumnProps {
  chairIdx: number;
  hours: number[];
  slotH: number;
  appointments: Appointment[];
  draggingId: string | null;
  onDragStart: (id: string, offset: number) => void;
  onDrop: (e: React.DragEvent, hourFloat: number) => void;
  onContextMenu: (e: React.MouseEvent, appt: Appointment) => void;
}

function ChairColumn({
  chairIdx,
  hours,
  slotH,
  appointments,
  draggingId,
  onDragStart,
  onDrop,
  onContextMenu,
}: ChairColumnProps) {
  function getHourFloat(e: React.DragEvent): number {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const raw = y / slotH + 8;
    // Snap to 30 min
    const h = Math.floor(raw);
    const m = raw % 1 >= 0.5 ? 0.5 : 0;
    return Math.max(8, Math.min(19.5, h + m));
  }

  return (
    <div
      className="flex-1 relative border-r border-outline-variant/8 last:border-0"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDrop(e, getHourFloat(e))}
    >
      {/* Grid lines */}
      {hours.map((h) => (
        <div
          key={h}
          className="absolute left-0 right-0 border-b border-outline-variant/8"
          style={{ top: (h - 8) * slotH, height: slotH }}
        >
          <div
            className="absolute left-0 right-0 border-b border-outline-variant/5"
            style={{ top: slotH / 2 }}
          />
        </div>
      ))}
      {/* Appointments */}
      {appointments.map((apt) => {
        const { top, height } = (() => {
          const s = new Date(apt.startTime);
          const e = new Date(apt.endTime);
          const t = (s.getHours() + s.getMinutes() / 60 - 8) * slotH + 2;
          const h = Math.max(
            28,
            ((e.getTime() - s.getTime()) / 3600000) * slotH - 4,
          );
          return { top: t, height: h };
        })();
        const colorClass = STATUS_COLORS[apt.status] || STATUS_COLORS.SCHEDULED;
        const isDragging = draggingId === apt.id;
        return (
          <div
            key={apt.id}
            draggable
            onDragStart={(e) => {
              onDragStart(
                apt.id,
                e.clientY - e.currentTarget.getBoundingClientRect().top,
              );
            }}
            onContextMenu={(e) => onContextMenu(e, apt)}
            className={`absolute left-1 right-1 ${colorClass} p-1.5 rounded-lg shadow-sm cursor-grab active:cursor-grabbing select-none transition-opacity ${isDragging ? "opacity-40" : "hover:brightness-95"}`}
            style={{ top, height, zIndex: isDragging ? 1 : 2 }}
          >
            <p className="text-[10px] font-bold uppercase tracking-tight opacity-70 truncate">
              {apt.type || "Randevu"}
            </p>
            <p className="text-xs font-bold truncate">
              {apt.patient.firstName} {apt.patient.lastName}
            </p>
            {height > 44 && (
              <p className="text-[10px] opacity-70">
                {new Date(apt.startTime).toLocaleTimeString("tr-TR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {" - "}
                {new Date(apt.endTime).toLocaleTimeString("tr-TR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
            {height > 60 && apt.doctor && (
              <p className="text-[9px] opacity-50 truncate">
                {apt.doctor.name}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
