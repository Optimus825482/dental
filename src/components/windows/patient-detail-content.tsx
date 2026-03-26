"use client";
import { useState, useEffect } from "react";
import { TOOTH_NUMBERS } from "@/lib/constants";
import { useWindowStore } from "@/stores/window-store";
import { DiagnosisTreatmentDialog } from "./diagnosis-treatment-dialog";
interface PD {
  id: string;
  patientNo: string;
  firstName: string;
  lastName: string;
  tcKimlik?: string;
  phone: string;
  email?: string;
  birthDate?: string;
  gender?: string;
  bloodType?: string;
  allergies: { id: string; allergen: string; severity: string }[];
  account?: { balance: number };
  dentalChart: { toothNumber: number; condition: string }[];
  appointments: {
    id: string;
    startTime: string;
    status: string;
    type?: string;
    doctor: { name: string };
  }[];
}
const TABS = [
  { id: "info", label: "Kişisel Bilgiler", icon: "person" },
  { id: "medical", label: "Tıbbi Geçmiş", icon: "medical_information" },
  { id: "treatments", label: "Tedaviler & Diş Haritası", icon: "dentistry" },
  { id: "radiology", label: "Radyoloji", icon: "radiology" },
  { id: "documents", label: "Belgeler", icon: "description" },
];
const TC: Record<string, string> = {
  HEALTHY:
    "bg-surface-container-low text-on-surface-variant border-outline-variant/30",
  FILLING_NEEDED: "bg-error-container/30 text-error border-error/30",
  FILLED: "bg-primary-container/20 text-primary border-primary/30",
  ROOT_CANAL: "bg-amber-50 text-amber-700 border-amber-300",
  EXTRACTION: "bg-rose-50 text-rose-600 border-rose-300",
  IMPLANT: "bg-violet-50 text-violet-600 border-violet-300",
};
export function PatientDetailContent({ patientId }: { patientId: string }) {
  const [p, setP] = useState<PD | null>(null);
  const [ld, setLd] = useState(true);
  const [tab, setTab] = useState("info");
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [ts, setTs] = useState<Record<number, string>>({});
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { openWindow } = useWindowStore();
  useEffect(() => {
    fetch(`/api/patients/${patientId}`)
      .then((r) => r.json())
      .then((d) => {
        setP(d);
        const s: Record<number, string> = {};
        d.dentalChart?.forEach((x: any) => {
          s[x.toothNumber] = x.condition;
        });
        setTs(s);
        setLd(false);
      })
      .catch(() => setLd(false));
  }, [patientId]);
  if (ld)
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  if (!p)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <span className="material-symbols-outlined text-4xl text-outline">
          error
        </span>
        <p className="font-headline font-bold">Hasta bulunamadı</p>
      </div>
    );
  const age = p.birthDate
    ? Math.floor((Date.now() - new Date(p.birthDate).getTime()) / 31557600000)
    : null;
  const g =
    p.gender === "MALE" ? "Erkek" : p.gender === "FEMALE" ? "Kadın" : "";
  function tog(n: number, e: React.MouseEvent) {
    const nx = new Set(sel);
    if (e.ctrlKey || e.metaKey) {
      nx.has(n) ? nx.delete(n) : nx.add(n);
    } else {
      if (nx.size === 1 && nx.has(n)) nx.clear();
      else {
        nx.clear();
        nx.add(n);
      }
    }
    setSel(nx);
  }
  function rctx(e: React.MouseEvent, n: number) {
    e.preventDefault();
    e.stopPropagation();
    if (!sel.has(n)) setSel(new Set([n]));
    setCtx({ x: e.clientX, y: e.clientY });
  }
  function tooth(n: number, i: number) {
    const isSel = sel.has(n);
    const st = ts[n] || "HEALTHY";
    return (
      <div key={n} className="flex">
        {i === 8 && <div className="w-3" />}
        <button
          onClick={(e) => tog(n, e)}
          onContextMenu={(e) => rctx(e, n)}
          className={`w-9 h-12 rounded-lg border flex flex-col items-center justify-center text-[11px] font-bold transition-all hover:scale-110 active:scale-90 ${TC[st] || TC.HEALTHY} ${isSel ? "ring-2 ring-primary ring-offset-1 scale-105" : ""}`}
        >
          <span>{n}</span>
          <span className="material-symbols-outlined text-[12px] opacity-70">
            dentistry
          </span>
        </button>
      </div>
    );
  }
  const uT = [...TOOTH_NUMBERS.upperRight, ...TOOTH_NUMBERS.upperLeft];
  const lT = [...TOOTH_NUMBERS.lowerRight, ...TOOTH_NUMBERS.lowerLeft];
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* HEADER */}
      <div className="bg-white border-b border-outline-variant/15 shrink-0">
        <div className="flex gap-5 p-5">
          {/* Avatar / Fotoğraf */}
          <div className="w-20 h-20 rounded-2xl bg-primary-container/20 flex items-center justify-center font-bold text-2xl text-primary font-headline shrink-0 border-2 border-primary/10 overflow-hidden">
            {p.firstName?.[0]}
            {p.lastName?.[0]}
          </div>

          {/* Temel bilgiler */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-headline font-bold text-on-surface">
                {p.firstName} {p.lastName}
              </h2>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase shrink-0">
                Aktif Hasta
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-on-surface-variant">
              {p.tcKimlik && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-outline">
                    badge
                  </span>
                  TC: {p.tcKimlik}
                </span>
              )}
              {p.birthDate && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-outline">
                    cake
                  </span>
                  {new Date(p.birthDate).toLocaleDateString("tr-TR")}{" "}
                  {age !== null && `(${age} Yaş)`}
                </span>
              )}
              {p.phone && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-outline">
                    call
                  </span>
                  {p.phone}
                </span>
              )}
              {p.email && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-outline">
                    mail
                  </span>
                  {p.email}
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-outline">
                  tag
                </span>
                {p.patientNo}
              </span>
            </div>
          </div>

          {/* Hızlı işlemler */}
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={() =>
                openWindow(
                  `treatment-plan-${patientId}`,
                  `Tedavi Planı — ${p.firstName} ${p.lastName}`,
                  "assignment",
                )
              }
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:brightness-110 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">
                assignment
              </span>
              Tedavi Planı
            </button>
            <button
              onClick={() =>
                openWindow(
                  `finance-${patientId}`,
                  `Cari Hesap — ${p.firstName} ${p.lastName}`,
                  "payments",
                )
              }
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:brightness-110 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">
                payments
              </span>
              Cari Hesap
            </button>
            <button
              onClick={() =>
                openWindow("calendar", "Randevu Takvimi", "calendar_month")
              }
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-outline-variant/30 text-on-surface-variant text-xs font-bold hover:bg-surface-container transition-all"
            >
              <span className="material-symbols-outlined text-sm">
                event_available
              </span>
              Randevu
            </button>
          </div>
        </div>

        {/* Kritik alerji uyarısı */}
        {p.allergies.length > 0 && (
          <div className="mx-5 mb-4 p-3 bg-error/5 border border-error/20 rounded-xl flex items-start gap-3">
            <span
              className="material-symbols-outlined text-error text-xl shrink-0"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              warning
            </span>
            <div>
              <p className="text-sm font-bold text-error">
                KRİTİK ALERJİ UYARISI
              </p>
              <p className="text-xs text-error/80 mt-0.5">
                Hastanın{" "}
                <strong>{p.allergies.map((a) => a.allergen).join(", ")}</strong>{" "}
                grubuna karşı yüksek hassasiyeti bulunmaktadır. Reçete
                oluştururken dikkat edilmelidir.
              </p>
            </div>
          </div>
        )}
      </div>
      {/* TABS */}
      <div className="border-b border-outline-variant/15 bg-white px-5 shrink-0">
        <nav className="flex gap-4 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`py-3 border-b-2 text-[13px] font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${tab === t.id ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"}`}
            >
              <span className="material-symbols-outlined text-base">
                {t.icon}
              </span>
              {t.label}
              {t.id === "documents" && (
                <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 bg-primary-container/20 text-primary rounded-full">
                  OCR
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto">
        {/* ── KİŞİSEL BİLGİLER ── */}
        {tab === "info" && (
          <div className="p-5 grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-outline-variant/15 p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary">
                  info
                </span>
                <h3 className="font-bold text-on-surface">İletişim & Adres</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">E-Posta</span>
                  <span className="font-medium text-on-surface">
                    {p.email || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Telefon</span>
                  <span className="font-medium text-on-surface">{p.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Cinsiyet</span>
                  <span className="font-medium text-on-surface">
                    {g || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Kan Grubu</span>
                  <span className="font-medium text-on-surface">
                    {p.bloodType || "—"}
                  </span>
                </div>
                {(p as any).address && (
                  <div>
                    <span className="text-on-surface-variant block mb-1">
                      Adres
                    </span>
                    <span className="font-medium text-on-surface">
                      {(p as any).address}
                    </span>
                  </div>
                )}
                {(p as any).emergencyContact && (
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">
                      Yakın Bilgisi
                    </span>
                    <span className="font-medium text-on-surface">
                      {(p as any).emergencyContact}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-outline-variant/15 p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary">
                  description
                </span>
                <h3 className="font-bold text-on-surface">Belgeler</h3>
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 bg-primary-container/20 text-primary rounded-full">
                  OCR AKTİF
                </span>
              </div>
              <div className="space-y-2">
                {(p as any).documents?.length > 0 ? (
                  (p as any).documents.slice(0, 4).map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-container-low transition-colors"
                    >
                      <span className="material-symbols-outlined text-error text-lg">
                        picture_as_pdf
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-on-surface truncate">
                          {doc.fileName}
                        </p>
                        <p className="text-[10px] text-on-surface-variant">
                          {new Date(doc.createdAt).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                      <button className="p-1 hover:bg-surface-container rounded-lg text-outline hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-sm">
                          download
                        </span>
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-on-surface-variant text-center py-4">
                    Henüz belge yüklenmemiş.
                  </p>
                )}
                <button className="w-full mt-2 py-2 border-2 border-dashed border-outline-variant/30 rounded-xl text-xs font-semibold text-on-surface-variant hover:border-primary/30 hover:text-primary transition-colors flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-sm">add</span>
                  Yeni Belge Yükle
                </button>
              </div>
            </div>

            {(p as any).notes && (
              <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-amber-600">
                    sticky_note_2
                  </span>
                  <h3 className="font-bold text-amber-800 text-sm">
                    Hasta Notu
                  </h3>
                </div>
                <p className="text-sm text-amber-700">{(p as any).notes}</p>
              </div>
            )}
          </div>
        )}

        {/* ── TIBBİ GEÇMİŞ ── */}
        {tab === "medical" && (
          <div className="p-5 space-y-4">
            {p.allergies.length > 0 && (
              <div className="bg-white rounded-2xl border border-outline-variant/15 p-5">
                <h3 className="font-bold text-on-surface mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-error">
                    warning
                  </span>
                  Alerjiler
                </h3>
                <div className="flex flex-wrap gap-2">
                  {p.allergies.map((a) => (
                    <span
                      key={a.id}
                      className={`px-3 py-1.5 rounded-full text-sm font-bold border ${a.severity === "HIGH" ? "bg-error/10 text-error border-error/20" : a.severity === "MEDIUM" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-surface-container text-on-surface-variant border-outline-variant/30"}`}
                    >
                      {a.allergen}
                      <span className="ml-1 text-[10px] opacity-70">
                        (
                        {a.severity === "HIGH"
                          ? "Yüksek"
                          : a.severity === "MEDIUM"
                            ? "Orta"
                            : "Düşük"}
                        )
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {(p as any).medications?.length > 0 && (
              <div className="bg-white rounded-2xl border border-outline-variant/15 p-5">
                <h3 className="font-bold text-on-surface mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    medication
                  </span>
                  Sürekli Kullanılan İlaçlar
                </h3>
                <div className="space-y-2">
                  {(p as any).medications.map((m: any) => (
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
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.isActive ? "bg-emerald-100 text-emerald-700" : "bg-surface-container text-on-surface-variant"}`}
                      >
                        {m.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {p.allergies.length === 0 && !(p as any).medications?.length && (
              <div className="flex flex-col items-center justify-center h-40 text-on-surface-variant gap-2">
                <span className="material-symbols-outlined text-4xl">
                  health_and_safety
                </span>
                <p className="text-sm">Kayıtlı tıbbi bilgi bulunmuyor.</p>
              </div>
            )}
          </div>
        )}

        {tab === "treatments" && (
          <div className="flex h-full">
            <div className="flex-1 p-5 space-y-4 overflow-y-auto">
              <div className="bg-white rounded-2xl border border-outline-variant/15 p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-headline font-bold text-on-surface">
                      Klinik Diş Haritası
                    </h3>
                    <p className="text-[12px] text-on-surface-variant mt-0.5">
                      Diş seçin, sağ tıklayarak teşhis ve tedavi girişi yapın.
                      Ctrl+tık ile çoklu seçim.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold">
                    <span className="px-1.5 py-0.5 rounded bg-surface-container-low border border-outline-variant/20">
                      Sağlam
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-error-container/30 text-error border border-error/20">
                      Çürük
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-primary-container/20 text-primary border border-primary/20">
                      Dolgu
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 border border-violet-200">
                      İmplant
                    </span>
                  </div>
                </div>
                <div className="bg-surface-container-low/50 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-center mb-2">
                    Üst Çene
                  </p>
                  <div className="flex justify-center gap-1">
                    {uT.map((n, i) => tooth(n, i))}
                  </div>
                  <div className="h-3" />
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-center mb-2">
                    Alt Çene
                  </p>
                  <div className="flex justify-center gap-1">
                    {lT.map((n, i) => tooth(n, i))}
                  </div>
                </div>
                {sel.size > 0 && (
                  <div className="mt-3 bg-primary-container/10 rounded-xl p-3 flex items-center gap-3 border border-primary/10">
                    <div className="flex gap-1">
                      {[...sel].map((n) => (
                        <span
                          key={n}
                          className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-bold text-primary border border-primary/20 text-[11px]"
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-on-surface">
                        Seçili: {sel.size} diş
                      </p>
                      <p className="text-[11px] text-on-surface-variant">
                        Sağ tıklayarak teşhis ve tedavi girişi yapın
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {/* Teşhis/Tedavi Dialog — inline değil, modal */}
            </div>
            {/* Sağ: Tedavi Geçmişi */}
            <div className="w-64 border-l border-outline-variant/10 p-5 overflow-y-auto shrink-0 bg-white">
              <h3 className="font-headline font-bold text-on-surface mb-4">
                Tedavi Geçmişi
              </h3>
              {p.appointments.length === 0 ? (
                <p className="text-sm text-on-surface-variant">
                  Henüz işlem kaydı yok.
                </p>
              ) : (
                <div className="relative pl-5 space-y-4 before:absolute before:left-[9px] before:top-1 before:bottom-1 before:w-0.5 before:bg-outline-variant/20">
                  {p.appointments.map((a) => (
                    <div key={a.id} className="relative">
                      <div className="absolute -left-[11px] top-1 w-4 h-4 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[8px] text-emerald-600">
                          check
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-on-surface-variant">
                          {new Date(a.startTime).toLocaleDateString("tr-TR")}
                        </p>
                        <p className="text-sm font-bold text-on-surface">
                          {a.type || "Randevu"}
                        </p>
                        <p className="text-[11px] text-on-surface-variant">
                          {a.doctor.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {tab === "radiology" && (
          <div className="p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-headline font-bold text-on-surface">
                Radyoloji Görüntüleri
              </h3>
              <button className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-sm flex items-center gap-2 shadow-md hover:brightness-110 transition-all">
                <span className="material-symbols-outlined text-sm">
                  upload
                </span>
                Görüntü Yükle
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  name: "Panoramik Röntgen",
                  date: "15.03.2026",
                  size: "4.2 MB",
                  type: "panoramik",
                },
                {
                  name: "Periapikal - Diş 16",
                  date: "15.03.2026",
                  size: "1.8 MB",
                  type: "periapikal",
                },
                {
                  name: "Panoramik Röntgen (Eski)",
                  date: "10.12.2025",
                  size: "3.9 MB",
                  type: "panoramik",
                },
                {
                  name: "Sefalometrik Film",
                  date: "05.09.2025",
                  size: "5.1 MB",
                  type: "sefalometrik",
                },
              ].map((img, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-outline-variant/15 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="h-32 bg-surface-container-low flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-outline/30 group-hover:text-primary/50 transition-colors">
                      radiology
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-bold text-on-surface">
                      {img.name}
                    </p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      {img.date} · {img.size}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <button className="text-[11px] text-primary font-bold hover:underline flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">
                          visibility
                        </span>
                        Görüntüle
                      </button>
                      <button className="text-[11px] text-on-surface-variant font-bold hover:underline flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">
                          download
                        </span>
                        İndir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === "documents" && (
          <div className="p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-headline font-bold text-on-surface">
                Belgeler & Formlar
              </h3>
              <button className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-sm flex items-center gap-2 shadow-md hover:brightness-110 transition-all">
                <span className="material-symbols-outlined text-sm">
                  upload_file
                </span>
                Belge Yükle
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-outline-variant/15 overflow-hidden">
              {[
                {
                  name: "Kimlik Fotokopisi.pdf",
                  cat: "Kimlik",
                  date: "15.03.2026",
                  size: "1.1 MB",
                  icon: "picture_as_pdf",
                  color: "text-error",
                },
                {
                  name: "SGK Provizyon Belgesi.pdf",
                  cat: "Sigorta",
                  date: "15.03.2026",
                  size: "0.8 MB",
                  icon: "picture_as_pdf",
                  color: "text-error",
                },
                {
                  name: "Muvafakatname_imzali.pdf",
                  cat: "Muvafakatname",
                  date: "15.03.2026",
                  size: "0.5 MB",
                  icon: "picture_as_pdf",
                  color: "text-error",
                },
                {
                  name: "Kan_Tahlili_Sonuclari.pdf",
                  cat: "Tahlil",
                  date: "10.03.2026",
                  size: "2.3 MB",
                  icon: "picture_as_pdf",
                  color: "text-error",
                },
                {
                  name: "Reçete_20260310.pdf",
                  cat: "Reçete",
                  date: "10.03.2026",
                  size: "0.3 MB",
                  icon: "description",
                  color: "text-primary",
                },
              ].map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-5 py-3 border-b border-outline-variant/8 last:border-0 hover:bg-surface-container-low/30 transition-colors"
                >
                  <div className="w-10 h-10 bg-surface-container-low rounded-lg flex items-center justify-center">
                    <span className={`material-symbols-outlined ${doc.color}`}>
                      {doc.icon}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-on-surface">
                      {doc.name}
                    </p>
                    <p className="text-[11px] text-on-surface-variant">
                      {doc.date} · {doc.size}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-surface-container-high rounded text-[10px] font-bold text-on-surface-variant">
                    {doc.cat}
                  </span>
                  <button className="p-1.5 hover:bg-surface-container rounded-lg text-outline hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-base">
                      download
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Sağ Tık Context Menu */}
      {ctx && (
        <>
          <div
            className="fixed inset-0 z-[600]"
            onClick={() => setCtx(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setCtx(null);
            }}
          />
          <div
            className="fixed z-[610] w-52 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.15)] border border-outline-variant/20 py-1.5"
            style={{ left: ctx.x, top: ctx.y }}
          >
            <button
              onClick={() => {
                setCtx(null);
                setShowForm(true);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low transition-colors text-left"
            >
              <span className="material-symbols-outlined text-primary text-lg">
                medical_information
              </span>
              <span className="text-sm font-semibold text-on-surface">
                Teşhis & Tedavi
              </span>
            </button>
            <div className="h-px bg-outline-variant/15 mx-3 my-1" />
            <button
              onClick={() => {
                setCtx(null);
                const nx = { ...ts };
                sel.forEach((n) => {
                  const st = [
                    "HEALTHY",
                    "FILLING_NEEDED",
                    "FILLED",
                    "ROOT_CANAL",
                    "EXTRACTION",
                    "IMPLANT",
                  ];
                  const ci = st.indexOf(nx[n] || "HEALTHY");
                  nx[n] = st[(ci + 1) % st.length];
                });
                setTs(nx);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low transition-colors text-left"
            >
              <span className="material-symbols-outlined text-on-surface-variant text-lg">
                swap_horiz
              </span>
              <span className="text-sm font-semibold text-on-surface">
                Durumu Değiştir
              </span>
            </button>
          </div>
        </>
      )}

      {/* Teşhis & Tedavi Dialog */}
      {showForm && (
        <DiagnosisTreatmentDialog
          patientId={patientId}
          patientName={`${p.firstName} ${p.lastName}`}
          selectedTeeth={[...sel]}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            setSel(new Set());
            // Sayfayı yenile
            fetch(`/api/patients/${patientId}`)
              .then((r) => r.json())
              .then((d) => {
                setP(d);
                const s: Record<number, string> = {};
                d.dentalChart?.forEach((x: any) => {
                  s[x.toothNumber] = x.condition;
                });
                setTs(s);
              });
          }}
        />
      )}
    </div>
  );
}
