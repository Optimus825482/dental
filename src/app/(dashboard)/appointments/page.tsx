"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  type?: string;
  chairNo: number;
  patient: { id: string; firstName: string; lastName: string };
  doctor: { name: string; color: string };
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  COMPLETED: { label: "Tamamlandı", cls: "bg-emerald-100 text-emerald-700" },
  IN_PROGRESS: {
    label: "Tedavide",
    cls: "bg-primary-container/30 text-primary",
  },
  CONFIRMED: { label: "Onaylandı", cls: "bg-violet-100 text-violet-700" },
  SCHEDULED: {
    label: "Planlandı",
    cls: "bg-surface-container-high text-on-surface-variant",
  },
  CANCELLED: { label: "İptal", cls: "bg-error/10 text-error" },
  NO_SHOW: { label: "Gelmedi", cls: "bg-amber-100 text-amber-700" },
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    fetch(`/api/appointments?date=${today}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => setAppointments(d.appointments || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );

  if (error)
    return (
      <div className="max-w-lg mx-auto px-4 pt-8 text-center text-error text-sm">
        {error}
      </div>
    );

  return (
    <div className="max-w-lg mx-auto px-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-headline font-bold text-xl text-on-surface">
            Randevular
          </h2>
          <p className="text-sm text-on-surface-variant">
            {new Date().toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "long",
              weekday: "long",
            })}
          </p>
        </div>
        <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
          {appointments.length} randevu
        </span>
      </div>

      {appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant/40 gap-3">
          <span className="text-5xl">📅</span>
          <p className="text-sm">Bugün randevu bulunmuyor.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => {
            const st = STATUS_MAP[apt.status] || STATUS_MAP.SCHEDULED;
            return (
              <div
                key={apt.id}
                className="bg-white rounded-2xl p-4 border-l-4 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
                style={{ borderLeftColor: apt.doctor.color || "#00677e" }}
                onClick={() => router.push(`/patients/${apt.patient.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-headline font-bold text-sm text-on-surface">
                      {apt.patient.firstName} {apt.patient.lastName}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {apt.type || "Randevu"} · {apt.doctor.name}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}
                  >
                    {st.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[12px] text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">
                      schedule
                    </span>
                    {fmtTime(apt.startTime)} - {fmtTime(apt.endTime)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">
                      chair
                    </span>
                    Koltuk {apt.chairNo}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
