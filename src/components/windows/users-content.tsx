"use client";

import { useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
}

const ROLE_MAP: Record<string, { label: string; cls: string }> = {
  ADMIN: { label: "Yönetici", cls: "bg-violet-100 text-violet-700" },
  DOCTOR: { label: "Hekim", cls: "bg-primary/10 text-primary" },
  SECRETARY: { label: "Sekreter", cls: "bg-amber-100 text-amber-700" },
  ASSISTANT: { label: "Asistan", cls: "bg-emerald-100 text-emerald-700" },
};

const ROLES = ["ADMIN", "DOCTOR", "SECRETARY", "ASSISTANT"];

const emptyForm = {
  name: "",
  username: "",
  email: "",
  password: "",
  role: "SECRETARY",
};

export function UsersContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/users");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setUsers(d.users || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Yükleme hatası");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function openNew() {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(u: User) {
    setEditId(u.id);
    setForm({
      name: u.name,
      username: u.username,
      email: u.email,
      password: "",
      role: u.role,
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = editId
        ? `/api/settings/users/${editId}`
        : "/api/settings/users";
      const method = editId ? "PUT" : "POST";
      const body: Record<string, string> = {
        name: form.name,
        username: form.username,
        email: form.email,
        role: form.role,
      };
      if (form.password) body.password = form.password;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || `HTTP ${res.status}`);
      }
      setShowForm(false);
      fetchUsers();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Kaydetme hatası");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id: string) {
    try {
      const res = await fetch(`/api/settings/users/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fetchUsers();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "İşlem hatası");
    }
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <h2 className="text-xl font-medium text-on-surface">
            Kullanıcı Yönetimi
          </h2>
          <p className="text-sm text-outline">
            Klinik personeli ve erişim yetkileri
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-medium hover:brightness-110 transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">
            person_add
          </span>
          Yeni Kullanıcı
        </button>
      </div>

      {/* Search */}
      <div className="px-6 pb-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ad, kullanıcı adı veya e-posta..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="mx-6 mb-4 bg-surface-container-low rounded-2xl p-4">
          <h3 className="font-bold text-sm text-on-surface mb-3">
            {editId ? "Kullanıcı Düzenle" : "Yeni Kullanıcı"}
          </h3>
          <form onSubmit={handleSave} className="grid grid-cols-2 gap-3">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ad Soyad *"
              required
              className="px-3 py-2 rounded-xl border border-outline-variant/40 text-sm focus:border-primary outline-none"
            />
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Kullanıcı Adı *"
              required
              className="px-3 py-2 rounded-xl border border-outline-variant/40 text-sm focus:border-primary outline-none"
            />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="E-posta *"
              required
              className="px-3 py-2 rounded-xl border border-outline-variant/40 text-sm focus:border-primary outline-none"
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={
                editId ? "Şifre (değiştirmek için girin)" : "Şifre *"
              }
              required={!editId}
              className="px-3 py-2 rounded-xl border border-outline-variant/40 text-sm focus:border-primary outline-none"
            />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="px-3 py-2 rounded-xl border border-outline-variant/40 text-sm focus:border-primary outline-none"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_MAP[r]?.label || r}
                </option>
              ))}
            </select>
            <div className="flex gap-2 items-center">
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
        <div className="mx-6 mb-3 px-4 py-2 bg-error/10 text-error rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant/40 gap-3">
            <span className="text-5xl">👥</span>
            <p className="text-sm">Kullanıcı bulunamadı.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container-low">
                  <th className="p-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Kullanıcı
                  </th>
                  <th className="p-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="p-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Son Giriş
                  </th>
                  <th className="p-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="p-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const role = ROLE_MAP[u.role] || {
                    label: u.role,
                    cls: "bg-surface-container text-on-surface-variant",
                  };
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-outline-variant/10 hover:bg-surface-container-lowest/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary-container/20 flex items-center justify-center font-bold text-sm text-primary shrink-0">
                            {u.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-on-surface">
                              {u.name}
                            </p>
                            <p className="text-xs text-outline">
                              @{u.username} · {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${role.cls}`}
                        >
                          {role.label}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-on-surface-variant">
                        {u.lastLoginAt
                          ? new Date(u.lastLoginAt).toLocaleDateString("tr-TR")
                          : "—"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${u.isActive ? "bg-emerald-100 text-emerald-700" : "bg-error/10 text-error"}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${u.isActive ? "bg-emerald-500" : "bg-error"}`}
                          />
                          {u.isActive ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(u)}
                            className="p-2 text-outline hover:text-primary transition-colors"
                            title="Düzenle"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              edit
                            </span>
                          </button>
                          {u.isActive && (
                            <button
                              onClick={() => handleDeactivate(u.id)}
                              className="p-2 text-outline hover:text-error transition-colors"
                              title="Pasife Al"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                person_off
                              </span>
                            </button>
                          )}
                        </div>
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
