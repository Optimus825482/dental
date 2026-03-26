"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface PatientDetail {
  id: string;
  patientNo: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  birthDate?: string;
  gender?: string;
  bloodType?: string;
  address?: string;
  notes?: string;
  allergies?: { id: string; allergen: string; severity: string }[];
  account?: { balance: number };
  appointments?: {
    id: string;
    startTime: string;
    status: string;
    type?: string;
    doctor: { name: string };
  }[];
}

export default function PatientDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/patients/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setPatient(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  if (!patient)
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <span className="material-symbols-outlined text-4xl text-outline">
          error
        </span>
        <p className="font-headline font-bold">Hasta bulunamadı</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-primary font-bold"
        >
          Geri Dön
        </button>
      </div>
    );

  const age = patient.birthDate
    ? Math.floor(
        (Date.now() - new Date(patient.birthDate).getTime()) / 31557600000,
      )
    : null;
  const allergies = patient.allergies || [];
  const appointments = patient.appointments || [];

  return (
    <div className="max-w-lg mx-auto px-4 pb-24 space-y-4">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-primary font-semibold"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Geri
      </button>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl p-5 border border-outline-variant/15 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-container/20 flex items-center justify-center font-bold text-xl text-primary font-headline">
            {patient.firstName?.[0] ?? "?"}
            {patient.lastName?.[0] ?? ""}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-headline font-bold text-on-surface">
              {patient.firstName || "—"} {patient.lastName || ""}
            </h2>
            <p className="text-sm text-on-surface-variant">
              {patient.patientNo}
              {age !== null && ` · ${age} Yaş`}
              {patient.bloodType && ` · ${patient.bloodType}`}
            </p>
            <p className="text-sm text-on-surface-variant mt-0.5">
              {patient.phone}
            </p>
          </div>
        </div>

        {/* Alerji Uyarısı */}
        {allergies.length > 0 && (
          <div className="mt-4 p-3 bg-error/5 border border-error/20 rounded-xl flex items-start gap-3">
            <span
              className="material-symbols-outlined text-error shrink-0"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              warning
            </span>
            <div>
              <p className="text-xs font-bold text-error uppercase">Alerji</p>
              <p className="text-sm text-on-error-container">
                {allergies.map((a) => a.allergen).join(", ")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Hızlı İşlemler */}
      <div className="grid grid-cols-3 gap-3">
        <button className="bg-primary text-white p-3 rounded-2xl flex flex-col items-center gap-1 shadow-md active:scale-95 transition-transform">
          <span className="material-symbols-outlined">play_arrow</span>
          <span className="text-[10px] font-bold">Tedavi Başlat</span>
        </button>
        <button className="bg-white border border-outline-variant/15 p-3 rounded-2xl flex flex-col items-center gap-1 shadow-sm active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-primary">
            event_available
          </span>
          <span className="text-[10px] font-bold text-on-surface-variant">
            Randevu
          </span>
        </button>
        <button className="bg-white border border-outline-variant/15 p-3 rounded-2xl flex flex-col items-center gap-1 shadow-sm active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-primary">
            payments
          </span>
          <span className="text-[10px] font-bold text-on-surface-variant">
            Ödeme
          </span>
        </button>
      </div>

      {/* Bilgiler */}
      <div className="bg-white rounded-2xl p-5 border border-outline-variant/15 shadow-sm space-y-3">
        <h3 className="font-headline font-bold text-on-surface">Bilgiler</h3>
        {patient.email && <InfoRow label="E-Posta" value={patient.email} />}
        {patient.address && <InfoRow label="Adres" value={patient.address} />}
        {patient.notes && (
          <InfoRow label="Geliş Sebebi" value={patient.notes} />
        )}
      </div>

      {/* Son Randevular */}
      <div className="bg-white rounded-2xl p-5 border border-outline-variant/15 shadow-sm">
        <h3 className="font-headline font-bold text-on-surface mb-3">
          Son Randevular
        </h3>
        {appointments.length === 0 ? (
          <p className="text-sm text-on-surface-variant">
            Henüz randevu kaydı yok.
          </p>
        ) : (
          <div className="space-y-2">
            {appointments.slice(0, 5).map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 p-2 bg-surface-container-low/50 rounded-xl"
              >
                <span className="material-symbols-outlined text-primary text-lg">
                  event
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-on-surface">
                    {a.type || "Randevu"}
                  </p>
                  <p className="text-[11px] text-on-surface-variant">
                    {a.doctor.name} ·{" "}
                    {new Date(a.startTime).toLocaleDateString("tr-TR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-outline-variant/8 last:border-0">
      <span className="text-sm text-on-surface-variant">{label}</span>
      <span className="text-sm font-medium text-on-surface text-right max-w-[60%]">
        {value}
      </span>
    </div>
  );
}
