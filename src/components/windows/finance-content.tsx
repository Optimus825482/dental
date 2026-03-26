"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useWindowStore } from "@/stores/window-store";

interface Patient {
  id: string;
  patientNo: string;
  firstName: string;
  lastName: string;
  phone: string;
}
interface Transaction {
  id: string;
  type: string;
  amount: number;
  paymentMethod: string | null;
  description: string | null;
  createdAt: string;
  relatedPlanId?: string | null;
}

const METHOD_LABELS: Record<string, string> = {
  CASH: "Nakit",
  CREDIT_CARD: "Kredi Kartı",
  DEBIT_CARD: "Banka Kartı",
  TRANSFER: "Havale/EFT",
  INSTALLMENT: "Taksit",
  INSURANCE: "Sigorta",
};
const TYPE_LABELS: Record<string, string> = {
  CHARGE: "Borçlandırma",
  PAYMENT: "Ödeme",
  DISCOUNT: "İndirim",
  REFUND: "İade",
  INSURANCE: "Sigorta Ödemesi",
  ADJUSTMENT: "Düzeltme",
};

export function FinanceContent({
  patientId: initialPatientId,
}: {
  patientId?: string;
}) {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const { openWindow } = useWindowStore();

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientId, setPatientId] = useState(initialPatientId || "");

  // Düzenleme state
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editType, setEditType] = useState("");
  const [editMethod, setEditMethod] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Hasta arama
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);

  // Hesap verileri
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  // Formlar
  const [showPayForm, setShowPayForm] = useState(false);
  const [showChargeForm, setShowChargeForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payDesc, setPayDesc] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeType, setChargeType] = useState<
    "CHARGE" | "DISCOUNT" | "REFUND"
  >("CHARGE");
  const [chargeDesc, setChargeDesc] = useState("");
  const [saving, setSaving] = useState(false);

  // Hasta arama
  useEffect(() => {
    if (search.length < 2) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(
        `/api/patients?search=${encodeURIComponent(search)}&limit=8`,
      );
      if (res.ok) {
        const d = await res.json();
        setSearchResults(d.patients || []);
      }
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // initialPatientId ile açıldıysa direkt yükle
  useEffect(() => {
    if (initialPatientId && !selectedPatient) {
      fetch(`/api/patients/${initialPatientId}`)
        .then((r) => r.json())
        .then((d) => {
          setSelectedPatient(d);
          setPatientId(initialPatientId);
        });
    }
  }, [initialPatientId]);

  const fetchData = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    const res = await fetch(`/api/transactions?patientId=${patientId}`);
    if (res.ok) {
      const d = await res.json();
      setTransactions(d.transactions || []);
      setBalance(d.balance || 0);
    }
    setLoading(false);
  }, [patientId]);

  useEffect(() => {
    if (patientId) fetchData();
  }, [fetchData, patientId]);

  function selectPatient(p: Patient) {
    setSelectedPatient(p);
    setPatientId(p.id);
    setSearch("");
    setSearchResults([]);
  }

  function addTxToState(newTx: Transaction) {
    setTransactions((prev) => [newTx, ...prev]);
    // Bakiyeyi güncelle
    setBalance((prev) => {
      const amt = Math.abs(Number(newTx.amount));
      const isCredit = ["PAYMENT", "INSURANCE", "DISCOUNT"].includes(
        newTx.type,
      );
      return isCredit ? prev + amt : prev - amt;
    });
  }

  function removeTxFromState(id: string, tx: Transaction) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setBalance((prev) => {
      const amt = Math.abs(Number(tx.amount));
      const isCredit = ["PAYMENT", "INSURANCE", "DISCOUNT"].includes(tx.type);
      return isCredit ? prev - amt : prev + amt;
    });
  }

  async function handleCharge(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId || !chargeAmount) return;
    setSaving(true);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId,
        type: chargeType,
        amount: parseFloat(chargeAmount),
        description: chargeDesc || undefined,
      }),
    });
    if (res.ok) {
      const newTx = await res.json();
      addTxToState(newTx);
    }
    setShowChargeForm(false);
    setChargeAmount("");
    setChargeDesc("");
    setSaving(false);
  }

  async function handleDelete(tx: Transaction) {
    if (tx.relatedPlanId) {
      setErrorMsg(
        "Bu işlem bir tedavi planına ait. Silmek için ilgili tedavi planına gidin.",
      );
      setTimeout(() => setErrorMsg(""), 4000);
      return;
    }
    if (
      !confirm(
        `"${TYPE_LABELS[tx.type] || tx.type}" işlemini silmek istediğinize emin misiniz?`,
      )
    )
      return;
    const res = await fetch(`/api/transactions/${tx.id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      setErrorMsg(d.error || "Silme başarısız");
      setTimeout(() => setErrorMsg(""), 4000);
    } else {
      removeTxFromState(tx.id, tx);
    }
  }

  function openEdit(tx: Transaction) {
    if (tx.relatedPlanId) {
      setErrorMsg(
        "Bu işlem bir tedavi planına ait. Düzenlemek için ilgili tedavi planına gidin.",
      );
      setTimeout(() => setErrorMsg(""), 4000);
      return;
    }
    setEditTx(tx);
    setEditAmount(String(Math.abs(Number(tx.amount))));
    setEditDesc(tx.description || "");
    setEditType(tx.type);
    setEditMethod(tx.paymentMethod || "");
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editTx) return;
    setEditSaving(true);
    const res = await fetch(`/api/transactions/${editTx.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parseFloat(editAmount),
        description: editDesc,
        type: editType,
        paymentMethod: editMethod || null,
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      setErrorMsg(d.error || "Güncelleme başarısız");
      setTimeout(() => setErrorMsg(""), 4000);
    } else {
      const updated = await res.json();
      setTransactions((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t)),
      );
      // Bakiyeyi yeniden hesapla
      setTransactions((prev) => {
        const newBalance = prev.reduce((sum, t) => {
          const amt = Math.abs(
            Number(t.id === updated.id ? updated.amount : t.amount),
          );
          const isCredit = ["PAYMENT", "INSURANCE", "DISCOUNT"].includes(
            t.id === updated.id ? updated.type : t.type,
          );
          return isCredit ? sum + amt : sum - amt;
        }, 0);
        setBalance(-newBalance); // borç negatif
        return prev.map((t) => (t.id === updated.id ? updated : t));
      });
      setEditTx(null);
    }
    setEditSaving(false);
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId || !payAmount) return;
    setSaving(true);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId,
        type: "PAYMENT",
        amount: parseFloat(payAmount),
        paymentMethod: payMethod,
        description: payDesc || undefined,
      }),
    });
    if (res.ok) {
      const newTx = await res.json();
      addTxToState(newTx);
    }
    setShowPayForm(false);
    setPayAmount("");
    setPayDesc("");
    setSaving(false);
  }

  const [showStatement, setShowStatement] = useState(false);
  const [statementHtml, setStatementHtml] = useState("");

  function buildStatementHtml() {
    const patient = selectedPatient;
    if (!patient) return "";
    const clinicName = (session?.user as any)?.clinicName || "Klinik";
    const rows = transactions
      .map((t) => {
        const isCredit = ["PAYMENT", "INSURANCE", "DISCOUNT"].includes(t.type);
        return `<tr>
        <td>${new Date(t.createdAt).toLocaleDateString("tr-TR")}</td>
        <td><span style="padding:2px 8px;border-radius:20px;font-size:11px;font-weight:bold;background:${isCredit ? "#d1fae5" : "#fee2e2"};color:${isCredit ? "#065f46" : "#991b1b"}">${TYPE_LABELS[t.type] || t.type}</span></td>
        <td>${t.description || "-"}</td>
        <td>${t.paymentMethod ? METHOD_LABELS[t.paymentMethod] || t.paymentMethod : "-"}</td>
        <td style="text-align:right;font-weight:bold;color:${isCredit ? "#059669" : "#dc2626"}">${isCredit ? "+" : "-"}${Math.abs(Number(t.amount)).toLocaleString("tr-TR")} ₺</td>
      </tr>`;
      })
      .join("");
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Hesap Ekstresi</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Segoe UI',Arial,sans-serif;padding:32px;color:#1e293b;background:#fff}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #e2e8f0}
      .clinic{font-size:22px;font-weight:900;color:#0f172a}
      .clinic span{color:#0ea5e9}
      .meta{text-align:right;font-size:12px;color:#64748b}
      .patient{background:#f8fafc;border-radius:12px;padding:16px 20px;margin-bottom:20px}
      .patient h2{font-size:18px;font-weight:700;color:#0f172a}
      .patient p{font-size:13px;color:#64748b;margin-top:4px}
      .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}
      .card{border-radius:10px;padding:14px 18px}
      .card p{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}
      .card h3{font-size:22px;font-weight:900}
      .card.red{background:#fff1f2}.card.red p{color:#e11d48}.card.red h3{color:#be123c}
      .card.green{background:#f0fdf4}.card.green p{color:#16a34a}.card.green h3{color:#15803d}
      .card.blue{background:#eff6ff}.card.blue p{color:#2563eb}.card.blue h3{color:#1d4ed8}
      table{width:100%;border-collapse:collapse;font-size:13px}
      thead tr{background:#f1f5f9}
      th{padding:10px 12px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b}
      td{padding:10px 12px;border-bottom:1px solid #f1f5f9}
      tr:hover td{background:#fafafa}
      .footer{margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center}
    </style></head><body>
    <div class="header">
      <div class="clinic">${clinicName}</div>
      <div class="meta">
        <div>Hesap Ekstresi</div>
        <div>${new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</div>
      </div>
    </div>
    <div class="patient">
      <h2>${patient.firstName} ${patient.lastName}</h2>
      <p>${patient.patientNo} · ${patient.phone}</p>
    </div>
    <div class="summary">
      <div class="card red"><p>Toplam İşlem</p><h3>${totalCharge.toLocaleString("tr-TR")} ₺</h3></div>
      <div class="card green"><p>Toplam Tahsilat</p><h3>${totalPayment.toLocaleString("tr-TR")} ₺</h3></div>
      <div class="card ${balance < 0 ? "red" : "blue"}"><p>Kalan Bakiye</p><h3>${Math.abs(balance).toLocaleString("tr-TR")} ₺ ${balance < 0 ? "Borç" : "Alacak"}</h3></div>
    </div>
    <table>
      <thead><tr><th>Tarih</th><th>Tür</th><th>Açıklama</th><th>Yöntem</th><th style="text-align:right">Tutar</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">© ${new Date().getFullYear()} DENT-ALP SYSTEMS · Bu belge sistem tarafından otomatik oluşturulmuştur.</div>
    </body></html>`;
  }

  function openStatement() {
    setStatementHtml(buildStatementHtml());
    setShowStatement(true);
  }

  function exportExcel() {
    const patient = selectedPatient;
    if (!patient) return;
    const header = ["Tarih", "Tür", "Açıklama", "Ödeme Yöntemi", "Tutar"];
    const rows = transactions.map((t) => {
      const isCredit = ["PAYMENT", "INSURANCE", "DISCOUNT"].includes(t.type);
      return [
        new Date(t.createdAt).toLocaleDateString("tr-TR"),
        TYPE_LABELS[t.type] || t.type,
        t.description || "",
        t.paymentMethod
          ? METHOD_LABELS[t.paymentMethod] || t.paymentMethod
          : "",
        `${isCredit ? "+" : "-"}${Math.abs(Number(t.amount)).toLocaleString("tr-TR")}`,
      ];
    });
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ekstre_${patient.patientNo}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalCharge = transactions
    .filter((t) => t.type === "CHARGE")
    .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const totalPayment = transactions
    .filter((t) => ["PAYMENT", "INSURANCE"].includes(t.type))
    .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const totalDiscount = transactions
    .filter((t) => t.type === "DISCOUNT")
    .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

  // ── HASTA ARAMA EKRANI ────────────────────────────────
  if (!patientId) {
    return (
      <div className="flex flex-col h-full p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">💳</span>
          <div>
            <h2 className="font-headline font-bold text-on-surface text-base">
              Cari Hesaplar
            </h2>
            <p className="text-xs text-on-surface-variant">
              Hesap görüntülemek için hasta arayın
            </p>
          </div>
        </div>
        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ad soyad veya telefon numarası..."
            autoFocus
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant/30 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {search.length >= 2 ? (
          <div className="flex-1 overflow-y-auto space-y-1">
            {searchResults.length > 0 ? (
              searchResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectPatient(p)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary-container/10 border border-transparent hover:border-primary/20 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center font-bold text-sm text-primary shrink-0">
                    {p.firstName?.[0]}
                    {p.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface">
                      {p.firstName} {p.lastName}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {p.phone} · {p.patientNo}
                    </p>
                  </div>
                  <span className="text-outline/30 group-hover:text-primary text-lg">
                    ›
                  </span>
                </button>
              ))
            ) : !searching ? (
              <div className="text-center py-8 text-on-surface-variant">
                <p className="text-sm">Kayıt bulunamadı</p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant/40 gap-2">
            <span className="text-5xl">💳</span>
            <p className="text-sm">Hasta adı veya telefon numarası yazın</p>
          </div>
        )}
      </div>
    );
  }

  // ── HESAP DETAY EKRANI ────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Hasta başlığı */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-outline-variant/15 bg-white shrink-0">
        <button
          onClick={() => {
            setPatientId("");
            setSelectedPatient(null);
            setTransactions([]);
          }}
          className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors"
        >
          ‹
        </button>
        <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center font-bold text-sm text-primary shrink-0">
          {selectedPatient?.firstName?.[0]}
          {selectedPatient?.lastName?.[0]}
        </div>
        <div className="flex-1">
          <p className="font-bold text-on-surface text-sm">
            {selectedPatient?.firstName} {selectedPatient?.lastName}
          </p>
          <p className="text-xs text-on-surface-variant">
            {selectedPatient?.patientNo} · {selectedPatient?.phone}
          </p>
        </div>
        <button
          onClick={openStatement}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-outline-variant/30 text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          🖨️ Ekstre
        </button>
        <button
          onClick={() => {
            setShowChargeForm(!showChargeForm);
            setShowPayForm(false);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${showChargeForm ? "bg-amber-600 text-white shadow-sm" : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"}`}
        >
          📋 Borçlandır
        </button>
        <button
          onClick={() => {
            setShowPayForm(!showPayForm);
            setShowChargeForm(false);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${showPayForm ? "bg-primary text-on-primary shadow-sm" : "bg-primary-container/15 text-primary border border-primary/20 hover:bg-primary-container/25"}`}
        >
          💰 Tahsilat
        </button>
      </div>

      {/* Özet kartlar */}
      <div className="px-5 py-3 grid grid-cols-4 gap-3 border-b border-outline-variant/10 shrink-0">
        <div className="bg-rose-50 rounded-2xl p-3">
          <p className="text-[9px] font-bold text-rose-600 uppercase tracking-widest">
            Toplam İşlem
          </p>
          <p className="text-xl font-black text-rose-700 mt-0.5">
            {totalCharge.toLocaleString("tr-TR")} ₺
          </p>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-3">
          <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
            Toplam Ödeme
          </p>
          <p className="text-xl font-black text-emerald-700 mt-0.5">
            {totalPayment.toLocaleString("tr-TR")} ₺
          </p>
        </div>
        {totalDiscount > 0 && (
          <div className="bg-amber-50 rounded-2xl p-3">
            <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">
              İndirim
            </p>
            <p className="text-xl font-black text-amber-700 mt-0.5">
              {totalDiscount.toLocaleString("tr-TR")} ₺
            </p>
          </div>
        )}
        <div
          className={`rounded-2xl p-3 ${balance < 0 ? "bg-rose-50" : "bg-primary-container/15"}`}
        >
          <p
            className={`text-[9px] font-bold uppercase tracking-widest ${balance < 0 ? "text-rose-600" : "text-primary"}`}
          >
            Kalan Bakiye
          </p>
          <p
            className={`text-xl font-black mt-0.5 ${balance < 0 ? "text-rose-700" : "text-primary"}`}
          >
            {Math.abs(balance).toLocaleString("tr-TR")} ₺{" "}
            <span className="text-sm font-semibold">
              {balance < 0 ? "Borç" : "Alacak"}
            </span>
          </p>
        </div>
      </div>

      {/* İşlem tablosu */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-on-surface-variant">
            <p className="text-sm">Henüz finansal işlem bulunmuyor.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant/15 sticky top-0">
                <th className="px-4 py-2.5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                  Tarih
                </th>
                <th className="px-4 py-2.5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                  Tür
                </th>
                <th className="px-4 py-2.5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                  Açıklama
                </th>
                <th className="px-4 py-2.5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                  Yöntem
                </th>
                <th className="px-4 py-2.5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-right">
                  Tutar
                </th>
                {isAdmin && <th className="px-2 py-2.5 w-16" />}
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-outline-variant/8">
              {transactions.map((t) => {
                const isCredit = ["PAYMENT", "INSURANCE", "DISCOUNT"].includes(
                  t.type,
                );
                return (
                  <tr
                    key={t.id}
                    className="hover:bg-surface-container-low/30 transition-colors group"
                  >
                    <td className="px-4 py-2.5 text-on-surface-variant text-xs">
                      {new Date(t.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isCredit ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                      >
                        {TYPE_LABELS[t.type] || t.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-on-surface text-xs">
                      {t.description || "-"}
                      {(t as any).relatedPlanId && (
                        <span className="ml-1 text-[9px] text-primary bg-primary-container/20 px-1.5 py-0.5 rounded-full">
                          Tedavi Planı
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-on-surface-variant text-xs">
                      {t.paymentMethod
                        ? METHOD_LABELS[t.paymentMethod] || t.paymentMethod
                        : "-"}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-bold ${isCredit ? "text-emerald-600" : "text-error"}`}
                    >
                      {isCredit ? "+" : "-"}
                      {Math.abs(Number(t.amount)).toLocaleString("tr-TR")} ₺
                    </td>
                    {isAdmin && (
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(t)}
                            title={
                              (t as any).relatedPlanId
                                ? "Tedavi planına git"
                                : "Düzenle"
                            }
                            className={`p-1 rounded-lg transition-colors ${(t as any).relatedPlanId ? "text-primary hover:bg-primary-container/20" : "text-on-surface-variant hover:bg-surface-container"}`}
                          >
                            {(t as any).relatedPlanId ? "🔗" : "✏️"}
                          </button>
                          <button
                            onClick={() => handleDelete(t)}
                            title={
                              (t as any).relatedPlanId
                                ? "Tedavi planından silinebilir"
                                : "Sil"
                            }
                            className={`p-1 rounded-lg transition-colors ${(t as any).relatedPlanId ? "text-outline/40 cursor-not-allowed" : "text-error hover:bg-error/10"}`}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Charge Form */}
      {showChargeForm && (
        <div className="p-3 border-t border-outline-variant/10 bg-amber-50/50 shrink-0">
          <form onSubmit={handleCharge} className="flex items-end gap-2">
            <div className="w-32">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase block mb-1">
                Tür
              </label>
              <select
                value={chargeType}
                onChange={(e) => setChargeType(e.target.value as any)}
                className="w-full px-2 py-1.5 rounded-lg border border-on-surface/20 text-sm"
              >
                <option value="CHARGE">Borçlandırma</option>
                <option value="DISCOUNT">İndirim</option>
                <option value="REFUND">İade</option>
              </select>
            </div>
            <div className="w-28">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase block mb-1">
                Tutar (₺)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={chargeAmount}
                onChange={(e) => setChargeAmount(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-on-surface/20 text-sm"
                placeholder="0.00"
                required
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase block mb-1">
                Açıklama
              </label>
              <input
                value={chargeDesc}
                onChange={(e) => setChargeDesc(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-on-surface/20 text-sm"
                placeholder="Opsiyonel"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-sm disabled:opacity-50"
            >
              {saving ? "..." : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={() => setShowChargeForm(false)}
              className="px-3 py-1.5 rounded-lg border border-outline-variant/20 text-sm"
            >
              İptal
            </button>
          </form>
        </div>
      )}

      {/* Payment Form */}
      {showPayForm && (
        <div className="p-3 border-t border-outline-variant/10 bg-emerald-50/30 shrink-0">
          <form onSubmit={handlePayment} className="flex items-end gap-2">
            <div className="w-28">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase block mb-1">
                Tutar (₺)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-on-surface/20 text-sm"
                placeholder="0.00"
                required
              />
            </div>
            <div className="w-36">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase block mb-1">
                Yöntem
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-on-surface/20 text-sm"
              >
                <option value="CASH">Nakit</option>
                <option value="CREDIT_CARD">Kredi Kartı</option>
                <option value="DEBIT_CARD">Banka Kartı</option>
                <option value="TRANSFER">Havale/EFT</option>
                <option value="INSTALLMENT">Taksit</option>
                <option value="INSURANCE">Sigorta</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase block mb-1">
                Açıklama
              </label>
              <input
                value={payDesc}
                onChange={(e) => setPayDesc(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-on-surface/20 text-sm"
                placeholder="Opsiyonel"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-sm disabled:opacity-50"
            >
              {saving ? "..." : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={() => setShowPayForm(false)}
              className="px-3 py-1.5 rounded-lg border border-outline-variant/20 text-sm"
            >
              İptal
            </button>
          </form>
        </div>
      )}

      {/* Hata mesajı */}
      {errorMsg && (
        <div className="mx-5 mb-2 p-3 bg-error/10 border border-error/20 rounded-xl text-sm text-error font-semibold shrink-0">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Ekstre Önizleme Modal */}
      {showStatement && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[800]"
            onClick={() => setShowStatement(false)}
          />
          <div
            className="fixed z-[810] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
            style={{
              top: 64,
              left: "50%",
              transform: "translateX(-50%)",
              width: "min(860px, calc(100vw - 48px))",
              height: "calc(100vh - 180px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/15 bg-surface-container-low shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">📄</span>
                <span className="font-bold text-on-surface">
                  Hesap Ekstresi Önizleme
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:brightness-110 transition-all"
                >
                  📊 Excel / CSV
                </button>
                <button
                  onClick={() => {
                    const iframe = document.getElementById(
                      "statement-iframe",
                    ) as HTMLIFrameElement;
                    iframe?.contentWindow?.print();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:brightness-110 transition-all"
                >
                  🖨️ Yazdır
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([statementHtml], {
                      type: "text/html",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `ekstre_${selectedPatient?.patientNo}_${new Date().toISOString().slice(0, 10)}.html`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:brightness-110 transition-all"
                >
                  📥 PDF olarak kaydet
                </button>
                <button
                  onClick={() => setShowStatement(false)}
                  className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors ml-1"
                >
                  ✕
                </button>
              </div>
            </div>
            {/* iframe önizleme */}
            <div className="flex-1 overflow-hidden bg-gray-200 p-3">
              <iframe
                id="statement-iframe"
                srcDoc={statementHtml}
                className="w-full h-full rounded-lg shadow border-0 bg-white"
                title="Hesap Ekstresi"
              />
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {editTx && isAdmin && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-50"
            onClick={() => setEditTx(null)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold text-on-surface text-base mb-4">
                İşlemi Düzenle
              </h3>
              <form onSubmit={handleEditSave} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Tür
                  </label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 text-sm outline-none"
                  >
                    <option value="CHARGE">Borçlandırma</option>
                    <option value="PAYMENT">Ödeme</option>
                    <option value="DISCOUNT">İndirim</option>
                    <option value="REFUND">İade</option>
                    <option value="ADJUSTMENT">Düzeltme</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Tutar (₺)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 text-sm outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Ödeme Yöntemi
                  </label>
                  <select
                    value={editMethod}
                    onChange={(e) => setEditMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 text-sm outline-none"
                  >
                    <option value="">-</option>
                    <option value="CASH">Nakit</option>
                    <option value="CREDIT_CARD">Kredi Kartı</option>
                    <option value="DEBIT_CARD">Banka Kartı</option>
                    <option value="TRANSFER">Havale/EFT</option>
                    <option value="INSTALLMENT">Taksit</option>
                    <option value="INSURANCE">Sigorta</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Açıklama
                  </label>
                  <input
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 text-sm outline-none"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditTx(null)}
                    className="flex-1 py-2 rounded-xl border border-outline-variant/40 text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={editSaving}
                    className="flex-1 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    {editSaving ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
    </div>
  );
}
