"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Patient {
  id: string;
  patientNo: string;
  firstName: string;
  lastName: string;
  phone: string;
  bloodType?: string;
  allergies: { id: string; allergen: string; severity: string }[];
  account?: { balance: number };
  _count: { appointments: number; treatmentPlans: number };
}

export default function TreatmentsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
  });

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    const res = await fetch(
      `/api/patients?search=${search}&page=${pagination.page}&limit=15`,
    );
    const data = await res.json();
    setPatients(data.patients);
    setPagination(data.pagination);
    setLoading(false);
  }, [search, pagination.page]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-white rounded-xl os-window-shadow border border-outline-variant/20 overflow-hidden flex flex-col max-h-[calc(100vh-160px)]">
        {/* Title Bar */}
        <div className="h-11 bg-white border-b border-outline-variant/20 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
            </div>
            <div className="ml-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-outline text-lg">
                medical_services
              </span>
              <span className="font-headline font-bold text-sm tracking-tight text-on-surface-variant">
                İşlemler — Hasta Listesi
              </span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-6 border-b border-outline-variant/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="font-headline font-extrabold text-2xl text-on-surface">
              Hasta Listesi
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Toplam {pagination.total} kayıtlı hasta — İşlem yapmak için hasta
              seçin
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                placeholder="Ad, soyad, telefon veya TC ile ara..."
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border-transparent border focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 rounded-xl text-sm text-on-surface transition-all placeholder-outline"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-outline">
              <span className="material-symbols-outlined text-5xl mb-3">
                person_search
              </span>
              <p className="font-headline font-bold">Hasta bulunamadı</p>
              <p className="text-sm mt-1">Arama kriterlerinizi değiştirin.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/20">
                  <th className="px-6 py-3 font-headline text-[11px] font-black text-outline uppercase tracking-widest">
                    Hasta No
                  </th>
                  <th className="px-6 py-3 font-headline text-[11px] font-black text-outline uppercase tracking-widest">
                    Ad Soyad
                  </th>
                  <th className="px-6 py-3 font-headline text-[11px] font-black text-outline uppercase tracking-widest">
                    Telefon
                  </th>
                  <th className="px-6 py-3 font-headline text-[11px] font-black text-outline uppercase tracking-widest">
                    Kan Grubu
                  </th>
                  <th className="px-6 py-3 font-headline text-[11px] font-black text-outline uppercase tracking-widest">
                    Alerji
                  </th>
                  <th className="px-6 py-3 font-headline text-[11px] font-black text-outline uppercase tracking-widest">
                    Randevu
                  </th>
                  <th className="px-6 py-3 font-headline text-[11px] font-black text-outline uppercase tracking-widest">
                    Bakiye
                  </th>
                  <th className="px-6 py-3 font-headline text-[11px] font-black text-outline uppercase tracking-widest text-right">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-outline-variant/10">
                {patients.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-surface-container-low/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-surface-container px-2 py-1 rounded-md font-bold">
                        {p.patientNo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/patients/${p.id}`}
                        className="font-bold text-on-surface hover:text-primary transition-colors"
                      >
                        {p.firstName} {p.lastName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">
                      {p.phone}
                    </td>
                    <td className="px-6 py-4">
                      {p.bloodType && (
                        <span className="bg-surface-container-high px-2 py-1 rounded-md text-[11px] font-bold text-secondary uppercase">
                          {p.bloodType}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {p.allergies.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-error text-sm">
                            warning
                          </span>
                          <span className="text-xs font-bold text-error">
                            {p.allergies.length}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-outline">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-on-surface-variant">
                        {p._count.appointments}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-bold text-sm ${Number(p.account?.balance || 0) > 0 ? "text-error" : "text-on-surface"}`}
                      >
                        {new Intl.NumberFormat("tr-TR", {
                          style: "currency",
                          currency: "TRY",
                        }).format(Number(p.account?.balance || 0))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/patients/${p.id}`}
                          className="p-2 hover:bg-surface-container rounded-lg text-outline hover:text-primary transition-colors inline-flex"
                          title="Hasta Kartı"
                        >
                          <span className="material-symbols-outlined text-lg">
                            open_in_new
                          </span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-3 border-t border-outline-variant/10 flex items-center justify-between">
            <span className="text-xs text-outline">
              Sayfa {pagination.page} / {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() =>
                  setPagination((p) => ({ ...p, page: p.page - 1 }))
                }
                className="px-3 py-1 rounded-lg text-sm font-bold bg-surface-container hover:bg-surface-container-high disabled:opacity-30 transition-all"
              >
                Önceki
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  setPagination((p) => ({ ...p, page: p.page + 1 }))
                }
                className="px-3 py-1 rounded-lg text-sm font-bold bg-surface-container hover:bg-surface-container-high disabled:opacity-30 transition-all"
              >
                Sonraki
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
