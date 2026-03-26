"use client";

import { useWindowStore } from "@/stores/window-store";
import { OSWindow } from "@/components/layout/os-window";
import { PatientAdmissionContent } from "./patient-admission-content";
import { PatientDetailContent } from "./patient-detail-content";
import { PatientTimelineContent } from "./patient-timeline-content";
import { TreatmentsContent } from "./treatments-content";
import { CalendarContent } from "./calendar-content";
import { FinanceContent } from "./finance-content";
import { ReportsContent } from "./reports-content";
import { SettingsContent } from "./settings-content";
import { SystemSettingsContent } from "./settings-content";
import { TreatmentPlanContent } from "./treatment-plan-content";
import { RadiologyContent } from "./radiology-content";
import { UsersContent } from "./users-content";
import { DiagnosisCodesContent } from "./diagnosis-codes-content";
import { VisitDetailContent } from "./visit-detail-content";

const windowContents: Record<
  string,
  { component: React.ReactNode; width?: number; height?: number }
> = {
  patients: { component: <PatientAdmissionContent />, width: 600, height: 500 },
  treatments: { component: <TreatmentsContent />, width: 950, height: 600 },
  finance: { component: <FinanceContent />, width: 850, height: 550 },
  reports: { component: <ReportsContent />, width: 950, height: 650 },
  calendar: { component: <CalendarContent />, width: 1100, height: 700 },
  settings: { component: <SettingsContent />, width: 1000, height: 650 },
  "system-settings": {
    component: <SystemSettingsContent />,
    width: 700,
    height: 580,
  },
  radiology: { component: <RadiologyContent />, width: 1200, height: 750 },
  users: { component: <UsersContent />, width: 900, height: 600 },
  "diagnosis-codes": {
    component: <DiagnosisCodesContent />,
    width: 900,
    height: 650,
  },
};

export function WindowRenderer() {
  const { windows } = useWindowStore();
  return (
    <>
      {windows.map((win) => {
        // Dynamic visit detail windows
        if (win.id.startsWith("visit-")) {
          const parts = win.id.replace("visit-", "").split("-");
          const visitId = parts[0];
          const patientId = parts.slice(1).join("-");
          return (
            <OSWindow
              key={win.id}
              id={win.id}
              defaultWidth={780}
              defaultHeight={680}
            >
              <VisitDetailContent
                visitId={visitId}
                patientId={patientId}
                patientName={win.title.replace(" — Hasta Kabul", "")}
              />
            </OSWindow>
          );
        }
        // Dynamic patient timeline windows
        if (win.id.startsWith("timeline-")) {
          return (
            <OSWindow
              key={win.id}
              id={win.id}
              defaultWidth={900}
              defaultHeight={620}
            >
              <PatientTimelineContent
                patientId={win.id.replace("timeline-", "")}
              />
            </OSWindow>
          );
        }
        // Dynamic patient windows
        if (win.id.startsWith("patient-")) {
          return (
            <OSWindow
              key={win.id}
              id={win.id}
              defaultWidth={1000}
              defaultHeight={700}
            >
              <PatientDetailContent
                patientId={win.id.replace("patient-", "")}
              />
            </OSWindow>
          );
        }
        // Dynamic finance windows (per patient)
        if (win.id.startsWith("finance-")) {
          return (
            <OSWindow
              key={win.id}
              id={win.id}
              defaultWidth={850}
              defaultHeight={550}
            >
              <FinanceContent patientId={win.id.replace("finance-", "")} />
            </OSWindow>
          );
        }
        // Dynamic treatment plan windows (per patient)
        if (win.id.startsWith("treatment-plan-")) {
          return (
            <OSWindow
              key={win.id}
              id={win.id}
              defaultWidth={1100}
              defaultHeight={700}
            >
              <TreatmentPlanContent
                patientId={win.id.replace("treatment-plan-", "")}
              />
            </OSWindow>
          );
        }
        const config = windowContents[win.id];
        if (!config) return null;
        return (
          <OSWindow
            key={win.id}
            id={win.id}
            defaultWidth={config.width}
            defaultHeight={config.height}
          >
            {config.component}
          </OSWindow>
        );
      })}
    </>
  );
}
