"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { TOOTH_NUMBERS } from "@/lib/constants";

interface TreatmentPlanItem {
  id: string;
  treatmentDef: { id: string; name: string; code: string; category: string };
  toothNumber: number | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  status: string;
}

interface TreatmentPlan {
  id: string;
  title: string;
  notes: string | null;
  totalCost: number;
  doctor: { id: string; name: string };
  items: TreatmentPlanItem[];
  sessions: {
    id: string;
    sessionNo: number;
    status: string;
    notes: string | null;
    date: string;
  }[];
  createdAt: string;
}

const STATUS_MAP: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  COMPLETED: {
    label: "TAMAMLANDI",
    color: "text-emerald-600 bg-emerald-50",
    icon: "check_circle",
  },
  PLANNED: {
    label: "PLANLANDI",
    color: "text-amber-600 bg-amber-50",
    icon: "schedule",
  },
  IN_PROGRESS: {
    label: "DEVAM EDİYOR",
    color: "text-blue-600 bg-blue-50",
    icon: "play_circle",
  },
  PENDING: {
    label: "BEKLEMEDE",
    color: "text-on-surface-variant bg-surface-container-low",
    icon: "hourglass_empty",
  },
  CANCELLED: {
    label: "İPTAL",
    color: "text-rose-600 bg-rose-50",
    icon: "cancel",
  },
};

const TOOTH_STATUS_COLORS: Record<string, string> = {
  CAVITY: "bg-error-container/50 text-error border-error/30",
  FILLING: "bg-primary-container/30 text-primary border-primary/30",
  CROWN: "bg-amber-100 text-amber-700 border-amber-300",
  EXTRACTION: "bg-rose-100 text-rose-700 border-rose-300",
};

