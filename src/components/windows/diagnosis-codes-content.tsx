"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface DiagnosisCode {
  id: string;
  code: string;
  description: string;
  parentCode: string | null;
  isActive: boolean;
}

export function DiagnosisCodesContent() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  const [codes, setCodes] = useState<DiagnosisCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editItem, setEditItem] = useState<DiagnosisCode | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "",
    description: "",
    parentCode: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/diagnosis-codes")
      .then((r) => r.json())
      .then((d) => {
        const list: DiagnosisCode[] = d.codes || [];
        setCodes(list);
        // default: all collapsed
        const exp: Record<string, boolean> = {};
        list.filter((c) => !c.parentCode).forEach((c) => (exp[c.code] = false));
        setExpanded(exp);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const isSearching = search.trim().length > 0;

  const filtered = isSearching
    ? codes.filter(
        (c) =>
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.description.toLowerCase().includes(search.toLowerCase()),
      )
    : codes;

  const parents = filtered.filter((c) => !c.parentCode);
  const childrenOf = (parentCode: string) =>
    filtered.filter((c) => c.parentCode === parentCode);

  function toggle(code: string) {
    setExpanded((prev) => ({ ...prev, [code]: !prev[code] }));
  }

  function openNew() {
    setEditItem(null);
    setForm({ code: "", description: "", parentCode: "" });
    setShowForm(true);
  }

  function openEdit(item: DiagnosisCode) {
    setEditItem(item);
    setForm({
      code: item.code,
      description: item.description,
      parentCode: item.parentCode || "",
    });
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editItem) {
        const res = await fetch(`/api/diagnosis-codes/${editItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const updated = await res.json();
        setCodes((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c)),
        );
      } else {
        const res = await fetch("/api/diagnosis-codes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const created = await res.json();
        setCodes((prev) =>
          [...prev, created].sort((a, b) => a.code.localeCompare(b.code)),
        );
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: DiagnosisCode) {
    if (!confirm(`"${item.code}" kodunu silmek istediğinize emin misiniz?`))
      return;
    await fetch(`/api/diagnosis-codes/${item.id}`, { method: "DELETE" });
    setCodes((prev) => prev.filter((c) => c.id !== item.id));
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/30 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-on-surface">Tanı Kodları</h2>
          <p className="text-xs text-outline">
            ICD-10 Diş Hekimliği Tanı Kodları (K00–K10)
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Yeni Kod
          </button>
        )}
      </div>

      {/* Search */}
      <div className="px-5 py-3 shrink-0">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Kod veya açıklama ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto px-4 pb-5">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : parents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-outline gap-2">
            <span className="material-symbols-outlined text-3xl">
              search_off
            </span>
            <p className="text-sm">Sonuç bulunamadı</p>
          </div>
        ) : (
          <div className="space-y-1">
            {parents.map((parent) => {
              const children = childrenOf(parent.code);
              const isOpen = isSearching || expanded[parent.code];

              return (
                <div key={parent.id}>
                  {/* Parent row */}
                  <div className="flex items-center gap-2 group rounded-xl hover:bg-primary-container/10 transition-colors pr-2">
                    {/* Toggle arrow */}
                    <button
                      onClick={() => toggle(parent.code)}
                      className="flex items-center justify-center w-7 h-9 shrink-0 text-primary"
                    >
                      <span
                        className="material-symbols-outlined text-[18px] transition-transform duration-150"
                        style={{
                          transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                        }}
                      >
                        chevron_right
                      </span>
                    </button>

                    {/* Code badge */}
                    <span className="font-mono font-bold text-xs bg-primary text-on-primary px-2 py-0.5 rounded-lg shrink-0">
                      {parent.code}
                    </span>

                    {/* Description */}
                    <span className="flex-1 text-sm font-semibold text-on-surface py-2 truncate uppercase">
                      {parent.description}
                    </span>

                    {/* Actions */}
                    {isAdmin && (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(parent)}
                          className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
                          title="Düzenle"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() => handleDelete(parent)}
                          className="p-1.5 rounded-lg hover:bg-error/10 text-error transition-colors"
                          title="Sil"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            delete
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Children */}
                  {isOpen && children.length > 0 && (
                    <div className="ml-7 border-l-2 border-outline-variant/20 pl-3 space-y-0.5 mb-1">
                      {children.map((child) => (
                        <div
                          key={child.id}
                          className="flex items-center gap-2 group rounded-xl hover:bg-surface-container-low transition-colors pr-2"
                        >
                          {/* Connector dot */}
                          <div className="w-3 shrink-0 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-outline-variant/50" />
                          </div>

                          {/* Code badge */}
                          <span className="font-mono text-[11px] bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-md shrink-0 w-14 text-center">
                            {child.code}
                          </span>

                          {/* Description */}
                          <span className="flex-1 text-sm text-on-surface py-2 truncate">
                            {child.description}
                          </span>

                          {/* Actions */}
                          {isAdmin && (
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEdit(child)}
                                className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
                                title="Düzenle"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  edit
                                </span>
                              </button>
                              <button
                                onClick={() => handleDelete(child)}
                                className="p-1.5 rounded-lg hover:bg-error/10 text-error transition-colors"
                                title="Sil"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  delete
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && isAdmin && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-50"
            onClick={() => setShowForm(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h3 className="text-base font-bold text-on-surface mb-4">
                {editItem ? "Tanı Kodunu Düzenle" : "Yeni Tanı Kodu"}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-outline uppercase tracking-wider">
                    Kod
                  </label>
                  <input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="K00.0"
                    className="mt-1 w-full px-3 py-2 border border-outline-variant/50 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-outline uppercase tracking-wider">
                    Açıklama
                  </label>
                  <input
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Tanı açıklaması"
                    className="mt-1 w-full px-3 py-2 border border-outline-variant/50 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-outline uppercase tracking-wider">
                    Üst Kod (opsiyonel)
                  </label>
                  <input
                    value={form.parentCode}
                    onChange={(e) =>
                      setForm({ ...form, parentCode: e.target.value })
                    }
                    placeholder="K00"
                    className="mt-1 w-full px-3 py-2 border border-outline-variant/50 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 rounded-xl border border-outline-variant/50 text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.code || !form.description}
                  className="flex-1 py-2 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
