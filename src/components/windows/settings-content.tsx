"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

const MENU = [
  { id: "doctors", label: "Hekim Tanımlama", icon: "medical_services" },
  { id: "users", label: "Kullanıcı Tanımlama", icon: "group" },
  { id: "team", label: "Klinik Ekibi", icon: "people" },
  { id: "treatments", label: "İşlem/Fiyat Tanımları", icon: "healing" },
];

export function SettingsContent() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const [active, setActive] = useState("doctors");

  return (
    <div className="flex h-full">
      <div className="w-56 bg-surface-container-low/30 border-r border-outline-variant/10 p-3 shrink-0 flex flex-col gap-1">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-3 mb-2">
          Klinik Yönetimi
        </p>
        {MENU.map((m) => (
          <button
            key={m.id}
            onClick={() => setActive(m.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${active === m.id ? "bg-primary text-white shadow-md" : "text-on-surface-variant hover:bg-white"}`}
          >
            <span className="material-symbols-outlined text-base">
              {m.icon}
            </span>
            {m.label}
          </button>
        ))}
      </div>
      <div className="flex-1 p-5 overflow-y-auto">
        {active === "doctors" && <DoctorsPanel isAdmin={isAdmin} />}
        {active === "users" && <UsersPanel isAdmin={isAdmin} />}
        {active === "team" && <TeamPanel isAdmin={isAdmin} />}
        {active === "treatments" && <TreatmentsPanel isAdmin={isAdmin} />}
      </div>
    </div>
  );
}

// ─── DOCTORS PANEL ──────────────────────────
function DoctorsPanel({ isAdmin }: { isAdmin: boolean }) {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    specialty: "",
    email: "",
    phone: "",
    color: "#00677e",
  });
  const [saving, setSaving] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/doctors");
    if (res.ok) {
      const d = await res.json();
      setDoctors(d.doctors || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  function openNew() {
    setEditId(null);
    setForm({
      name: "",
      specialty: "",
      email: "",
      phone: "",
      color: "#00677e",
    });
    setShowForm(true);
  }
  function openEdit(d: any) {
    setEditId(d.id);
    setForm({
      name: d.name,
      specialty: d.specialty || "",
      email: d.email || "",
      phone: d.phone || "",
      color: d.color || "#00677e",
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const url = editId ? `/api/doctors/${editId}` : "/api/doctors";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      fetch_();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu hekimi silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/doctors/${id}`, { method: "DELETE" });
    fetch_();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-headline font-bold text-xl text-on-surface">
          Hekim Tanımlama
        </h2>
        {isAdmin && (
          <button
            onClick={openNew}
            className="bg-primary text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-md hover:brightness-110 transition-all"
          >
            <span className="material-symbols-outlined text-sm">add</span>Yeni
            Hekim
          </button>
        )}
      </div>
      {showForm && isAdmin && (
        <form
          onSubmit={handleSave}
          className="bg-surface-container-low rounded-2xl p-4 mb-4 grid grid-cols-3 gap-3"
        >
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ad Soyad *"
            className="px-3 py-2 rounded-xl border border-on-surface/20 text-sm"
            required
          />
          <input
            value={form.specialty}
            onChange={(e) => setForm({ ...form, specialty: e.target.value })}
            placeholder="Uzmanlık"
            className="px-3 py-2 rounded-xl border border-on-surface/20 text-sm"
          />
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="E-posta"
            className="px-3 py-2 rounded-xl border border-on-surface/20 text-sm"
          />
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Telefon"
            className="px-3 py-2 rounded-xl border border-on-surface/20 text-sm"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs">Renk:</label>
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer"
            />
          </div>
          <div className="flex gap-2 items-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-sm disabled:opacity-50"
            >
              {saving ? "..." : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border border-outline-variant/20 text-sm"
            >
              İptal
            </button>
          </div>
        </form>
      )}
      <div className="bg-white rounded-2xl border border-outline-variant/15 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant/15">
                <th className="px-5 py-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                  Hekim
                </th>
                <th className="px-5 py-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                  Uzmanlık
                </th>
                <th className="px-5 py-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                  İletişim
                </th>
                {isAdmin && (
                  <th className="px-5 py-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-right">
                    İşlem
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-outline-variant/8">
              {doctors.map((d: any) => (
                <tr
                  key={d.id}
                  className="hover:bg-surface-container-low/30 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="font-bold">{d.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-1 bg-surface-container-high rounded-full text-[11px] font-bold">
                      {d.specialty || "Genel"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-on-surface-variant">
                    {d.email || d.phone || "-"}
                  </td>
                  {isAdmin && (
                    <td className="px-5 py-3 text-right flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(d)}
                        className="p-1.5 hover:bg-surface-container rounded-lg text-outline hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">
                          edit
                        </span>
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="p-1.5 hover:bg-error/10 rounded-lg text-outline hover:text-error transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">
                          delete
                        </span>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {doctors.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-8 text-center text-on-surface-variant text-sm"
                  >
                    Henüz hekim tanımlanmamış.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── USERS PANEL ──────────────────────────
function UsersPanel({ isAdmin }: { isAdmin: boolean }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "SECRETARY",
  });
  const [saving, setSaving] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/settings/users");
    if (res.ok) {
      const d = await res.json();
      setUsers(d.users || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  function openNew() {
    setEditId(null);
    setForm({
      name: "",
      username: "",
      email: "",
      password: "",
      role: "SECRETARY",
    });
    setShowForm(true);
  }
  function openEdit(u: any) {
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
    const url = editId
      ? `/api/settings/users/${editId}`
      : "/api/settings/users";
    const method = editId ? "PUT" : "POST";
    const body = editId
      ? {
          name: form.name,
          email: form.email,
          role: form.role,
          ...(form.password ? { password: form.password } : {}),
        }
      : form;
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setShowForm(false);
      fetch_();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/settings/users/${id}`, { method: "DELETE" });
    fetch_();
  }

  const roleColors: Record<string, string> = {
    ADMIN: "bg-primary-container/20 text-primary",
    DOCTOR: "bg-emerald-50 text-emerald-700",
    SECRETARY: "bg-amber-50 text-amber-700",
    ACCOUNTANT: "bg-violet-50 text-violet-700",
    VIEWER: "bg-surface-container text-on-surface-variant",
  };
  const roleLabels: Record<string, string> = {
    ADMIN: "Yönetici",
    DOCTOR: "Hekim",
    SECRETARY: "Sekreter",
    ACCOUNTANT: "Muhasebe",
    VIEWER: "İzleyici",
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-headline font-bold text-xl text-on-surface">
          Kullanıcı Tanımlama
        </h2>
        {isAdmin && (
          <button
            onClick={openNew}
            className="bg-primary text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-md hover:brightness-110 transition-all"
          >
            <span className="material-symbols-outlined text-sm">add</span>Yeni
            Kullanıcı
          </button>
        )}
      </div>
      {showForm && isAdmin && (
        <form
          onSubmit={handleSave}
          className="bg-surface-container-low rounded-2xl p-4 mb-4 grid grid-cols-3 gap-3"
        >
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ad Soyad *"
            className="px-3 py-2 rounded-xl border border-on-surface/20 text-sm"
            required
          />
          <input
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="Kullanıcı Adı *"
            className="px-3 py-2 rounded-xl border border-on-surface/20 text-sm"
            required={!editId}
            disabled={!!editId}
          />
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="E-posta *"
            className="px-3 py-2 rounded-xl border border-on-surface/20 text-sm"
            required
          />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={editId ? "Şifre (boş = değiştirme)" : "Şifre *"}
            className="px-3 py-2 rounded-xl border border-on-surface/20 text-sm"
            required={!editId}
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="px-3 py-2 rounded-xl border border-on-surface/20 text-sm"
          >
            {Object.entries(roleLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <div className="flex gap-2 items-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-sm disabled:opacity-50"
            >
              {saving ? "..." : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border border-outline-variant/20 text-sm"
            >
              İptal
            </button>
          </div>
        </form>
      )}
      <div className="bg-white rounded-2xl border border-outline-variant/15 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant/15">
                <th className="px-5 py-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                  Ad Soyad
                </th>
                <th className="px-5 py-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                  Kullanıcı Adı
                </th>
                <th className="px-5 py-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                  Rol
                </th>
                <th className="px-5 py-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                  Durum
                </th>
                {isAdmin && (
                  <th className="px-5 py-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-right">
                    İşlem
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-outline-variant/8">
              {users.map((u: any) => (
                <tr
                  key={u.id}
                  className="hover:bg-surface-container-low/30 transition-colors"
                >
                  <td className="px-5 py-3">
                    <p className="font-bold">{u.name}</p>
                    <p className="text-[11px] text-on-surface-variant">
                      {u.email}
                    </p>
                  </td>
                  <td className="px-5 py-3 font-mono text-[12px] text-on-surface-variant">
                    {u.username}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-[11px] font-bold ${roleColors[u.role] || ""}`}
                    >
                      {roleLabels[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-2 h-2 rounded-full ${u.isActive ? "bg-emerald-500" : "bg-outline"}`}
                      />
                      <span className="text-xs font-bold">
                        {u.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 hover:bg-surface-container rounded-lg text-outline hover:text-primary transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-1.5 hover:bg-error/10 rounded-lg text-outline hover:text-error transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-on-surface-variant text-sm"
                  >
                    Henüz kullanıcı tanımlanmamış.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── TEAM PANEL (Klinik Ekibi) ──────────────────────────
function TeamPanel({ isAdmin }: { isAdmin: boolean }) {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/doctors").then((r) => r.json()),
      fetch("/api/settings/users").then((r) => r.json()),
    ]).then(([d, u]) => {
      setDoctors(d.doctors || []);
      setUsers(u.users || []);
      setLoading(false);
    });
  }, []);

  const roleLabels: Record<string, string> = {
    ADMIN: "Yönetici",
    DOCTOR: "Hekim",
    SECRETARY: "Sekreter",
    ACCOUNTANT: "Muhasebe",
    VIEWER: "İzleyici",
  };

  if (loading)
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );

  return (
    <div className="space-y-6">
      <h2 className="font-headline font-bold text-xl text-on-surface">
        Klinik Ekibi
      </h2>

      {/* Hekimler */}
      <div>
        <p className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest mb-3">
          Hekimler
        </p>
        <div className="grid grid-cols-2 gap-3">
          {doctors.map((d: any) => (
            <div
              key={d.id}
              className="bg-white border border-outline-variant/15 rounded-2xl p-4 flex items-center gap-3"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: d.color }}
              >
                {d.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-on-surface truncate">
                  {d.name}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {d.specialty || "Genel Diş Hekimi"}
                </p>
              </div>
              <div
                className={`w-2 h-2 rounded-full ${d.isActive ? "bg-emerald-500" : "bg-outline"}`}
              />
            </div>
          ))}
          {doctors.length === 0 && (
            <p className="text-sm text-on-surface-variant col-span-2">
              Henüz hekim tanımlanmamış.
            </p>
          )}
        </div>
      </div>

      {/* Personel */}
      <div>
        <p className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest mb-3">
          Sistem Kullanıcıları
        </p>
        <div className="grid grid-cols-2 gap-3">
          {users.map((u: any) => (
            <div
              key={u.id}
              className="bg-white border border-outline-variant/15 rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary font-bold text-sm">
                {u.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-on-surface truncate">
                  {u.name}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {roleLabels[u.role] || u.role}
                </p>
              </div>
              <div
                className={`w-2 h-2 rounded-full ${u.isActive ? "bg-emerald-500" : "bg-outline"}`}
              />
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-sm text-on-surface-variant col-span-2">
              Henüz kullanıcı tanımlanmamış.
            </p>
          )}
        </div>
      </div>

      {isAdmin && (
        <p className="text-xs text-on-surface-variant">
          Ekip üyelerini düzenlemek için "Hekim Tanımlama" veya "Kullanıcı
          Tanımlama" bölümlerini kullanın.
        </p>
      )}
    </div>
  );
}

// ─── TREATMENTS PANEL ──────────────────────────
function TreatmentsPanel({ isAdmin }: { isAdmin: boolean }) {
  const [treatments, setTreatments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    category: "",
    price: "",
    duration: "30",
  });
  const [saving, setSaving] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/treatments");
    if (res.ok) {
      const d = await res.json();
      setTreatments(d.treatments || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  function openNew() {
    setEditId(null);
    setForm({ code: "", name: "", category: "", price: "", duration: "30" });
    setShowForm(true);
  }
  function openEdit(t: any) {
    setEditId(t.id);
    setForm({
      code: t.code || "",
      name: t.name,
      category: t.category || "",
      price: String(t.price),
      duration: String(t.duration),
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const url = editId ? `/api/treatments/${editId}` : "/api/treatments";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        price: parseFloat(form.price),
        duration: parseInt(form.duration),
      }),
    });
    if (res.ok) {
      setShowForm(false);
      fetch_();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu işlemi silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/treatments/${id}`, { method: "DELETE" });
    fetch_();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-headline font-bold text-xl text-on-surface">
          İşlem/Fiyat Tanımları
        </h2>
        {isAdmin && (
          <button
            onClick={openNew}
            className="bg-primary text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-md hover:brightness-110 transition-all"
          >
            <span className="material-symbols-outlined text-sm">add</span>Yeni
            İşlem
          </button>
        )}
      </div>
      {showForm && isAdmin && (
        <form
          onSubmit={handleSave}
          className="bg-surface-container-low rounded-2xl p-4 mb-4 grid grid-cols-3 gap-3"
        >
          <input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="Kod (T001)"
            className="px-3 py-2 rounded-xl border border-on-surface/20 text-sm"
          />
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="İşlem Adı *"
            className="px-3 py-2 rounded-xl border border-on-surface/20 text-sm"
            required
          />
          <input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="Kategori"
            className="px-3 py-2 rounded-xl border border-on-surface/20 text-sm"
          />
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="Fiyat (₺) *"
            className="px-3 py-2 rounded-xl border border-on-surface/20 text-sm"
            required
          />
          <input
            type="number"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
            placeholder="Süre (dk)"
            className="px-3 py-2 rounded-xl border border-on-surface/20 text-sm"
          />
          <div className="flex gap-2 items-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-sm disabled:opacity-50"
            >
              {saving ? "..." : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border border-outline-variant/20 text-sm"
            >
              İptal
            </button>
          </div>
        </form>
      )}
      <div className="bg-white rounded-2xl border border-outline-variant/15 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant/15">
                <th className="px-5 py-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                  Kod
                </th>
                <th className="px-5 py-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                  İşlem Adı
                </th>
                <th className="px-5 py-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                  Kategori
                </th>
                <th className="px-5 py-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-right">
                  Fiyat
                </th>
                <th className="px-5 py-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-right">
                  Süre
                </th>
                {isAdmin && (
                  <th className="px-5 py-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-right">
                    İşlem
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-outline-variant/8">
              {treatments.map((t: any) => (
                <tr
                  key={t.id}
                  className="hover:bg-surface-container-low/30 transition-colors"
                >
                  <td className="px-5 py-3 font-mono text-[11px] font-bold text-on-surface-variant">
                    {t.code || "-"}
                  </td>
                  <td className="px-5 py-3 font-bold text-on-surface">
                    {t.name}
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-1 bg-surface-container-high rounded-full text-[11px] font-bold">
                      {t.category || "Genel"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-bold">
                    {Number(t.price).toLocaleString("tr-TR")} ₺
                  </td>
                  <td className="px-5 py-3 text-right text-on-surface-variant">
                    {t.duration} dk
                  </td>
                  {isAdmin && (
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(t)}
                          className="p-1.5 hover:bg-surface-container rounded-lg text-outline hover:text-primary transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 hover:bg-error/10 rounded-lg text-outline hover:text-error transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {treatments.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-on-surface-variant text-sm"
                  >
                    Henüz işlem tanımlanmamış.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── SYSTEM PANEL ──────────────────────────
export function SystemSettingsContent() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "ADMIN";
  return <SystemPanel isAdmin={isAdmin} />;
}

function AccordionSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-outline-variant/15 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-container-low/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-lg">
            {icon}
          </span>
          <span className="font-bold text-on-surface">{title}</span>
        </div>
        <span
          className={`material-symbols-outlined text-outline transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          expand_more
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-outline-variant/10">
          {children}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function SystemPanel({ isAdmin }: { isAdmin: boolean }) {
  const [clinic, setClinic] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    slug: "",
  });
  const [appt, setAppt] = useState({
    openTime: "08:30",
    closeTime: "18:00",
    slotDuration: 30,
    chairCount: 3,
    reminderHours: 24,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings/clinic")
      .then((r) => r.json())
      .then((d) => {
        if (d.clinic)
          setClinic({
            name: d.clinic.name || "",
            phone: d.clinic.phone || "",
            email: d.clinic.email || "",
            address: d.clinic.address || "",
            slug: d.clinic.slug || "",
          });
        if (d.settings)
          setAppt({
            openTime: d.settings.openTime || "08:30",
            closeTime: d.settings.closeTime || "18:00",
            slotDuration: d.settings.slotDuration || 30,
            chairCount: d.settings.chairCount || 3,
            reminderHours: d.settings.reminderHours || 24,
          });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    await fetch("/api/settings/clinic", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clinic, settings: appt }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const inp =
    "w-full px-3 py-2 rounded-xl border border-outline-variant/30 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:opacity-50 disabled:bg-surface-container-low";

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );

  return (
    <div className="p-5 space-y-3 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-headline font-bold text-xl text-on-surface">
          Sistem Ayarları
        </h2>
        {isAdmin && (
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm transition-all ${saved ? "bg-emerald-600 text-white" : "bg-primary text-on-primary hover:brightness-110"} disabled:opacity-50`}
          >
            {saved ? "✓ Kaydedildi" : saving ? "Kaydediliyor..." : "💾 Kaydet"}
          </button>
        )}
      </div>

      <AccordionSection title="Klinik Bilgileri" icon="business" defaultOpen>
        <div className="grid grid-cols-2 gap-4 pt-4">
          <Field label="Klinik Adı">
            <input
              value={clinic.name}
              onChange={(e) => setClinic({ ...clinic, name: e.target.value })}
              disabled={!isAdmin}
              className={inp}
              placeholder="Klinik adı"
            />
          </Field>
          <Field label="Kısa Ad (Slug)">
            <input
              value={clinic.slug}
              onChange={(e) => setClinic({ ...clinic, slug: e.target.value })}
              disabled={!isAdmin}
              className={inp}
              placeholder="hendek-dis"
            />
          </Field>
          <Field label="Telefon">
            <input
              value={clinic.phone}
              onChange={(e) => setClinic({ ...clinic, phone: e.target.value })}
              disabled={!isAdmin}
              className={inp}
              placeholder="0264 000 00 00"
            />
          </Field>
          <Field label="E-Posta">
            <input
              type="email"
              value={clinic.email}
              onChange={(e) => setClinic({ ...clinic, email: e.target.value })}
              disabled={!isAdmin}
              className={inp}
              placeholder="info@klinik.com"
            />
          </Field>
          <Field label="Adres">
            <input
              value={clinic.address}
              onChange={(e) =>
                setClinic({ ...clinic, address: e.target.value })
              }
              disabled={!isAdmin}
              className={`${inp} col-span-2`}
              placeholder="Mahalle, İlçe, Şehir"
            />
          </Field>
        </div>
      </AccordionSection>

      <AccordionSection title="Çalışma Saatleri" icon="schedule">
        <div className="grid grid-cols-2 gap-4 pt-4">
          <Field label="Açılış Saati">
            <input
              type="time"
              value={appt.openTime}
              onChange={(e) => setAppt({ ...appt, openTime: e.target.value })}
              disabled={!isAdmin}
              className={inp}
            />
          </Field>
          <Field label="Kapanış Saati">
            <input
              type="time"
              value={appt.closeTime}
              onChange={(e) => setAppt({ ...appt, closeTime: e.target.value })}
              disabled={!isAdmin}
              className={inp}
            />
          </Field>
        </div>
      </AccordionSection>

      <AccordionSection title="Randevu Ayarları" icon="event_available">
        <div className="grid grid-cols-3 gap-4 pt-4">
          <Field label="Randevu Süresi (dk)">
            <input
              type="number"
              min={5}
              max={120}
              step={5}
              value={appt.slotDuration}
              onChange={(e) =>
                setAppt({ ...appt, slotDuration: Number(e.target.value) })
              }
              disabled={!isAdmin}
              className={inp}
            />
          </Field>
          <Field label="Koltuk Sayısı">
            <input
              type="number"
              min={1}
              max={20}
              value={appt.chairCount}
              onChange={(e) =>
                setAppt({ ...appt, chairCount: Number(e.target.value) })
              }
              disabled={!isAdmin}
              className={inp}
            />
          </Field>
          <Field label="Hatırlatma (saat önce)">
            <input
              type="number"
              min={1}
              max={72}
              value={appt.reminderHours}
              onChange={(e) =>
                setAppt({ ...appt, reminderHours: Number(e.target.value) })
              }
              disabled={!isAdmin}
              className={inp}
            />
          </Field>
        </div>
      </AccordionSection>

      <AccordionSection title="Güvenlik & Erişim" icon="security">
        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
            <div>
              <p className="text-sm font-semibold text-on-surface">
                İki Faktörlü Doğrulama
              </p>
              <p className="text-xs text-on-surface-variant">
                Tüm kullanıcılar için 2FA zorunlu kılınır
              </p>
            </div>
            <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-1 rounded-full">
              Yakında
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
            <div>
              <p className="text-sm font-semibold text-on-surface">
                Oturum Süresi
              </p>
              <p className="text-xs text-on-surface-variant">
                Hareketsizlik sonrası otomatik çıkış
              </p>
            </div>
            <select
              disabled={!isAdmin}
              className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-sm outline-none disabled:opacity-50"
            >
              <option>30 dakika</option>
              <option>1 saat</option>
              <option>4 saat</option>
              <option>8 saat</option>
            </select>
          </div>
        </div>
      </AccordionSection>

      <AccordionSection title="Bildirim Ayarları" icon="notifications">
        <div className="pt-4 space-y-3">
          {[
            {
              label: "Randevu Hatırlatmaları",
              desc: "Hasta randevusu öncesi SMS/e-posta gönder",
            },
            {
              label: "İptal Bildirimleri",
              desc: "Randevu iptallerinde personeli bilgilendir",
            },
            {
              label: "Yeni Hasta Kaydı",
              desc: "Yeni hasta kaydında yöneticiye bildirim gönder",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl"
            >
              <div>
                <p className="text-sm font-semibold text-on-surface">
                  {item.label}
                </p>
                <p className="text-xs text-on-surface-variant">{item.desc}</p>
              </div>
              <div
                className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${isAdmin ? "bg-primary cursor-pointer" : "bg-outline-variant/40 cursor-not-allowed"}`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${isAdmin ? "translate-x-4" : "translate-x-0"}`}
                />
              </div>
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection title="Sistem Bilgisi" icon="info">
        <div className="pt-4 grid grid-cols-2 gap-3">
          {[
            { label: "Versiyon", value: "v2.0.4-STABLE" },
            { label: "Veritabanı", value: "PostgreSQL" },
            { label: "Ortam", value: "Production" },
            {
              label: "Son Güncelleme",
              value: new Date().toLocaleDateString("tr-TR"),
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex justify-between items-center p-3 bg-surface-container-low rounded-xl"
            >
              <span className="text-xs text-on-surface-variant">
                {item.label}
              </span>
              <span className="text-xs font-bold text-on-surface font-mono">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </AccordionSection>
    </div>
  );
}
