"use client";

import { useState, useEffect, useCallback } from "react";

interface Product {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  unit: string;
  currentStock: number;
  minStock: number;
  price: number;
  isActive: boolean;
}

type ActiveTab = "list" | "movements" | "critical";

export function StockContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("list");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    unit: "adet",
    currentStock: "0",
    minStock: "5",
    price: "0",
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stock");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setProducts(d.products || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Yükleme hatası");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function openNew() {
    setEditId(null);
    setForm({
      name: "",
      sku: "",
      category: "",
      unit: "adet",
      currentStock: "0",
      minStock: "5",
      price: "0",
    });
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditId(p.id);
    setForm({
      name: p.name,
      sku: p.sku || "",
      category: p.category || "",
      unit: p.unit,
      currentStock: String(p.currentStock),
      minStock: String(p.minStock),
      price: String(p.price),
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = editId ? `/api/stock` : "/api/stock";
      const method = editId ? "PUT" : "POST";
      const body = {
        ...form,
        currentStock: parseInt(form.currentStock),
        minStock: parseInt(form.minStock),
        price: parseFloat(form.price),
        ...(editId ? { id: editId } : {}),
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setShowForm(false);
      fetchProducts();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Kaydetme hatası");
    } finally {
      setSaving(false);
    }
  }

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku || "").toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q)
    );
  });

  const criticalProducts = products.filter((p) => p.currentStock <= p.minStock);

  const displayList = activeTab === "critical" ? criticalProducts : filtered;

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <h2 className="text-xl font-medium text-on-surface">
            Stok & Ürün Yönetimi
          </h2>
          <p className="text-sm text-outline">Klinik ürünleri ve stok takibi</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-medium hover:brightness-110 transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Yeni Ürün Ekle
        </button>
      </div>

      {/* Tabs */}
      <div className="px-6 flex gap-6 border-b border-outline-variant/30">
        {(["list", "critical"] as ActiveTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`pb-3 border-b-2 text-sm transition-colors ${
              activeTab === t
                ? "border-primary text-primary font-medium"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {t === "list"
              ? "Ürün Listesi"
              : `Kritik Stoklar${criticalProducts.length > 0 ? ` (${criticalProducts.length})` : ""}`}
          </button>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="mx-6 mt-4 bg-surface-container-low rounded-2xl p-4">
          <h3 className="font-bold text-sm text-on-surface mb-3">
            {editId ? "Ürün Düzenle" : "Yeni Ürün"}
          </h3>
          <form onSubmit={handleSave} className="grid grid-cols-3 gap-3">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ürün Adı *"
              required
              className="px-3 py-2 rounded-xl border border-outline-variant/40 text-sm focus:border-primary outline-none"
            />
            <input
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              placeholder="SKU / Barkod"
              className="px-3 py-2 rounded-xl border border-outline-variant/40 text-sm focus:border-primary outline-none"
            />
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Kategori"
              className="px-3 py-2 rounded-xl border border-outline-variant/40 text-sm focus:border-primary outline-none"
            />
            <input
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="Birim (adet, kutu...)"
              className="px-3 py-2 rounded-xl border border-outline-variant/40 text-sm focus:border-primary outline-none"
            />
            <input
              type="number"
              value={form.currentStock}
              onChange={(e) =>
                setForm({ ...form, currentStock: e.target.value })
              }
              placeholder="Mevcut Stok"
              min="0"
              className="px-3 py-2 rounded-xl border border-outline-variant/40 text-sm focus:border-primary outline-none"
            />
            <input
              type="number"
              value={form.minStock}
              onChange={(e) => setForm({ ...form, minStock: e.target.value })}
              placeholder="Min. Stok"
              min="0"
              className="px-3 py-2 rounded-xl border border-outline-variant/40 text-sm focus:border-primary outline-none"
            />
            <input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="Birim Fiyatı (₺)"
              min="0"
              className="px-3 py-2 rounded-xl border border-outline-variant/40 text-sm focus:border-primary outline-none"
            />
            <div className="col-span-2 flex gap-2 items-end">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-sm disabled:opacity-50"
              >
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl border border-outline-variant/30 text-sm"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-6 mt-3 px-4 py-2 bg-error/10 text-error rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="p-6 flex-1 overflow-auto">
        {activeTab === "list" && (
          <div className="relative mb-4">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ürün adı, barkod veya kategori..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-sm focus:outline-none focus:border-primary"
            />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : displayList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant/40 gap-3">
            <span className="text-5xl">📦</span>
            <p className="text-sm">
              {activeTab === "critical"
                ? "Kritik stok seviyesinde ürün yok."
                : "Henüz ürün eklenmemiş."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container-low">
                  <th className="p-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Ürün Adı
                  </th>
                  <th className="p-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="p-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Mevcut Stok
                  </th>
                  <th className="p-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Birim Fiyatı
                  </th>
                  <th className="p-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayList.map((p) => {
                  const isCritical = p.currentStock <= p.minStock;
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-outline-variant/10 hover:bg-surface-container-lowest/50 transition-colors"
                    >
                      <td className="p-4">
                        <p className="text-sm font-medium text-on-surface">
                          {p.name}
                        </p>
                        {p.sku && (
                          <p className="text-xs text-outline">SKU: {p.sku}</p>
                        )}
                      </td>
                      <td className="p-4 text-sm text-on-surface-variant">
                        {p.category || "—"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                            isCritical
                              ? "bg-error/10 text-error"
                              : "bg-emerald-500/10 text-emerald-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${isCritical ? "bg-error" : "bg-emerald-500"}`}
                          />
                          {p.currentStock} {p.unit}
                          {isCritical && " (Kritik)"}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-medium text-on-surface">
                        {Number(p.price).toLocaleString("tr-TR")} ₺
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-2 text-outline hover:text-primary transition-colors"
                          title="Düzenle"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            edit
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
