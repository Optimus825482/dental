"use client";

import { useState, useEffect } from "react";
import { useWindowStore } from "@/stores/window-store";
import { TreatmentPlanScheduler } from "./treatment-plan-scheduler";

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
interface TreatmentDef {
  id: string;
  name: string;
  code?: string;
  price: number;
  duration: number;
}

type Step =
  | "overview"
  | "diagnosis"
  | "treatment_choice"
  | "single_session"
  | "plan_builder"
  | "plan_scheduler";

const VISIT_STATUS: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  open: {
    label: "Açık",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  diagnosed: {
    label: "Teşhis Yapıldı",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  treated: {
    label: "Tedavi Edildi",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  planned: {
    label: "Plan Oluşturuldu",
    color: "bg-violet-100 text-violet-700 border-violet-200",
    dot: "bg-violet-500",
  },
};

export function VisitDetailContent({
  visitId,
  patientId,
  patientName,
}: {
  visitId: string;
  patientId: string;
  patientName: string;
}) {
  const [tab, setTab] = useState<
    "diagnosis" | "dental" | "radiology" | "medical"
  >("diagnosis");
  const [step, setStep] = useState<Step>("overview");
  const [visit, setVisit] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [diagCodes, setDiagCodes] = useState<DiagnosisCode[]>([]);
  const [treatments, setTreatments] = useState<TreatmentDef[]>([]);
  const { openWindow } = useWindowStore();

  // Teşhis
  const [diagDoctorId, setDiagDoctorId] = useState("");
  const [diagCode, setDiagCode] = useState("");
  const [diagCodeSearch, setDiagCodeSearch] = useState("");
  const [diagNote, setDiagNote] = useState("");
  const [showCodeDrop, setShowCodeDrop] = useState(false);
  const [savingDiag, setSavingDiag] = useState(false);

  // Tek seans
  const [treatItems, setTreatItems] = useState<
    { defId: string; name: string; price: number }[]
  >([]);
  const [newDefId, setNewDefId] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [savingTreat, setSavingTreat] = useState(false);

  // Tedavi planı builder
  const [planTitle, setPlanTitle] = useState("");
  const [planDoctorId, setPlanDoctorId] = useState("");
  const [planItems, setPlanItems] = useState<
    {
      defId: string;
      name: string;
      code?: string;
      price: number;
      duration: number;
      toothNumber?: number;
    }[]
  >([]);
  const [planNewDefId, setPlanNewDefId] = useState("");
  const [planNewPrice, setPlanNewPrice] = useState("");
  const [planNewTooth, setPlanNewTooth] = useState("");
  const [savingPlan, setSavingPlan] = useState(false);
  const [savedPlanId, setSavedPlanId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/patients/${patientId}`).then((r) => r.json()),
      fetch(`/api/patients/visit?patientId=${patientId}`).then((r) => r.json()),
      fetch("/api/doctors").then((r) => r.json()),
      fetch("/api/diagnosis-codes").then((r) => r.json()),
      fetch("/api/treatments").then((r) => r.json()),
    ]).then(([p, v, d, dc, t]) => {
      setPatient(p);
      const found = (v.visits || []).find((x: any) => x.id === visitId);
      if (found) {
        setVisit(found);
        const det = found.details || {};
        if (det.diagnosis) setDiagNote(det.diagnosis);
        if (det.diagnosisCode) {
          setDiagCode(det.diagnosisCode);
          setDiagCodeSearch(det.diagnosisCode);
        }
        if (det.diagnosisDoctorId) setDiagDoctorId(det.diagnosisDoctorId);
        if (det.treatments) setTreatItems(det.treatments);
      }
      setDoctors(d.doctors || []);
      if (d.doctors?.length && !diagDoctorId) {
        setDiagDoctorId(d.doctors[0].id);
        setPlanDoctorId(d.doctors[0].id);
      }
      setDiagCodes(dc.codes || []);
      setTreatments(t.treatments || []);
      setLoading(false);
    });
  }, [visitId, patientId]);

  const filteredCodes = diagCodes
    .filter(
      (c) =>
        c.code.toLowerCase().includes(diagCodeSearch.toLowerCase()) ||
        c.description.toLowerCase().includes(diagCodeSearch.toLowerCase()),
    )
    .slice(0, 6);

  async function saveDiagnosis() {
    if (!diagNote.trim() && !diagCode) return;
    setSavingDiag(true);
    const doctor = doctors.find((d) => d.id === diagDoctorId);
    const res = await fetch("/api/patients/visit", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitId,
        details: {
          diagnosis: diagNote,
          diagnosisCode: diagCode,
          diagnosisDoctorId: diagDoctorId,
          diagnosisDoctorName: doctor?.name || "",
          status: "diagnosed",
        },
      }),
    });
    if (res.ok) {
      const u = await res.json();
      setVisit(u);
      setPlanDoctorId(diagDoctorId); // teşhis hekimini plan hekimi olarak default al
      setStep("treatment_choice");
    }
    setSavingDiag(false);
  }

  async function saveTreatments() {
    if (treatItems.length === 0) return;
    setSavingTreat(true);
    for (const item of treatItems) {
      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          type: "CHARGE",
          amount: item.price,
          description: `${item.name}${diagCode ? ` (${diagCode})` : ""}`,
        }),
      });
    }
    await fetch("/api/patients/visit", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitId,
        details: { treatments: treatItems, status: "treated" },
      }),
    });
    setSavingTreat(false);
    openWindow(
      `finance-${patientId}`,
      `Cari Hesap — ${patientName}`,
      "payments",
    );
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  if (!visit)
    return (
      <div className="flex items-center justify-center h-full text-on-surface-variant">
        <p>Kayıt bulunamadı</p>
      </div>
    );

  const det = visit.details || {};
  const vstStatus = VISIT_STATUS[det.status || "open"];
  const isDiagnosed = !!(det.diagnosis || det.diagnosisCode);

  const inp =
    "w-full px-4 py-3 rounded-xl border border-outline-variant/30 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all";

  // ── ORTAK HEADER + TAB WRAPPER ────────────────────────
  const TABS = [
    { id: "diagnosis", label: "Teşhis & Tedavi", icon: "🔬" },
    { id: "dental", label: "Diş Haritası", icon: "🦷" },
    { id: "radiology", label: "Radyoloji", icon: "🩻" },
    { id: "medical", label: "Tıbbi Geçmiş", icon: "📋" },
  ];

  // Diş haritası ve radyoloji sekmeleri için tab değişince step'i sıfırla
  function switchTab(t: typeof tab) {
    setTab(t);
    if (t === "diagnosis") setStep("overview");
  }

  // ── DİŞ HARİTASI SEKMESİ ──────────────────────────────
  if (tab === "dental")
    return (
      <div className="flex flex-col h-full bg-surface">
        <TabHeader
          vstStatus={vstStatus}
          patientName={patientName}
          det={det}
          visit={visit}
          tabs={TABS}
          activeTab={tab}
          onTabChange={switchTab}
        />
        <div className="flex-1 overflow-y-auto p-5">
          <div className="bg-white rounded-2xl border border-outline-variant/15 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-on-surface">
                  Klinik Diş Haritası
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Diş seçin, sağ tıklayarak teşhis ve tedavi girişi yapın.
                </p>
              </div>
              <div className="flex gap-1.5 text-[10px] font-semibold">
                {[
                  [
                    "Sağlam",
                    "bg-surface-container-low border-outline-variant/20",
                    "",
                  ],
                  [
                    "Çürük",
                    "bg-error-container/30 text-error border-error/20",
                    "",
                  ],
                  [
                    "Dolgu",
                    "bg-primary-container/20 text-primary border-primary/20",
                    "",
                  ],
                  [
                    "İmplant",
                    "bg-violet-50 text-violet-600 border-violet-200",
                    "",
                  ],
                ].map(([l, c]) => (
                  <span key={l} className={`px-1.5 py-0.5 rounded border ${c}`}>
                    {l}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-surface-container-low/50 rounded-xl p-4">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-center mb-2">
                Üst Çene
              </p>
              <div className="flex justify-center gap-1 flex-wrap">
                {[
                  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27,
                  28,
                ].map((n) => (
                  <div
                    key={n}
                    className="w-9 h-12 rounded-lg border bg-surface-container-low text-on-surface-variant border-outline-variant/30 flex flex-col items-center justify-center text-[11px] font-bold cursor-pointer hover:scale-110 transition-all"
                  >
                    <span>{n}</span>
                    <span className="text-[10px]">🦷</span>
                  </div>
                ))}
              </div>
              <div className="h-3" />
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-center mb-2">
                Alt Çene
              </p>
              <div className="flex justify-center gap-1 flex-wrap">
                {[
                  48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37,
                  38,
                ].map((n) => (
                  <div
                    key={n}
                    className="w-9 h-12 rounded-lg border bg-surface-container-low text-on-surface-variant border-outline-variant/30 flex flex-col items-center justify-center text-[11px] font-bold cursor-pointer hover:scale-110 transition-all"
                  >
                    <span>{n}</span>
                    <span className="text-[10px]">🦷</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );

  // ── RADYOLOJİ SEKMESİ ─────────────────────────────────
  if (tab === "radiology")
    return (
      <div className="flex flex-col h-full bg-surface">
        <TabHeader
          vstStatus={vstStatus}
          patientName={patientName}
          det={det}
          visit={visit}
          tabs={TABS}
          activeTab={tab}
          onTabChange={switchTab}
        />
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-on-surface">Radyoloji Görüntüleri</h3>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold hover:brightness-110 transition-all shadow-sm">
              📤 Görüntü Yükle
            </button>
          </div>
          {patient?.radiologyImages?.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {patient.radiologyImages.map((img: any) => (
                <div
                  key={img.id}
                  className="bg-white rounded-2xl border border-outline-variant/15 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="h-32 bg-surface-container-low flex items-center justify-center">
                    <span className="text-4xl opacity-30">🩻</span>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-bold text-on-surface">
                      {img.fileName}
                    </p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      {new Date(img.createdAt).toLocaleDateString("tr-TR")} ·{" "}
                      {img.type}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <button className="text-[11px] text-primary font-bold hover:underline">
                        👁 Görüntüle
                      </button>
                      <button className="text-[11px] text-on-surface-variant font-bold hover:underline">
                        ⬇ İndir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-on-surface-variant/40 gap-3">
              <span className="text-5xl">🩻</span>
              <p className="text-sm">Henüz radyoloji görüntüsü yüklenmemiş</p>
              <button className="px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold hover:brightness-110 transition-all">
                📤 İlk Görüntüyü Yükle
              </button>
            </div>
          )}
        </div>
      </div>
    );

  // ── TIBBİ GEÇMİŞ SEKMESİ ──────────────────────────────
  if (tab === "medical")
    return (
      <div className="flex flex-col h-full bg-surface">
        <TabHeader
          vstStatus={vstStatus}
          patientName={patientName}
          det={det}
          visit={visit}
          tabs={TABS}
          activeTab={tab}
          onTabChange={switchTab}
        />
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {patient?.allergies?.length > 0 && (
            <div className="bg-white rounded-2xl border border-outline-variant/15 p-5">
              <h3 className="font-bold text-on-surface text-sm mb-3">
                ⚠️ Alerjiler
              </h3>
              <div className="flex flex-wrap gap-2">
                {patient.allergies.map((a: any) => (
                  <span
                    key={a.id}
                    className={`px-3 py-1.5 rounded-full text-sm font-bold border ${a.severity === "HIGH" ? "bg-error/10 text-error border-error/20" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                  >
                    {a.allergen}{" "}
                    <span className="text-[10px] opacity-70">
                      ({a.severity === "HIGH" ? "Yüksek" : "Orta"})
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
          {patient?.medications?.filter((m: any) => m.isActive).length > 0 && (
            <div className="bg-white rounded-2xl border border-outline-variant/15 p-5">
              <h3 className="font-bold text-on-surface text-sm mb-3">
                💊 Sürekli İlaçlar
              </h3>
              <div className="space-y-2">
                {patient.medications
                  .filter((m: any) => m.isActive)
                  .map((m: any) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-xl"
                    >
                      <div>
                        <p className="text-sm font-bold text-on-surface">
                          {m.name}
                        </p>
                        {m.dosage && (
                          <p className="text-xs text-on-surface-variant">
                            {m.dosage} {m.frequency && `· ${m.frequency}`}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        Aktif
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
          {!patient?.allergies?.length &&
            !patient?.medications?.filter((m: any) => m.isActive).length && (
              <div className="flex flex-col items-center justify-center h-40 text-on-surface-variant gap-2">
                <span className="text-4xl">🏥</span>
                <p className="text-sm">Kayıtlı tıbbi bilgi bulunmuyor.</p>
              </div>
            )}
        </div>
      </div>
    );

  // ── OVERVIEW ──────────────────────────────────────────
  if (step === "overview")
    return (
      <div className="flex flex-col h-full bg-surface">
        <TabHeader
          vstStatus={vstStatus}
          patientName={patientName}
          det={det}
          visit={visit}
          tabs={TABS}
          activeTab={tab}
          onTabChange={switchTab}
        />

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Aksiyon butonu — üstte */}
          {!isDiagnosed ? (
            <button
              onClick={() => setStep("diagnosis")}
              className="w-full py-3 rounded-2xl bg-amber-500 text-white font-bold text-sm hover:brightness-110 transition-all shadow-md flex items-center justify-center gap-2"
            >
              🔬 Teşhis Ekle
            </button>
          ) : det.status === "diagnosed" ? (
            <button
              onClick={() => setStep("treatment_choice")}
              className="w-full py-3 rounded-2xl bg-primary text-on-primary font-bold text-sm hover:brightness-110 transition-all shadow-md flex items-center justify-center gap-2"
            >
              💊 Tedavi Seçenekleri
            </button>
          ) : (
            <button
              onClick={() => setStep("diagnosis")}
              className="w-full py-2.5 rounded-2xl border border-outline-variant/30 text-on-surface-variant font-semibold text-sm hover:bg-surface-container transition-all"
            >
              ✏️ Teşhisi Güncelle
            </button>
          )}

          {/* Geliş nedeni */}
          <div className="bg-white rounded-2xl border border-outline-variant/15 p-5">
            <p className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest mb-2">
              Geliş Nedeni
            </p>
            <p className="text-base text-on-surface">{det.reason || "—"}</p>
          </div>

          {/* Teşhis özeti */}
          {isDiagnosed && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
              <p className="text-[11px] font-black text-amber-700 uppercase tracking-widest mb-2">
                Teşhis
              </p>
              {det.diagnosisCode && (
                <span className="inline-block font-mono text-sm font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg mb-2">
                  {det.diagnosisCode}
                </span>
              )}
              {det.diagnosis && (
                <p className="text-sm text-on-surface">{det.diagnosis}</p>
              )}
              {det.diagnosisDoctorName && (
                <p className="text-xs text-amber-700 mt-1.5">
                  Hekim: {det.diagnosisDoctorName}
                </p>
              )}
            </div>
          )}

          {/* Tedavi özeti */}
          {det.treatments?.length > 0 && (
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5">
              <p className="text-[11px] font-black text-emerald-700 uppercase tracking-widest mb-3">
                Yapılan İşlemler
              </p>
              <div className="space-y-2">
                {det.treatments.map((t: any, i: number) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-sm text-on-surface">{t.name}</span>
                    <span className="text-sm font-bold text-emerald-700">
                      {Number(t.price).toLocaleString("tr-TR")} ₺
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tıbbi geçmiş */}
          {(patient?.allergies?.length > 0 ||
            patient?.medications?.length > 0) && (
            <div className="bg-white rounded-2xl border border-outline-variant/15 p-5">
              <p className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest mb-3">
                Tıbbi Geçmiş
              </p>
              {patient.allergies?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {patient.allergies.map((a: any) => (
                    <span
                      key={a.id}
                      className="px-2.5 py-1 rounded-full text-xs font-bold bg-error/10 text-error border border-error/20"
                    >
                      ⚠ {a.allergen}
                    </span>
                  ))}
                </div>
              )}
              {patient.medications
                ?.filter((m: any) => m.isActive)
                .map((m: any) => (
                  <div key={m.id} className="text-xs text-on-surface-variant">
                    💊 {m.name} {m.dosage && `— ${m.dosage}`}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    );

  // ── TEŞHİS ────────────────────────────────────────────
  if (step === "diagnosis")
    return (
      <div className="flex flex-col h-full bg-surface">
        <div className="px-6 py-4 bg-white border-b border-outline-variant/15 shrink-0 flex items-center gap-3">
          <button
            onClick={() => setStep("overview")}
            className="p-2 hover:bg-surface-container rounded-xl transition-colors"
          >
            ‹
          </button>
          <div>
            <h2 className="font-bold text-on-surface">Teşhis Girişi</h2>
            <p className="text-xs text-on-surface-variant">{patientName}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Hekim */}
          <div>
            <label className="text-sm font-bold text-on-surface block mb-2">
              Teşhisi Koyan Hekim
            </label>
            <select
              value={diagDoctorId}
              onChange={(e) => setDiagDoctorId(e.target.value)}
              className={inp}
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* ICD-10 */}
          <div>
            <label className="text-sm font-bold text-on-surface block mb-2">
              ICD-10 Tanı Kodu{" "}
              <span className="text-on-surface-variant font-normal text-xs">
                (opsiyonel)
              </span>
            </label>
            <div className="relative">
              <input
                value={diagCodeSearch}
                onChange={(e) => {
                  setDiagCodeSearch(e.target.value);
                  setShowCodeDrop(true);
                  setDiagCode("");
                }}
                onFocus={() => setShowCodeDrop(true)}
                placeholder="Kod veya açıklama ara... (ör: K02.1)"
                className={inp}
              />
              {showCodeDrop &&
                diagCodeSearch.length >= 1 &&
                filteredCodes.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-outline-variant/20 rounded-2xl shadow-xl z-20 overflow-hidden">
                    {filteredCodes.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setDiagCode(c.code);
                          setDiagCodeSearch(`${c.code} — ${c.description}`);
                          setShowCodeDrop(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container-low text-left border-b border-outline-variant/10 last:border-0"
                      >
                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg shrink-0">
                          {c.code}
                        </span>
                        <span className="text-sm text-on-surface">
                          {c.description}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
            </div>
            {diagCode && (
              <div className="mt-2 flex items-center gap-2 text-primary">
                <span className="text-sm">✓</span>
                <span className="text-sm font-semibold">
                  {diagCode} seçildi
                </span>
              </div>
            )}
          </div>

          {/* Teşhis notu */}
          <div>
            <label className="text-sm font-bold text-on-surface block mb-2">
              Klinik Bulgu / Teşhis Notu
            </label>
            <textarea
              value={diagNote}
              onChange={(e) => setDiagNote(e.target.value)}
              rows={5}
              placeholder="Klinik bulgular, hastanın şikayeti, muayene bulguları..."
              className={`${inp} resize-none`}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-outline-variant/10 bg-white shrink-0">
          <button
            onClick={saveDiagnosis}
            disabled={savingDiag || (!diagNote.trim() && !diagCode)}
            className="w-full py-3.5 rounded-2xl bg-amber-500 text-white font-bold text-base hover:brightness-110 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {savingDiag ? "Kaydediliyor..." : "🔬 Teşhisi Kaydet ve Devam Et →"}
          </button>
        </div>
      </div>
    );

  // ── TEDAVİ KARARI ─────────────────────────────────────
  if (step === "treatment_choice")
    return (
      <div className="flex flex-col h-full bg-surface">
        <div className="px-6 py-4 bg-white border-b border-outline-variant/15 shrink-0 flex items-center gap-3">
          <button
            onClick={() => setStep("overview")}
            className="p-2 hover:bg-surface-container rounded-xl transition-colors"
          >
            ‹
          </button>
          <div>
            <h2 className="font-bold text-on-surface">Tedavi Seçeneği</h2>
            <p className="text-xs text-on-surface-variant">{patientName}</p>
          </div>
        </div>

        {/* Teşhis özeti */}
        <div className="px-6 pt-4 shrink-0">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">
              Teşhis
            </p>
            {det.diagnosisCode && (
              <span className="font-mono text-xs font-bold text-primary">
                {det.diagnosisCode} ·{" "}
              </span>
            )}
            <span className="text-sm text-on-surface">
              {det.diagnosis || "—"}
            </span>
          </div>
        </div>

        <div className="flex-1 px-6 py-5 space-y-4">
          <p className="text-sm text-on-surface-variant">
            Tedavi türünü seçin:
          </p>

          <button
            onClick={() => setStep("single_session")}
            className="w-full flex items-center gap-5 p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-all text-left"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0 text-3xl">
              ⚡
            </div>
            <div>
              <p className="font-bold text-on-surface text-base">
                Tek Seans Tedavi
              </p>
              <p className="text-sm text-on-surface-variant mt-1">
                Tedavi bugün tamamlandı. İşlemler cari hesaba işlenir.
              </p>
            </div>
          </button>

          <button
            onClick={() => setStep("plan_builder")}
            className="w-full flex items-center gap-5 p-5 rounded-2xl border-2 border-primary/20 bg-primary-container/5 hover:bg-primary-container/10 transition-all text-left"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary-container/20 flex items-center justify-center shrink-0 text-3xl">
              📋
            </div>
            <div>
              <p className="font-bold text-on-surface text-base">
                Tedavi Planı Oluştur
              </p>
              <p className="text-sm text-on-surface-variant mt-1">
                Birden fazla seans. İşlemler, ücretler ve randevular planlanır.
              </p>
            </div>
          </button>
        </div>
      </div>
    );

  // ── TEK SEANS ─────────────────────────────────────────
  if (step === "single_session")
    return (
      <div className="flex flex-col h-full bg-surface">
        <div className="px-6 py-4 bg-white border-b border-outline-variant/15 shrink-0 flex items-center gap-3">
          <button
            onClick={() => setStep("treatment_choice")}
            className="p-2 hover:bg-surface-container rounded-xl transition-colors"
          >
            ‹
          </button>
          <div>
            <h2 className="font-bold text-on-surface">Tek Seans Tedavi</h2>
            <p className="text-xs text-on-surface-variant">{patientName}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Eklenen işlemler */}
          {treatItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-outline-variant/15 overflow-hidden">
              {treatItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant/8 last:border-0"
                >
                  <span className="flex-1 text-sm font-semibold text-on-surface">
                    {item.name}
                  </span>
                  <span className="text-sm font-bold text-primary">
                    {item.price.toLocaleString("tr-TR")} ₺
                  </span>
                  <button
                    onClick={() =>
                      setTreatItems((prev) => prev.filter((_, j) => j !== i))
                    }
                    className="w-7 h-7 rounded-lg hover:bg-error/10 text-error flex items-center justify-center transition-colors text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="flex justify-between items-center px-4 py-3 bg-surface-container-low">
                <span className="text-sm font-bold text-on-surface-variant">
                  Toplam
                </span>
                <span className="text-lg font-black text-primary">
                  {treatItems
                    .reduce((s, i) => s + i.price, 0)
                    .toLocaleString("tr-TR")}{" "}
                  ₺
                </span>
              </div>
            </div>
          )}

          {/* Yeni işlem ekle */}
          <div className="bg-white rounded-2xl border border-outline-variant/15 p-4 space-y-3">
            <p className="text-sm font-bold text-on-surface">İşlem Ekle</p>
            <select
              value={newDefId}
              onChange={(e) => {
                setNewDefId(e.target.value);
                const t = treatments.find((t) => t.id === e.target.value);
                if (t) setNewPrice(String(t.price));
              }}
              className={inp}
            >
              <option value="">İşlem seçin...</option>
              {treatments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.code ? ` (${t.code})` : ""}
                </option>
              ))}
            </select>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                  Ücret (₺)
                </label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="0.00"
                  className={inp}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    if (!newDefId) return;
                    const t = treatments.find((t) => t.id === newDefId);
                    setTreatItems((prev) => [
                      ...prev,
                      {
                        defId: newDefId,
                        name: t?.name || "",
                        price: parseFloat(newPrice) || t?.price || 0,
                      },
                    ]);
                    setNewDefId("");
                    setNewPrice("");
                  }}
                  className="px-5 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm hover:brightness-110 transition-all"
                >
                  + Ekle
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-outline-variant/10 bg-white shrink-0">
          <button
            onClick={saveTreatments}
            disabled={savingTreat || treatItems.length === 0}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-base hover:brightness-110 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {savingTreat ? "Kaydediliyor..." : "💰 Kaydet ve Cari Hesaba İşle"}
          </button>
        </div>
      </div>
    );

  // ── TEDAVİ PLANI BUILDER ─────────────────────────────────
  if (step === "plan_builder") {
    const selectedTreatment = treatments.find((t) => t.id === planNewDefId);

    function addPlanItem() {
      if (!planNewDefId) return;
      const t = treatments.find((t) => t.id === planNewDefId);
      if (!t) return;
      setPlanItems((prev) => [
        ...prev,
        {
          defId: planNewDefId,
          name: t.name,
          code: t.code,
          price: parseFloat(planNewPrice) || t.price || 0,
          duration: t.duration || 30,
          toothNumber: planNewTooth ? parseInt(planNewTooth) : undefined,
        },
      ]);
      setPlanNewDefId("");
      setPlanNewPrice("");
      setPlanNewTooth("");
    }

    async function savePlanAndSchedule() {
      if (planItems.length === 0) return;
      setSavingPlan(true);
      try {
        const res = await fetch("/api/treatment-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId,
            doctorId: planDoctorId,
            title: planTitle || "Tedavi Planı",
            items: planItems.map((i) => ({
              treatmentDefId: i.defId,
              toothNumber: i.toothNumber,
              quantity: 1,
              unitPrice: i.price,
              discount: 0,
            })),
          }),
        });
        if (res.ok) {
          const plan = await res.json();
          setSavedPlanId(plan.id);
          setStep("plan_scheduler");
        }
      } finally {
        setSavingPlan(false);
      }
    }

    return (
      <div className="flex flex-col h-full bg-surface-container-low/30">
        {/* Header — belirgin geri butonu */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-outline-variant/15 shrink-0">
          <button
            onClick={() => setStep("treatment_choice")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors text-sm font-semibold text-on-surface-variant border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            Geri
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-on-surface text-sm">Tedavi Planı</h2>
            <p className="text-xs text-on-surface-variant">{patientName}</p>
          </div>
          <button
            onClick={savePlanAndSchedule}
            disabled={savingPlan || planItems.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold hover:brightness-110 transition-all disabled:opacity-40"
          >
            {savingPlan ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
            ) : (
              <span className="material-symbols-outlined text-[18px]">
                calendar_month
              </span>
            )}
            {savingPlan ? "..." : "Randevu Zamanla"}
          </button>
        </div>

        {/* İki kolon layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* SOL: Plan meta + işlem listesi */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-outline-variant/15">
            {/* Plan başlığı + hekim — kompakt */}
            <div className="px-3 py-2.5 bg-white border-b border-outline-variant/10 flex items-center gap-2">
              <input
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
                placeholder="Plan başlığı..."
                className="flex-1 px-3 py-1.5 rounded-lg border border-outline-variant/30 text-sm focus:border-primary outline-none"
              />
              <select
                value={planDoctorId}
                onChange={(e) => setPlanDoctorId(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-outline-variant/30 text-sm focus:border-primary outline-none bg-white max-w-[140px]"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* İşlem listesi */}
            <div className="flex-1 overflow-y-auto">
              {planItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-on-surface-variant/40 gap-2 p-6">
                  <span className="text-4xl">��</span>
                  <p className="text-sm text-center">
                    Sağ panelden işlem seçin
                  </p>
                </div>
              ) : (
                <div className="p-3 space-y-1.5">
                  {planItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-outline-variant/15 group"
                    >
                      <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-on-surface truncate">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant">
                          {item.code && (
                            <span className="font-mono bg-surface-container px-1 rounded">
                              {item.code}
                            </span>
                          )}
                          {item.toothNumber && (
                            <span>🦷{item.toothNumber}</span>
                          )}
                          <span>⏱{item.duration}dk</span>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-bold shrink-0 ${item.price > 0 ? "text-primary" : "text-outline"}`}
                      >
                        {item.price > 0
                          ? `${item.price.toLocaleString("tr-TR")}₺`
                          : "—"}
                      </span>
                      <button
                        onClick={() =>
                          setPlanItems((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        className="w-5 h-5 rounded opacity-0 group-hover:opacity-100 hover:bg-error/10 text-error flex items-center justify-center transition-all text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Toplam */}
            {planItems.length > 0 && (
              <div className="px-3 py-2 bg-white border-t border-outline-variant/10 flex items-center justify-between shrink-0">
                <span className="text-xs text-on-surface-variant">
                  {planItems.length} işlem
                </span>
                <span className="text-sm font-black text-primary">
                  {planItems
                    .reduce((s, i) => s + i.price, 0)
                    .toLocaleString("tr-TR")}{" "}
                  ₺
                </span>
              </div>
            )}
          </div>

          {/* SAĞ: Hızlı işlem ekleme — tıkla ekle */}
          <div className="w-52 flex flex-col bg-white shrink-0">
            <div className="px-3 py-2 border-b border-outline-variant/10">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                İşlem Seç
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
              {treatments.map((t) => {
                const isSelected = planNewDefId === t.id;
                const alreadyAdded = planItems.some((p) => p.defId === t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (isSelected) {
                        setPlanNewDefId("");
                        setPlanNewPrice("");
                      } else {
                        setPlanNewDefId(t.id);
                        setPlanNewPrice(String(t.price || ""));
                      }
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl transition-all ${
                      isSelected
                        ? "bg-primary text-on-primary"
                        : alreadyAdded
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "hover:bg-surface-container-low text-on-surface border border-transparent hover:border-outline-variant/20"
                    }`}
                  >
                    <p className="text-xs font-semibold truncate">{t.name}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      {t.code && (
                        <span
                          className={`text-[10px] font-mono ${isSelected ? "text-white/70" : "text-outline"}`}
                        >
                          {t.code}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold ml-auto ${isSelected ? "text-white/80" : "text-primary"}`}
                      >
                        {t.price > 0
                          ? `${t.price.toLocaleString("tr-TR")}₺`
                          : "—"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Seçili işlem detay + ekle */}
            {selectedTreatment && (
              <div className="p-2.5 border-t border-outline-variant/10 space-y-2 bg-surface-container-low/50 shrink-0">
                <p className="text-[11px] font-bold text-on-surface truncate">
                  {selectedTreatment.name}
                </p>
                <div className="flex gap-1.5">
                  <div className="flex-1">
                    <label className="text-[9px] text-outline block mb-0.5">
                      Ücret ₺
                    </label>
                    <input
                      type="number"
                      value={planNewPrice}
                      onChange={(e) => setPlanNewPrice(e.target.value)}
                      placeholder={String(selectedTreatment.price || "0")}
                      className="w-full px-2 py-1.5 rounded-lg border border-outline-variant/30 text-xs focus:border-primary outline-none"
                    />
                  </div>
                  <div className="w-14">
                    <label className="text-[9px] text-outline block mb-0.5">
                      Diş No
                    </label>
                    <input
                      type="number"
                      value={planNewTooth}
                      onChange={(e) => setPlanNewTooth(e.target.value)}
                      placeholder="—"
                      min="11"
                      max="48"
                      className="w-full px-2 py-1.5 rounded-lg border border-outline-variant/30 text-xs focus:border-primary outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={addPlanItem}
                  className="w-full py-2 rounded-xl bg-primary text-on-primary font-bold text-xs hover:brightness-110 transition-all flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    add
                  </span>
                  Listeye Ekle
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── TEDAVİ PLANI RANDEVU ZAMANLAYICI ─────────────────────
  if (step === "plan_scheduler") {
    const schedulerItems = planItems.map((item) => ({
      id: item.defId,
      name: item.name,
      code: item.code,
      duration: item.duration,
      unitPrice: item.price,
      toothNumber: item.toothNumber,
    }));

    const planDoctor = doctors.find((d) => d.id === planDoctorId);

    async function handleSchedulerSave(
      scheduled: {
        itemId: string;
        date: string;
        startTime: string;
        endTime: string;
      }[],
    ) {
      for (const s of scheduled) {
        const item = planItems.find((p) => p.defId === s.itemId);
        await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId,
            doctorId: planDoctorId,
            chairNo: 1,
            startTime: `${s.date}T${s.startTime}:00`,
            endTime: `${s.date}T${s.endTime}:00`,
            type: item?.name || "Tedavi",
            source: "MANUAL",
          }),
        });
      }
      await fetch("/api/patients/visit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitId,
          details: { status: "planned", treatmentPlanId: savedPlanId },
        }),
      });
      const vRes = await fetch(`/api/patients/visit?patientId=${patientId}`);
      const vData = await vRes.json();
      const found = (vData.visits || []).find((x: any) => x.id === visitId);
      if (found) setVisit(found);
      setStep("overview");
    }

    return (
      <TreatmentPlanScheduler
        patientId={patientId}
        patientName={patientName}
        doctorId={planDoctorId}
        doctorName={planDoctor?.name || ""}
        planItems={schedulerItems}
        onSave={handleSchedulerSave}
        onCancel={() => setStep("plan_builder")}
      />
    );
  }

  return null;
}

// ── Ortak Tab Header ──────────────────────────────────────
function TabHeader({
  vstStatus,
  patientName,
  det,
  visit,
  tabs,
  activeTab,
  onTabChange,
}: {
  vstStatus: { label: string; color: string };
  patientName: string;
  det: any;
  visit: any;
  tabs: { id: string; label: string; icon: string }[];
  activeTab: string;
  onTabChange: (t: any) => void;
}) {
  return (
    <div className="bg-white border-b border-outline-variant/15 shrink-0">
      <div className="px-5 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center font-bold text-sm text-primary shrink-0">
          {patientName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-on-surface text-sm">
              {patientName}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${vstStatus.color}`}
            >
              {vstStatus.label}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant">
            {det.visitDate
              ? new Date(det.visitDate).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : new Date(visit.createdAt).toLocaleDateString("tr-TR")}
            {det.reason &&
              ` · ${det.reason.slice(0, 40)}${det.reason.length > 40 ? "..." : ""}`}
          </p>
        </div>
      </div>
      <nav className="flex px-5 gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
