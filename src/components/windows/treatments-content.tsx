"use client";

import { useState, useEffect, useCallback } from "react";
import { useWindowStore } from "@/stores/window-store";

interface Patient {
  id: string;
  patientNo: string;
  firstName: string;
  lastName: string;
  phone: string;
  bloodType?: string;
  allergies: { allergen: string }[];
}

export function TreatmentsContent() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { openWindow } = useWindowStore();

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    const res = await fetch(
      `/api/patients?search=${encodeURIComponent(search)}&limit=100`,
    );
    const data = await res.json();
    // Alfabetik sırala
    const sorted = (data.patients || []).sort((a: Patient, b: Patient) =>
      `${a.firstName} ${a.lastName}`.localeCompare(
        `${b.firstName} ${b.lastName}`,
        "tr",
      ),
    );
    setPatients(sorted);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  function goToTimeline(p: Patient) {
    openWindow(
      `timeline-${p.id}`,
      `${p.firstName} ${p.lastName} — Zaman Tüneli`,
      "timeline",
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-outline-variant/10 flex items-center gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ad, soyad veya telefon ile ara..."
            className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-transparent focus:border-primary rounded-xl text-sm transition-all outline-none"
          />
        </div>
        <span className="text-xs text-outline font-bold shrink-0">
          {patients.length} hasta
        </span>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant/40 gap-2">
            <span className="text-4xl">👤</span>
            <p className="text-sm">Hasta bulunamadı</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/8">
            {patients.map((p) => (
              <button
                key={p.id}
                onClick={() => goToTimeline(p)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-container/5 transition-colors text-left group"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center font-bold text-sm text-primary shrink-0">
                  {p.firstName?.[0]}
                  {p.lastName?.[0]}
                </div>

                {/* Bilgiler */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-on-surface text-sm truncate">
                    {p.firstName} {p.lastName}
                    {p.allergies?.length > 0 && (
                      <span className="ml-2 text-[10px] text-error font-bold">
                        ⚠ Alerji
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-on-surface-variant">{p.phone}</p>
                </div>

                {/* Hasta no */}
                <span className="font-mono text-[10px] bg-surface-container px-1.5 py-0.5 rounded font-bold text-on-surface-variant shrink-0">
                  {p.patientNo}
                </span>

                {/* Ok */}
                <span className="text-outline/30 group-hover:text-primary transition-colors text-lg shrink-0">
                  ›
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
