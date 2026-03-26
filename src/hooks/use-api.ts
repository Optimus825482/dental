"use client";

import { useState, useEffect, useCallback } from "react";

// ── Generic fetch hook ──────────────────────────────────
function useFetch<T>(url: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!url) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bilinmeyen hata");
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetch, ...deps]);

  return { data, isLoading, error, refetch };
}

// ── Doctors ─────────────────────────────────────────────
interface Doctor {
  id: string;
  name: string;
  specialty?: string;
  color: string;
  isActive: boolean;
}

export function useDentists() {
  const { data, isLoading, error, refetch } = useFetch<{ doctors: Doctor[] }>(
    "/api/doctors",
  );
  return {
    data: data?.doctors ?? [],
    isLoading,
    error,
    refetch,
  };
}

// ── Chairs (from clinic settings) ───────────────────────
interface Chair {
  id: number;
  name: string;
}

export function useChairs() {
  const [data, setData] = useState<Chair[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/settings/clinic")
      .then((r) => r.json())
      .then((d) => {
        const count = d?.settings?.chairCount ?? 3;
        setData(
          Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            name: `Koltuk ${i + 1}`,
          })),
        );
      })
      .catch(() => {
        // Fallback to 3 chairs
        setData([
          { id: 1, name: "Koltuk 1" },
          { id: 2, name: "Koltuk 2" },
          { id: 3, name: "Koltuk 3" },
        ]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { data, isLoading };
}

// ── Appointments ─────────────────────────────────────────
interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  type?: string;
  chairNo: number;
  patient: { id: string; firstName: string; lastName: string; phone: string };
  doctor: { id: string; name: string; color: string };
}

export function useAppointments(params?: {
  date?: string;
  doctorId?: string;
  from?: string;
  to?: string;
}) {
  const query = new URLSearchParams();
  if (params?.date) query.set("date", params.date);
  if (params?.doctorId) query.set("doctorId", params.doctorId);
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);

  const url = `/api/appointments?${query.toString()}`;
  const { data, isLoading, error, refetch } = useFetch<{
    appointments: Appointment[];
  }>(url);

  return {
    data: data?.appointments ?? [],
    isLoading,
    error,
    refetch,
  };
}

// ── Patients ─────────────────────────────────────────────
interface Patient {
  id: string;
  patientNo: string;
  firstName: string;
  lastName: string;
  phone: string;
  isActive: boolean;
}

export function usePatients(params?: { search?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));

  const url = `/api/patients?${query.toString()}`;
  const { data, isLoading, error, refetch } = useFetch<{
    patients: Patient[];
    pagination: { total: number; totalPages: number };
  }>(url);

  return {
    data: data?.patients ?? [],
    pagination: data?.pagination ?? null,
    isLoading,
    error,
    refetch,
  };
}

// ── Treatments ───────────────────────────────────────────
interface Treatment {
  id: string;
  code?: string;
  name: string;
  category?: string;
  price: number;
  duration: number;
}

export function useTreatments() {
  const { data, isLoading, error, refetch } = useFetch<{
    treatments: Treatment[];
  }>("/api/treatments");
  return {
    data: data?.treatments ?? [],
    isLoading,
    error,
    refetch,
  };
}
