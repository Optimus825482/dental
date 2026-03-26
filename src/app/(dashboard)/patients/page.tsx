"use client";

import { PatientFormModal } from "@/components/patients/patient-form-modal";
import { useRouter } from "next/navigation";

// Hasta Kabul = Direkt yeni hasta kayıt formu açılır
export default function PatientsPage() {
  const router = useRouter();

  return (
    <PatientFormModal
      onClose={() => router.push("/")}
      onSuccess={(patientId) => {
        if (patientId) {
          router.push(`/patients/${patientId}`);
        } else {
          router.push("/treatments");
        }
      }}
    />
  );
}
