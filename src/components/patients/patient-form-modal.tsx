"use client";

import { useState } from "react";

interface Props {
  onClose: () => void;
  onSuccess: (patientId?: string) => void;
}

export function PatientFormModal({ onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [allergies, setAllergies] = useState<
    { allergen: string; severity: "LOW" | "MEDIUM" | "HIGH" }[]
  >([]);
  const [newAllergen, setNewAllergen] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const body = {
      firstName: form.get("firstName"),
      lastName: form.get("lastName"),
      tcKimlik: form.get("tcKimlik") || undefined,
      phone: form.get("phone"),
      email: form.get("email") || undefined,
      birthDate: form.get("birthDate") || undefined,
      gender: form.get("gender") || undefined,
      bloodType: form.get("bloodType") || undefined,
      address: form.get("address") || undefined,
      emergencyContact: form.get("emergencyContact") || undefined,
      emergencyPhone: form.get("emergencyPhone") || undefined,
      insuranceType: form.get("insuranceType") || undefined,
      insuranceNo: form.get("insuranceNo") || undefined,
      notes: form.get("notes") || undefined,
      allergies: allergies.length > 0 ? allergies : undefined,
    };

    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(
        data.error?.fieldErrors
          ? "Form alanlarını kontrol edin"
          : "Bir hata oluştu",
      );
      return;
    }
    const created = await res.json();
    onSuccess(created.id);
  }

  function addAllergy() {
    if (!newAllergen.trim()) return;
    setAllergies([
      ...allergies,
      { allergen: newAllergen.trim(), severity: "HIGH" },
    ]);
    setNewAllergen("");
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl os-window-shadow border border-outline-variant/20 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title Bar */}
        <div className="h-11 bg-white border-b border-outline-variant/20 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="w-3 h-3 rounded-full bg-[#FF5F56] hover:brightness-90"
              />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
            </div>
            <div className="ml-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-outline text-lg">
                person_add
              </span>
              <span className="font-headline font-bold text-sm text-on-surface-variant">
                Hasta Kabul & Yeni Kayıt
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto">
          <div className="flex flex-col md:flex-row">
            {/* Left: Photo & Status */}
            <div className="w-full md:w-1/3 bg-surface-container-low/50 p-8 flex flex-col items-center border-r border-outline-variant/10">
              <div className="w-48 h-48 rounded-3xl bg-white border-2 border-dashed border-outline-variant flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-outline mb-2">
                  add_a_photo
                </span>
                <span className="text-xs font-bold text-outline uppercase tracking-tight">
                  Fotoğraf Yükle
                </span>
              </div>
              <div className="mt-8 w-full space-y-4">
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-outline-variant/20">
                  <p className="text-[10px] text-outline font-bold uppercase mb-2">
                    Sistem Durumu
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-medium">
                      Yeni Kayıt Bekleniyor
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <div className="flex-1 p-8 space-y-6">
              {error && (
                <div className="bg-error-container/50 border border-error/20 rounded-xl p-3 text-on-error-container text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Ad Soyad */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase px-1">
                    Ad *
                  </label>
                  <input
                    name="firstName"
                    required
                    placeholder="Örn: Ahmet"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary-container focus:border-primary transition-all text-on-surface"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase px-1">
                    Soyad *
                  </label>
                  <input
                    name="lastName"
                    required
                    placeholder="Örn: Yılmaz"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary-container focus:border-primary transition-all text-on-surface"
                  />
                </div>
              </div>

              {/* TC & Telefon */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase px-1">
                    T.C. Kimlik No
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                      fingerprint
                    </span>
                    <input
                      name="tcKimlik"
                      placeholder="11 haneli numara"
                      maxLength={11}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary-container focus:border-primary transition-all text-on-surface"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase px-1">
                    Telefon *
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                      call
                    </span>
                    <input
                      name="phone"
                      required
                      placeholder="0 (5XX) XXX XX XX"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary-container focus:border-primary transition-all text-on-surface"
                    />
                  </div>
                </div>
              </div>

              {/* Doğum Tarihi, Cinsiyet, Kan Grubu */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase px-1">
                    Doğum Tarihi
                  </label>
                  <input
                    name="birthDate"
                    type="date"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary-container focus:border-primary transition-all text-on-surface"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase px-1">
                    Cinsiyet
                  </label>
                  <select
                    name="gender"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary-container focus:border-primary transition-all text-on-surface"
                  >
                    <option value="">Seçiniz</option>
                    <option value="MALE">Erkek</option>
                    <option value="FEMALE">Kadın</option>
                    <option value="OTHER">Diğer</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase px-1">
                    Kan Grubu
                  </label>
                  <select
                    name="bloodType"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary-container focus:border-primary transition-all text-on-surface"
                  >
                    <option value="">Seçiniz</option>
                    {[
                      "0Rh+",
                      "0Rh-",
                      "ARh+",
                      "ARh-",
                      "BRh+",
                      "BRh-",
                      "ABRh+",
                      "ABRh-",
                    ].map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* E-posta & Sigorta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase px-1">
                    E-posta
                  </label>
                  <input
                    name="email"
                    type="email"
                    placeholder="ornek@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary-container focus:border-primary transition-all text-on-surface"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase px-1">
                    Sigorta Türü
                  </label>
                  <select
                    name="insuranceType"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary-container focus:border-primary transition-all text-on-surface"
                  >
                    <option value="">Seçiniz</option>
                    <option value="SGK">SGK</option>
                    <option value="Özel Sigorta">Özel Sigorta</option>
                    <option value="Yok">Yok</option>
                  </select>
                </div>
              </div>

              {/* Adres */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-outline uppercase px-1">
                  Adres
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-4 text-outline text-lg">
                    location_on
                  </span>
                  <textarea
                    name="address"
                    rows={2}
                    placeholder="Mahalle, sokak, no..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary-container focus:border-primary transition-all text-on-surface resize-none"
                  />
                </div>
              </div>

              {/* Acil Durum */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase px-1">
                    Acil Durum Kişisi
                  </label>
                  <input
                    name="emergencyContact"
                    placeholder="Ad Soyad (Yakınlık)"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary-container focus:border-primary transition-all text-on-surface"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase px-1">
                    Acil Durum Telefonu
                  </label>
                  <input
                    name="emergencyPhone"
                    placeholder="0 (5XX) XXX XX XX"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary-container focus:border-primary transition-all text-on-surface"
                  />
                </div>
              </div>

              {/* Alerji — FR-010 */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-error uppercase px-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">
                    warning
                  </span>
                  Alerji Bilgisi
                </label>
                <div className="flex gap-2">
                  <input
                    value={newAllergen}
                    onChange={(e) => setNewAllergen(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addAllergy())
                    }
                    placeholder="Alerjen adı (ör: Penisilin)"
                    className="flex-1 px-4 py-3 rounded-xl border border-error-container bg-error-container/10 focus:ring-2 focus:ring-error focus:border-error transition-all text-on-surface"
                  />
                  <button
                    type="button"
                    onClick={addAllergy}
                    className="px-4 py-3 rounded-xl bg-error/10 text-error font-bold hover:bg-error hover:text-on-error transition-all"
                  >
                    Ekle
                  </button>
                </div>
                {allergies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {allergies.map((a, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-error-container/50 text-on-error-container rounded-full text-xs font-bold"
                      >
                        <span className="material-symbols-outlined text-sm">
                          warning
                        </span>
                        {a.allergen}
                        <button
                          type="button"
                          onClick={() =>
                            setAllergies(allergies.filter((_, j) => j !== i))
                          }
                          className="ml-1 hover:text-error"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Notlar */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-outline uppercase px-1">
                  Özel Notlar
                </label>
                <input
                  name="notes"
                  placeholder="Randevu notları, özel durumlar..."
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary-container focus:border-primary transition-all text-on-surface"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container transition-all active:scale-95"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-10 py-3 rounded-xl bg-primary text-on-primary font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    save
                  </span>
                  {loading ? "Kaydediliyor..." : "Kaydet ve Devam Et"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