export function TreatmentPlanContent({ patientId }: { patientId?: string }) {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [activePlanIndex, setActivePlanIndex] = useState(0);

  const fetchPlans = useCallback(async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/treatment-plans?patientId=${patientId}`);
    if (res.ok) {
      const data = await res.json();
      setPlans(data.plans || []);
    }
    setLoading(false);
  }, [patientId]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  async function deleteItem(planId: string, itemId: string) {
    if (
      !confirm(
        "Bu işlemi silmek istediğinize emin misiniz? İlgili cari borç kaydı da silinecektir.",
      )
    )
      return;
    const res = await fetch(`/api/treatment-plans/${planId}/items/${itemId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      // Optimistic: item'ı listeden kaldır
      setPlans((prev) =>
        prev.map((p) =>
          p.id === planId
            ? { ...p, items: p.items.filter((i) => i.id !== itemId) }
            : p,
        ),
      );
    } else {
      const d = await res.json();
      alert(d.error || "Silme başarısız");
    }
  }

  const activePlan = plans[activePlanIndex];
  const items = activePlan?.items || [];

  // Haritada işaretlenecek dişler
  const toothMap: Record<number, string> = {};
  items.forEach((item) => {
    if (item.toothNumber) {
      toothMap[item.toothNumber] = item.status || "PLANNED";
    }
  });

  const allTeethUpper = [
    ...TOOTH_NUMBERS.upperRight,
    ...TOOTH_NUMBERS.upperLeft,
  ];
  const allTeethLower = [
    ...TOOTH_NUMBERS.lowerRight,
    ...TOOTH_NUMBERS.lowerLeft,
  ];

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const totalDiscount = items.reduce((s, i) => s + (i.discount || 0), 0);
  const total = subtotal - totalDiscount;
  const completedCount = items.filter((i) => i.status === "COMPLETED").length;
  const pct = items.length
    ? Math.round((completedCount / items.length) * 100)
    : 0;

  function toothCls(n: number) {
    const status = toothMap[n];
    if (status && TOOTH_STATUS_COLORS[status])
      return TOOTH_STATUS_COLORS[status];
    if (status) return "bg-amber-100 text-amber-700 border-amber-300";
    return "bg-surface-container-low text-on-surface-variant border-outline-variant/30";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!patientId) {
    return (
      <div className="flex items-center justify-center h-full text-on-surface-variant">
        <div className="text-center space-y-2">
          <span className="material-symbols-outlined text-5xl text-outline">
            person_search
          </span>
          <p className="font-bold">Hasta seçilmedi.</p>
          <p className="text-sm">
            Tedavi planı görüntülemek için bir hasta seçin.
          </p>
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-on-surface-variant">
        <div className="text-center space-y-2">
          <span className="material-symbols-outlined text-5xl text-outline">
            assignment
          </span>
          <p className="font-bold">Henüz tedavi planı yok.</p>
          <p className="text-sm">
            Bu hasta için henüz bir tedavi planı oluşturulmamış.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Plan Tabs */}
      {plans.length > 1 && (
        <div className="px-5 pt-3 flex gap-2 shrink-0">
          {plans.map((p, i) => (
            <button
              key={p.id}
              onClick={() => {
                setActivePlanIndex(i);
                setSelectedItem(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${i === activePlanIndex ? "bg-primary text-white" : "bg-surface-container-low text-on-surface-variant hover:bg-white"}`}
            >
              {p.title || `Plan ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sol: Diş Haritası + İlerleme */}
        <div className="w-[380px] shrink-0 border-r border-outline-variant/10 p-5 flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-headline font-bold text-on-surface">
              Dijital Diş Haritası
            </h3>
            <div className="flex gap-1.5 text-[10px] font-bold">
              <span className="px-1.5 py-0.5 rounded bg-error-container/50 text-error border border-error/20">
                KAVİTE
              </span>
              <span className="px-1.5 py-0.5 rounded bg-primary-container/30 text-primary border border-primary/20">
                DOLGU
              </span>
            </div>
          </div>
          {/* Üst Çene */}
          <div className="flex justify-center gap-1 mb-1">
            {allTeethUpper.map((n, i) => (
              <div key={n} className="flex">
                {i === 8 && <div className="w-2" />}
                <div
                  className={`w-7 h-7 rounded-md border flex items-center justify-center text-[10px] font-bold cursor-pointer hover:brightness-95 transition-all ${toothCls(n)}`}
                >
                  {n}
                </div>
              </div>
            ))}
          </div>
          {/* Alt Çene */}
          <div className="flex justify-center gap-1 mb-4">
            {allTeethLower.map((n, i) => (
              <div key={n} className="flex">
                {i === 8 && <div className="w-2" />}
                <div
                  className={`w-7 h-7 rounded-md border flex items-center justify-center text-[10px] font-bold cursor-pointer hover:brightness-95 transition-all ${toothCls(n)}`}
                >
                  {n}
                </div>
              </div>
            ))}
          </div>

          {/* İlerleme */}
          <div className="mt-auto space-y-3">
            <div>
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Tedavi İlerleme Durumu
              </p>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl font-black font-headline text-primary">
                  %{pct}
                </span>
                <span className="text-sm text-on-surface-variant">
                  {completedCount} / {items.length} Seans Tamamlandı
                </span>
              </div>
              <div className="w-full bg-surface-container-low rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            {activePlan?.notes && (
              <div className="bg-primary-container/10 rounded-xl p-3 border border-primary/10">
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">
                  Plan Notu
                </p>
                <p className="text-[13px] text-on-surface italic">
                  "{activePlan.notes}"
                </p>
              </div>
            )}
            {activePlan?.doctor && (
              <div className="text-xs text-on-surface-variant">
                <span className="font-bold">Hekim:</span>{" "}
                {activePlan.doctor.name}
              </div>
            )}
          </div>
        </div>

        {/* Orta: Yapılacak İşlemler */}
        <div className="flex-1 p-5 overflow-y-auto">
          <h3 className="font-headline font-bold text-on-surface mb-4">
            Yapılacak İşlemler Listesi
          </h3>
          <div className="space-y-3">
            {items.map((item) => {
              const st = STATUS_MAP[item.status] || STATUS_MAP.PENDING;
              const lineTotal =
                item.unitPrice * item.quantity - (item.discount || 0);
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedItem === item.id ? "border-primary/30 bg-primary-container/5 shadow-sm" : "border-outline-variant/15 hover:border-outline-variant/30"}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-full ${st.color} flex items-center justify-center shrink-0`}
                    >
                      <span
                        className="material-symbols-outlined text-sm"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {st.icon}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-on-surface">
                        {item.treatmentDef?.name || "Tedavi"}
                      </p>
                      <p className="text-[12px] text-on-surface-variant mt-0.5">
                        {item.toothNumber
                          ? `Diş No: ${item.toothNumber}`
                          : "Genel"}
                        {item.treatmentDef?.code
                          ? ` · ${item.treatmentDef.code}`
                          : ""}
                        {item.quantity > 1 ? ` · x${item.quantity}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-primary">
                        {lineTotal.toLocaleString("tr-TR")} ₺
                      </p>
                      <span
                        className={`text-[10px] font-bold uppercase ${st.color} px-1.5 py-0.5 rounded`}
                      >
                        {st.label}
                      </span>
                      {isAdmin && item.status !== "COMPLETED" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteItem(activePlan!.id, item.id);
                          }}
                          className="mt-1 block text-[10px] text-error hover:underline ml-auto"
                        >
                          🗑️ Sil
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {items.length === 0 && (
              <p className="text-sm text-on-surface-variant text-center py-8">
                Bu planda henüz işlem yok.
              </p>
            )}
          </div>

          {/* Ödeme Detayları */}
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Ödeme Detayları
              </p>
              <div className="flex justify-between text-sm">
                <span>Ara Toplam:</span>
                <span className="font-bold">
                  {subtotal.toLocaleString("tr-TR")} ₺
                </span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm text-primary">
                  <span>İndirim:</span>
                  <span className="font-bold">
                    -{totalDiscount.toLocaleString("tr-TR")} ₺
                  </span>
                </div>
              )}
            </div>
            <div className="bg-primary rounded-2xl p-4 flex flex-col items-center justify-center text-white">
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                Toplam Ödenecek
              </p>
              <p className="text-3xl font-black font-headline mt-1">
                {total.toLocaleString("tr-TR")} ₺
              </p>
            </div>
          </div>
        </div>

        {/* Sağ: Seanslar */}
        <div className="w-56 border-l border-outline-variant/10 p-5 shrink-0 bg-white overflow-y-auto">
          <h3 className="font-headline font-bold text-on-surface text-sm mb-4">
            Seanslar
          </h3>
          {activePlan?.sessions?.length ? (
            <div className="space-y-2">
              {activePlan.sessions.map((s) => {
                const st = STATUS_MAP[s.status] || STATUS_MAP.PENDING;
                return (
                  <div
                    key={s.id}
                    className="p-2 rounded-xl border border-outline-variant/15"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`material-symbols-outlined text-sm ${st.color.split(" ")[0]}`}
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {st.icon}
                      </span>
                      <span className="text-xs font-bold">
                        Seans {s.sessionNo}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant">
                      {new Date(s.date).toLocaleDateString("tr-TR")}
                    </p>
                    {s.notes && (
                      <p className="text-[11px] text-on-surface-variant mt-1 italic">
                        "{s.notes}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[11px] text-on-surface-variant">
              Henüz seans planlanmamış.
            </p>
          )}
          <div className="mt-4 pt-4 border-t border-outline-variant/10">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">
              Plan Tarihi
            </p>
            <p className="text-xs font-bold text-on-surface">
              {activePlan
                ? new Date(activePlan.createdAt).toLocaleDateString("tr-TR")
                : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-outline-variant/10 flex items-center justify-between bg-white shrink-0">
        <button className="text-sm text-on-surface-variant font-medium flex items-center gap-1 hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-base">history</span>
          Geçmiş Planlar
        </button>
        <div className="flex gap-3">
          <button className="px-5 py-2 rounded-xl border border-outline-variant/20 text-on-surface-variant font-semibold text-sm hover:bg-surface-container transition-all flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">
              picture_as_pdf
            </span>
            PDF Çıktı Al
          </button>
          <button className="px-5 py-2 rounded-xl bg-primary-container text-on-primary-fixed font-bold text-sm shadow-lg shadow-primary-container/20 hover:brightness-105 transition-all flex items-center gap-1.5">
            Planı Kaydet ve Onayla
          </button>
        </div>
      </div>
    </div>
  );
}
