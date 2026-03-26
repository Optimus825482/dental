"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Patient {
  id: string;
  patientNo: string;
  firstName: string;
  lastName: string;
  phone: string;
  allergies: { allergen: string }[];
}

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

const STATUS_MAP: Record<
  string,
  { label: string; cls: string; color: string; accent: string }
> = {
  COMPLETED: {
    label: "Tamamlandı",
    cls: "bg-emerald-100 text-emerald-700",
    color: "bg-emerald-500",
    accent: "bg-emerald-50 text-emerald-700",
  },
  IN_PROGRESS: {
    label: "Tedavide",
    cls: "bg-primary-container/30 text-primary",
    color: "bg-primary",
    accent: "bg-primary/5 text-primary",
  },
  CONFIRMED: {
    label: "Onaylandı",
    cls: "bg-violet-100 text-violet-700",
    color: "bg-violet-500",
    accent: "bg-violet-50 text-violet-700",
  },
  SCHEDULED: {
    label: "Planlandı",
    cls: "bg-surface-container-high text-on-surface-variant",
    color: "bg-blue-500",
    accent: "bg-blue-50 text-blue-700",
  },
  CANCELLED: {
    label: "İptal",
    cls: "bg-error/10 text-error",
    color: "bg-outline",
    accent: "bg-surface-container text-on-surface-variant",
  },
  NO_SHOW: {
    label: "Gelmedi",
    cls: "bg-amber-100 text-amber-700",
    color: "bg-amber-500",
    accent: "bg-amber-50 text-amber-700",
  },
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MobileDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [apptLoading, setApptLoading] = useState(true);

  // Hasta arama
  useEffect(() => {
    if (search.length < 2) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/patients?search=${encodeURIComponent(search)}&limit=5`,
        );
        const data = await res.json();
        setSearchResults(data.patients || []);
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Bugünkü randevular
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    fetch(`/api/appointments?date=${today}`)
      .then((r) => r.json())
      .then((d) => setAppointments(d.appointments || []))
      .catch(() => {})
      .finally(() => setApptLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Günaydın" : hour < 18 ? "İyi günler" : "İyi akşamlar";
  const completed = appointments.filter((a) => a.status === "COMPLETED").length;
  const total = appointments.length;

  return (
    <div className="pb-24 px-4 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <section className="mt-2">
        <p className="text-on-surface-variant text-sm font-medium">
          {greeting},
        </p>
        <h2 className="font-headline text-2xl font-bold text-on-surface">
          {session?.user?.name || "Dr. Hekim"}
        </h2>
      </section>

      {/* Hasta Ara */}
      <section className="relative">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hasta ara (ad veya telefon)..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-outline-variant/20 rounded-2xl text-sm text-on-surface placeholder-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          />
        </div>
        {search.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-lg border border-outline-variant/20 z-50 overflow-hidden">
            {searching ? (
              <div className="p-4 text-center">
                <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto" />
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    router.push(`/patients/${p.id}`);
                    setSearch("");
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-surface-container-low transition-colors text-left border-b border-outline-variant/8 last:border-0"
                >
                  <div className="w-9 h-9 rounded-full bg-primary-container/20 flex items-center justify-center font-bold text-xs text-primary">
                    {p.firstName[0]}
                    {p.lastName[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-on-surface">
                      {p.firstName} {p.lastName}
                    </p>
                    <p className="text-[11px] text-on-surface-variant">
                      {p.phone}
                    </p>
                  </div>
                  {p.allergies.length > 0 && (
                    <span className="material-symbols-outlined text-error text-sm">
                      warning
                    </span>
                  )}
                </button>
              ))
            ) : (
              <p className="p-4 text-sm text-on-surface-variant text-center">
                Sonuç bulunamadı
              </p>
            )}
          </div>
        )}
      </section>

      {/* Günlük Özet */}
      <section className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-2xl border border-outline-variant/15 text-center shadow-sm">
          <span className="block text-xl font-bold font-headline text-primary">
            {total}
          </span>
          <span className="text-[10px] font-bold text-on-surface-variant uppercase">
            Toplam
          </span>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-outline-variant/15 text-center shadow-sm">
          <span className="block text-xl font-bold font-headline text-emerald-500">
            {completed}
          </span>
          <span className="text-[10px] font-bold text-on-surface-variant uppercase">
            Tamamlanan
          </span>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-outline-variant/15 text-center shadow-sm">
          <span className="block text-xl font-bold font-headline text-amber-500">
            {total - completed}
          </span>
          <span className="text-[10px] font-bold text-on-surface-variant uppercase">
            Kalan
          </span>
        </div>
      </section>

      {/* Bugünkü Randevular */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-headline font-bold text-lg text-on-surface">
            Bugünkü Randevular
          </h3>
          <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            {new Date().toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "long",
            })}
          </span>
        </div>
        {apptLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-on-surface-variant/40 gap-2">
            <span className="text-4xl">📅</span>
            <p className="text-sm">Bugün randevu bulunmuyor.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => {
              const st = STATUS_MAP[apt.status] || STATUS_MAP.SCHEDULED;
              return (
                <button
                  key={apt.id}
                  onClick={() => router.push(`/patients/${apt.patient.id}`)}
                  className="w-full bg-white rounded-2xl p-4 border border-outline-variant/15 shadow-sm flex items-center gap-4 relative overflow-hidden text-left active:scale-[0.98] transition-transform"
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1.5 ${st.color}`}
                  />
                  <div
                    className={`w-14 h-14 rounded-2xl ${st.accent} flex flex-col items-center justify-center shrink-0`}
                  >
                    <span className="text-sm font-bold leading-none">
                      {fmtTime(apt.startTime)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-headline font-bold text-sm text-on-surface truncate">
                        {apt.patient.firstName} {apt.patient.lastName}
                      </h4>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${st.cls}`}
                      >
                        {st.label}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {apt.type || "Randevu"}
                    </p>
                    <div className="flex gap-3 mt-1 text-[11px] text-on-surface-variant">
                      <span>{apt.doctor.name}</span>
                      <span>Koltuk {apt.chairNo}</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-outline/30 text-lg shrink-0">
                    chevron_right
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Hızlı İşlemler */}
      <section className="grid grid-cols-2 gap-3">
        <button
          onClick={() => router.push("/patients")}
          className="bg-primary text-white p-4 rounded-2xl shadow-md shadow-primary/20 flex items-center gap-3 active:scale-95 transition-transform"
        >
          <span
            className="material-symbols-outlined text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            person_add
          </span>
          <span className="font-headline font-bold text-sm">Hasta Kabul</span>
        </button>
        <button
          onClick={() => router.push("/appointments")}
          className="bg-white text-on-surface p-4 rounded-2xl border border-outline-variant/15 shadow-sm flex items-center gap-3 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-2xl text-primary">
            calendar_month
          </span>
          <span className="font-headline font-bold text-sm">Takvim</span>
        </button>
      </section>
    </div>
  );
}
