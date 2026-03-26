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
  appointments?: { id: string; status: string; startTime: string }[];
  treatmentPlans?: { id: string; status: string; title?: string }[];
}

// Adım: search → found (mevcut hasta) → new_visit | search → form (yeni hasta) → visit_reason
type Step = "search" | "found" | "form" | "visit_reason";

export function PatientAdmissionContent() {
  const [step, setStep] = useState<Step>("search");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [newAllergen, setNewAllergen] = useState("");
  const [visitDate, setVisitDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [visitReason, setVisitReason] = useState("");
  const [saving, setSaving] = useState(false);
  const { closeWindow, openWindow } = useWindowStore();

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const res = await fetch(
      `/api/patients?search=${encodeURIComponent(q)}&limit=8`,
    );
    const data = await res.json();
    setResults(data.patients || []);
    setSearching(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(search), 300);
    return () => clearTimeout(t);
  }, [search, doSearch]);

  function openPatient(p: Patient) {
    closeWindow("patients");
    openWindow(
      `patient-${p.id}`,
      `${p.firstName} ${p.lastName}`,
      "clinical_notes",
    );
  }

  // Mevcut hasta seçildi → timeline penceresini aç
  async function selectExistingPatient(p: Patient) {
    closeWindow("patients");
    openWindow(
      `timeline-${p.id}`,
      `${p.firstName} ${p.lastName} — Zaman Tüneli`,
      "timeline",
    );
  }

  // Yeni işlem başlat → tarih + geliş nedeni al
  function startNewVisit() {
    setVisitDate(new Date().toISOString().slice(0, 10));
    setVisitReason("");
    setStep("visit_reason");
  }

  // Geliş nedeni kaydedip hasta sayfasına git
  async function saveVisitAndGo() {
    if (!selectedPatient || !visitReason.trim()) return;
    setSaving(true);
    // İşlem kaydı oluştur (appointment veya note olarak)
    await fetch("/api/patients/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: selectedPatient.id,
        visitDate,
        reason: visitReason,
      }),
    });
    setSaving(false);
    openPatient(selectedPatient);
  }

  function addAllergy() {
    if (!newAllergen.trim()) return;
    setAllergies([...allergies, newAllergen.trim()]);
    setNewAllergen("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const fullName = ((form.get("fullName") as string) || "").trim();
    const parts = fullName.split(" ");
    const body = {
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" ") || parts[0] || "",
      tcKimlik: form.get("tcKimlik") || undefined,
      phone: form.get("phone"),
      email: form.get("email") || undefined,
      birthDate: form.get("birthDate") || undefined,
      gender: form.get("gender") || undefined,
      bloodType: form.get("bloodType") || undefined,
      notes: visitReason || (form.get("notes") as string) || undefined,
      allergies:
        allergies.length > 0
          ? allergies.map((a) => ({ allergen: a, severity: "HIGH" as const }))
          : undefined,
    };
    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Kayıt sırasında hata oluştu.");
      return;
    }
    const created = await res.json();
    // Yeni hasta için de geliş kaydı oluştur
    if (visitReason) {
      await fetch("/api/patients/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: created.id,
          visitDate,
          reason: visitReason,
        }),
      });
    }
    openPatient(created);
  }

  // ── STEP: SEARCH ──────────────────────────────────────────
  if (step === "search")
    return (
      <div className="flex flex-col h-full p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary text-xl">
            person_search
          </span>
          <h3 className="font-headline font-bold text-on-surface text-base">
            Hasta Ara
          </h3>
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ad soyad veya telefon numarası..."
            autoFocus
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-on-surface/20 bg-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}
        </div>

        {search.length >= 2 ? (
          <div className="mt-2 space-y-1 flex-1 overflow-y-auto">
            {results.length > 0 ? (
              results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectExistingPatient(p)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary-container/10 border border-transparent hover:border-primary/20 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                    {p.firstName?.[0]}
                    {p.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface">
                      {p.firstName} {p.lastName}
                    </p>
                    <p className="text-[12px] text-on-surface-variant">
                      {p.phone} · {p.patientNo}
                    </p>
                  </div>
                  {p.allergies?.length > 0 && (
                    <span className="material-symbols-outlined text-error text-sm">
                      warning
                    </span>
                  )}
                  <span className="material-symbols-outlined text-outline/30 group-hover:text-primary">
                    chevron_right
                  </span>
                </button>
              ))
            ) : !searching ? (
              <div className="text-center py-6">
                <p className="text-sm text-on-surface-variant mb-4">
                  Kayıt bulunamadı
                </p>
                <button
                  onClick={() => {
                    setStep("form");
                    setVisitDate(new Date().toISOString().slice(0, 10));
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-on-primary font-bold text-sm shadow-md hover:brightness-110 transition-all"
                >
                  <span className="material-symbols-outlined text-base">
                    person_add
                  </span>
                  Yeni Hasta Kaydı
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant/40 gap-2">
            <span className="material-symbols-outlined text-5xl">
              person_search
            </span>
            <p className="text-sm">Hasta adı veya telefon numarası yazın</p>
          </div>
        )}

        <div className="pt-3 border-t border-outline-variant/10 flex justify-center">
          <button
            onClick={() => {
              setStep("form");
              setVisitDate(new Date().toISOString().slice(0, 10));
            }}
            className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Doğrudan Yeni Kayıt
          </button>
        </div>
      </div>
    );

  // ── STEP: FOUND (mevcut hasta) ────────────────────────────
  if (step === "found" && selectedPatient) {
    const activePlans =
      selectedPatient.treatmentPlans?.filter((p) => p.status === "ACTIVE") ||
      [];
    const hasActive = activePlans.length > 0;

    return (
      <div className="flex flex-col h-full p-5 gap-4">
        <button
          onClick={() => setStep("search")}
          className="flex items-center gap-1 text-sm text-primary font-semibold self-start"
        >
          <span className="material-symbols-outlined text-base">
            arrow_back
          </span>
          Geri
        </button>

        {/* Hasta özeti */}
        <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20">
          <div className="w-14 h-14 rounded-2xl bg-primary-container/20 flex items-center justify-center font-bold text-xl text-primary">
            {selectedPatient.firstName?.[0]}
            {selectedPatient.lastName?.[0]}
          </div>
          <div>
            <h2 className="font-bold text-on-surface text-base">
              {selectedPatient.firstName} {selectedPatient.lastName}
            </h2>
            <p className="text-sm text-on-surface-variant">
              {selectedPatient.phone}
            </p>
          </div>
          <button
            onClick={() => openPatient(selectedPatient)}
            className="ml-auto flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
          >
            Hasta Kartı
            <span className="material-symbols-outlined text-sm">
              open_in_new
            </span>
          </button>
        </div>

        {/* Devam eden tedavi varsa göster */}
        {hasActive && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-amber-600 text-lg">
                pending_actions
              </span>
              <p className="text-sm font-bold text-amber-800">
                Devam Eden Tedavi Planı
              </p>
            </div>
            {activePlans.map((plan) => (
              <p key={plan.id} className="text-xs text-amber-700 ml-7">
                {plan.title || "Tedavi Planı"}
              </p>
            ))}
          </div>
        )}

        {/* Seçenekler */}
        <div className="space-y-3 flex-1">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            Ne yapmak istersiniz?
          </p>

          {hasActive && (
            <button
              onClick={() => openPatient(selectedPatient)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-primary/20 bg-primary-container/5 hover:bg-primary-container/10 transition-all text-left"
            >
              <span className="material-symbols-outlined text-primary text-2xl">
                play_circle
              </span>
              <div>
                <p className="font-bold text-on-surface text-sm">
                  Devam Eden Tedaviye Git
                </p>
                <p className="text-xs text-on-surface-variant">
                  Mevcut tedavi planını görüntüle ve devam et
                </p>
              </div>
            </button>
          )}

          <button
            onClick={startNewVisit}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-all text-left"
          >
            <span className="material-symbols-outlined text-emerald-600 text-2xl">
              add_circle
            </span>
            <div>
              <p className="font-bold text-on-surface text-sm">
                Yeni İşlem Başlat
              </p>
              <p className="text-xs text-on-surface-variant">
                Tarih ve geliş nedeni girerek yeni işlem kaydı oluştur
              </p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ── STEP: VISIT REASON ────────────────────────────────────
  if (step === "visit_reason" && selectedPatient)
    return (
      <div className="flex flex-col h-full p-5 gap-4">
        <button
          onClick={() => setStep("found")}
          className="flex items-center gap-1 text-sm text-primary font-semibold self-start"
        >
          <span className="material-symbols-outlined text-base">
            arrow_back
          </span>
          Geri
        </button>
        <div>
          <h3 className="font-headline font-bold text-on-surface text-base mb-1">
            Yeni İşlem Kaydı
          </h3>
          <p className="text-sm text-on-surface-variant">
            {selectedPatient.firstName} {selectedPatient.lastName}
          </p>
        </div>
        <div className="space-y-4 flex-1">
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">
              Geliş Tarihi
            </label>
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-on-surface/20 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">
              Geliş Nedeni / Şikayet
            </label>
            <textarea
              value={visitReason}
              onChange={(e) => setVisitReason(e.target.value)}
              placeholder="Hastanın şikayetini ve geliş nedenini yazın..."
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl border border-on-surface/20 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
            />
          </div>
        </div>
        <button
          onClick={saveVisitAndGo}
          disabled={saving || !visitReason.trim()}
          className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-base">
            check_circle
          </span>
          {saving ? "Kaydediliyor..." : "Kaydet ve Tanı Sayfasına Git"}
        </button>
      </div>
    );

  // ── STEP: FORM (yeni hasta) ───────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="px-5 pt-3 pb-1 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setStep("search")}
          className="p-1 hover:bg-surface-container rounded-lg"
        >
          <span className="material-symbols-outlined text-on-surface-variant">
            arrow_back
          </span>
        </button>
        <h3 className="font-headline font-bold text-on-surface text-[15px]">
          Yeni Hasta Kaydı
        </h3>
      </div>
      <div className="px-5 space-y-2 flex-1 overflow-y-auto pb-2">
        {error && (
          <div className="bg-error/10 border border-error/20 rounded-xl px-3 py-2 text-error text-sm font-semibold">
            {error}
          </div>
        )}
        <Sec icon="badge" title="Kimlik">
          <div className="grid grid-cols-2 gap-3">
            <Inp
              name="tcKimlik"
              label="T.C. Kimlik No"
              placeholder="11 Haneli"
              maxLength={11}
            />
            <Inp name="birthDate" label="Doğum Tarihi" type="date" />
          </div>
        </Sec>
        <Sec icon="person" title="Kişisel Bilgiler">
          <div className="grid grid-cols-2 gap-3">
            <Inp
              name="fullName"
              label="Ad Soyad"
              placeholder="Hastanın Adı Soyadı"
              required
            />
            <Inp
              name="phone"
              label="Telefon"
              placeholder="(5XX) XXX XX XX"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-2">
            <Sel
              name="gender"
              label="Cinsiyet"
              options={[
                ["", "Seçiniz"],
                ["MALE", "Erkek"],
                ["FEMALE", "Kadın"],
              ]}
            />
            <Inp
              name="email"
              label="E-Posta"
              placeholder="ornek@email.com"
              type="email"
            />
            <Sel
              name="bloodType"
              label="Kan Grubu"
              options={[
                ["", "Seçiniz"],
                ...[
                  "0Rh+",
                  "0Rh-",
                  "ARh+",
                  "ARh-",
                  "BRh+",
                  "BRh-",
                  "ABRh+",
                  "ABRh-",
                ].map((b) => [b, b]),
              ]}
            />
          </div>
        </Sec>
        <Sec icon="warning" title="Alerji Bilgisi">
          <div className="flex gap-2">
            <input
              value={newAllergen}
              onChange={(e) => setNewAllergen(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), addAllergy())
              }
              placeholder="Alerjen adı (ör: Penisilin)"
              className="flex-1 px-3 py-2 rounded-lg border border-error/20 bg-white text-sm focus:ring-2 focus:ring-error/20 transition-all"
            />
            <button
              type="button"
              onClick={addAllergy}
              className="px-3 py-2 rounded-lg bg-error/10 text-error font-bold text-sm hover:bg-error hover:text-white transition-all"
            >
              Ekle
            </button>
          </div>
          {allergies.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {allergies.map((a, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-error/10 text-error rounded-full text-[11px] font-bold"
                >
                  {a}{" "}
                  <button
                    type="button"
                    onClick={() =>
                      setAllergies(allergies.filter((_, j) => j !== i))
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </Sec>
        <Sec icon="calendar_today" title="Geliş Bilgisi">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-on-surface mb-0.5 block">
                Geliş Tarihi
              </label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-on-surface/20 bg-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-on-surface mb-0.5 block">
                Geliş Nedeni *
              </label>
              <input
                name="notes"
                value={visitReason}
                onChange={(e) => setVisitReason(e.target.value)}
                placeholder="Şikayet / geliş sebebi"
                required
                className="w-full px-3 py-2 rounded-xl border border-on-surface/20 bg-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>
        </Sec>
      </div>
      <div className="px-5 py-2 flex justify-center gap-3 border-t border-outline-variant/10">
        <button
          type="button"
          onClick={() => setStep("search")}
          className="px-6 py-2 rounded-full border border-on-surface/20 text-on-surface-variant font-semibold text-sm hover:bg-surface-container transition-all"
        >
          Geri
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-7 py-2 rounded-full bg-primary text-on-primary font-bold text-sm shadow-md hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-base">
            check_circle
          </span>
          {loading ? "..." : "Kaydet ve Kabul Et"}
        </button>
      </div>
    </form>
  );
}

function Sec({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="material-symbols-outlined text-primary text-base">
          {icon}
        </span>
        <h3 className="font-headline font-bold text-on-surface text-[14px]">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function Inp({
  name,
  label,
  placeholder,
  type,
  required,
  maxLength,
}: {
  name: string;
  label?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <div>
      {label && (
        <label className="text-[11px] font-bold text-on-surface mb-0.5 block">
          {label}
        </label>
      )}
      <input
        name={name}
        type={type || "text"}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        className="w-full px-3 py-2 rounded-xl border border-on-surface/20 bg-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
      />
    </div>
  );
}

function Sel({
  name,
  label,
  options,
}: {
  name: string;
  label: string;
  options: string[][];
}) {
  return (
    <div>
      <label className="text-[11px] font-bold text-on-surface mb-0.5 block">
        {label}
      </label>
      <select
        name={name}
        className="w-full px-3 py-2 rounded-xl border border-on-surface/20 bg-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
