"use client";

import { useState, useEffect, useRef } from "react";

interface PlanItem {
  id: string;
  name: string;
  code?: string;
  duration: number; // dakika
  unitPrice: number;
  toothNumber?: number;
}

interface ScheduledItem {
  itemId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;
}

interface ExistingAppointment {
  id: string;
  startTime: string;
  endTime: string;
  patient: { firstName: string; lastName: string };
  doctor: { name: string; color: string };
  type?: string;
}

interface Props {
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  planItems: PlanItem[];
  onSave: (scheduled: ScheduledItem[]) => void;
  onCancel: () => void;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08-20

function fmtHM(h: number, m: number) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function addMinutes(time: string, mins: number) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  return fmtHM(Math.floor(total / 60) % 24, total % 60);
}

export function TreatmentPlanScheduler({
  patientId,
  patientName,
  doctorId,
  doctorName,
  planItems,
  onSave,
  onCancel,
}: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayAppointments, setDayAppointments] = useState<ExistingAppointment[]>(
    [],
  );
  const [scheduled, setScheduled] = useState<ScheduledItem[]>([]);
  const [draggingItem, setDraggingItem] = useState<PlanItem | null>(null);
  const [dragOver, setDragOver] = useState<{
    hour: number;
    min: number;
  } | null>(null);
  const calRef = useRef<HTMLDivElement>(null);

  // Seçili gün randevularını yükle
  useEffect(() => {
    if (!selectedDate) return;
    fetch(`/api/appointments?date=${selectedDate}&doctorId=${doctorId}`)
      .then((r) => r.json())
      .then((d) => setDayAppointments(d.appointments || []))
      .catch(() => {});
  }, [selectedDate, doctorId]);

  // Takvim hesapla
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ];
  const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  function toDateStr(d: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  // Sürükle-bırak: timeline'a bırakma
  function handleTimelineDrop(e: React.DragEvent, hour: number, min: number) {
    e.preventDefault();
    if (!draggingItem || !selectedDate) return;
    const startTime = fmtHM(hour, min);
    const endTime = addMinutes(startTime, draggingItem.duration || 30);
    setScheduled((prev) => {
      const filtered = prev.filter((s) => s.itemId !== draggingItem.id);
      return [
        ...filtered,
        { itemId: draggingItem.id, date: selectedDate, startTime, endTime },
      ];
    });
    setDraggingItem(null);
    setDragOver(null);
  }

  // Zamanlanmış işlemi kaldır
  function removeScheduled(itemId: string) {
    setScheduled((prev) => prev.filter((s) => s.itemId !== itemId));
  }

  const scheduledIds = new Set(scheduled.map((s) => s.itemId));
  const unscheduled = planItems.filter((p) => !scheduledIds.has(p.id));
  const allScheduled = planItems.every((p) => scheduledIds.has(p.id));

  // Timeline slot yüksekliği: 1 saat = 60px
  const PX_PER_MIN = 1;

  function timeToY(time: string) {
    const [h, m] = time.split(":").map(Number);
    return (h - 8) * 60 * PX_PER_MIN + m * PX_PER_MIN;
  }

  function yToTime(y: number) {
    const totalMin = Math.round(y / PX_PER_MIN / 15) * 15 + 8 * 60;
    return fmtHM(Math.floor(totalMin / 60), totalMin % 60);
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/20 bg-white shrink-0">
        <div>
          <h2 className="font-bold text-on-surface text-sm">
            Tedavi Planı — Randevu Zamanlaması
          </h2>
          <p className="text-xs text-on-surface-variant">
            {patientName} · {doctorName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-xl border border-outline-variant/30 text-sm text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            İptal
          </button>
          <button
            onClick={() => onSave(scheduled)}
            disabled={!allScheduled}
            className="px-4 py-1.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:brightness-110 transition-all disabled:opacity-40"
          >
            {allScheduled
              ? "✓ Kaydet ve Onayla"
              : `${scheduledIds.size}/${planItems.length} Zamanlandı`}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* SOL: İşlem listesi */}
        <div className="w-64 border-r border-outline-variant/20 flex flex-col bg-surface-container-low/30 shrink-0">
          <div className="px-4 py-3 border-b border-outline-variant/10">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Planlanacak İşlemler
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {planItems.map((item) => {
              const sched = scheduled.find((s) => s.itemId === item.id);
              return (
                <div
                  key={item.id}
                  draggable={!sched}
                  onDragStart={() => !sched && setDraggingItem(item)}
                  onDragEnd={() => setDraggingItem(null)}
                  className={`rounded-xl border p-3 transition-all ${
                    sched
                      ? "bg-emerald-50 border-emerald-200 opacity-70"
                      : "bg-white border-outline-variant/20 cursor-grab active:cursor-grabbing hover:border-primary/40 hover:shadow-sm"
                  } ${draggingItem?.id === item.id ? "opacity-50 scale-95" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-on-surface truncate">
                        {item.name}
                      </p>
                      {item.code && (
                        <p className="text-[10px] text-outline font-mono">
                          {item.code}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-on-surface-variant">
                          ⏱ {item.duration} dk
                        </span>
                        {item.unitPrice > 0 && (
                          <span className="text-[10px] text-primary font-bold">
                            {Number(item.unitPrice).toLocaleString("tr-TR")} ₺
                          </span>
                        )}
                      </div>
                    </div>
                    {sched ? (
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold text-emerald-700">
                          ✓ Zamanlandı
                        </p>
                        <p className="text-[10px] text-emerald-600">
                          {sched.date.slice(5)}
                        </p>
                        <p className="text-[10px] text-emerald-600">
                          {sched.startTime}
                        </p>
                        <button
                          onClick={() => removeScheduled(item.id)}
                          className="text-[10px] text-error hover:underline mt-0.5"
                        >
                          Kaldır
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-outline shrink-0">
                        Sürükle →
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Özet */}
          <div className="p-3 border-t border-outline-variant/10 bg-surface-container-low/50">
            <p className="text-[10px] text-on-surface-variant mb-1">
              Toplam Tutar
            </p>
            <p className="text-sm font-black text-primary">
              {planItems
                .reduce((s, i) => s + (i.unitPrice || 0), 0)
                .toLocaleString("tr-TR")}{" "}
              ₺
            </p>
          </div>
        </div>

        {/* SAĞ: Takvim + Timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Ay takvimi */}
          <div className="p-4 border-b border-outline-variant/10 bg-white shrink-0">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => {
                  if (month === 0) {
                    setMonth(11);
                    setYear((y) => y - 1);
                  } else setMonth((m) => m - 1);
                }}
                className="p-1.5 hover:bg-surface-container rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">
                  chevron_left
                </span>
              </button>
              <span className="text-sm font-bold text-on-surface">
                {monthNames[month]} {year}
              </span>
              <button
                onClick={() => {
                  if (month === 11) {
                    setMonth(0);
                    setYear((y) => y + 1);
                  } else setMonth((m) => m + 1);
                }}
                className="p-1.5 hover:bg-surface-container rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">
                  chevron_right
                </span>
              </button>
            </div>
            {/* Gün başlıkları */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {dayNames.map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] font-bold text-outline py-1"
                >
                  {d}
                </div>
              ))}
            </div>
            {/* Günler */}
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }).map(
                (_, i) => (
                  <div key={`e${i}`} />
                ),
              )}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                const ds = toDateStr(d);
                const isSelected = selectedDate === ds;
                const isToday = ds === today.toISOString().slice(0, 10);
                const hasScheduled = scheduled.some((s) => s.date === ds);
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDate(ds)}
                    className={`relative h-8 w-full rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-primary text-on-primary"
                        : isToday
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-surface-container text-on-surface"
                    }`}
                  >
                    {d}
                    {hasScheduled && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timeline */}
          {selectedDate ? (
            <div className="flex-1 overflow-y-auto relative" ref={calRef}>
              <div className="relative" style={{ height: `${13 * 60}px` }}>
                {/* Saat çizgileri */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-outline-variant/15 flex items-start"
                    style={{ top: `${(h - 8) * 60}px` }}
                  >
                    <span className="text-[10px] text-outline w-10 pl-2 -mt-2.5 shrink-0">
                      {fmtHM(h, 0)}
                    </span>
                    <div className="flex-1" />
                  </div>
                ))}

                {/* Drop zone — 15 dakikalık slotlar */}
                {HOURS.map((h) =>
                  [0, 15, 30, 45].map((m) => (
                    <div
                      key={`${h}-${m}`}
                      className={`absolute left-10 right-2 h-[15px] rounded transition-colors ${
                        dragOver?.hour === h && dragOver?.min === m
                          ? "bg-primary/20 border border-primary/40"
                          : draggingItem
                            ? "hover:bg-primary/10"
                            : ""
                      }`}
                      style={{ top: `${(h - 8) * 60 + m}px` }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver({ hour: h, min: m });
                      }}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={(e) => handleTimelineDrop(e, h, m)}
                    />
                  )),
                )}

                {/* Mevcut randevular */}
                {dayAppointments.map((apt) => {
                  const start = new Date(apt.startTime);
                  const end = new Date(apt.endTime);
                  const startStr = fmtHM(start.getHours(), start.getMinutes());
                  const endStr = fmtHM(end.getHours(), end.getMinutes());
                  const top = timeToY(startStr);
                  const height = Math.max(20, timeToY(endStr) - top);
                  return (
                    <div
                      key={apt.id}
                      className="absolute left-10 right-2 rounded-lg px-2 py-1 text-white text-[10px] font-bold overflow-hidden"
                      style={{
                        top,
                        height,
                        background: apt.doctor.color || "#00677e",
                        opacity: 0.85,
                      }}
                    >
                      <p className="truncate">
                        {apt.patient.firstName} {apt.patient.lastName}
                      </p>
                      <p className="opacity-75">
                        {startStr} - {endStr}
                      </p>
                    </div>
                  );
                })}

                {/* Zamanlanmış işlemler */}
                {scheduled
                  .filter((s) => s.date === selectedDate)
                  .map((s) => {
                    const item = planItems.find((p) => p.id === s.itemId);
                    if (!item) return null;
                    const top = timeToY(s.startTime);
                    const height = Math.max(20, timeToY(s.endTime) - top);
                    return (
                      <div
                        key={s.itemId}
                        className="absolute left-10 right-2 rounded-lg px-2 py-1 bg-violet-600 text-white text-[10px] font-bold overflow-hidden border-2 border-violet-400"
                        style={{ top, height }}
                      >
                        <p className="truncate">📋 {item.name}</p>
                        <p className="opacity-75">
                          {s.startTime} - {s.endTime}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant/40 gap-3">
              <span className="text-5xl">📅</span>
              <p className="text-sm font-medium">Takvimden bir gün seçin</p>
              <p className="text-xs">
                İşlemleri seçili güne sürükleyip bırakın
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
