"use client";

export function CalendarIcon() {
  const now = new Date();
  const day = now.getDate();
  const monthNames = [
    "OCA",
    "ŞUB",
    "MAR",
    "NİS",
    "MAY",
    "HAZ",
    "TEM",
    "AĞU",
    "EYL",
    "EKİ",
    "KAS",
    "ARA",
  ];
  const dayNames = ["PAZ", "PZT", "SAL", "ÇAR", "PER", "CUM", "CMT"];
  return (
    <svg viewBox="0 0 30 38" fill="none" className="w-8 h-9">
      <rect x="1" y="1" width="28" height="36" rx="4" fill="white" />
      <rect x="1" y="1" width="28" height="11" rx="4" fill="#ef4444" />
      <rect x="1" y="7" width="28" height="5" fill="#ef4444" />
      <text
        x="15"
        y="9"
        fontSize="5.5"
        fontWeight="bold"
        textAnchor="middle"
        fill="white"
        fontFamily="system-ui"
      >
        {monthNames[now.getMonth()]}
      </text>
      <text
        x="15"
        y="18"
        fontSize="4.5"
        textAnchor="middle"
        fill="#64748b"
        fontFamily="system-ui"
      >
        {dayNames[now.getDay()]}
      </text>
      <text
        x="15"
        y="31"
        fontSize="17"
        fontWeight="bold"
        textAnchor="middle"
        fill="#1e293b"
        fontFamily="system-ui"
      >
        {day}
      </text>
    </svg>
  );
}

export function AppIcon({ id }: { id: string }) {
  const icons: Record<string, React.ReactNode> = {
    patients: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <path
          d="M12 2L4 6v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V6l-8-4z"
          fill="white"
          fillOpacity="0.2"
          stroke="white"
          strokeWidth="1.5"
        />
        <circle cx="12" cy="8" r="2" fill="white" />
        <path
          d="M8 16v-1c0-2 1.5-3.5 4-3.5s4 1.5 4 3.5v1"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M10 18l1.5 1.5L14 17"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    treatments: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <circle cx="7" cy="6" r="3" fill="white" />
        <path
          d="M1 19v-1.5c0-3 2-5.5 6-5.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect
          x="12"
          y="4"
          width="10"
          height="16"
          rx="2"
          fill="white"
          fillOpacity="0.15"
          stroke="white"
          strokeWidth="1.5"
        />
        <circle cx="15" cy="8" r="1" fill="white" />
        <rect x="17" y="7.5" width="4" height="1" rx="0.5" fill="white" />
        <circle cx="15" cy="12" r="1" fill="white" />
        <rect x="17" y="11.5" width="4" height="1" rx="0.5" fill="white" />
        <circle cx="15" cy="16" r="1" fill="white" />
        <rect x="17" y="15.5" width="4" height="1" rx="0.5" fill="white" />
      </svg>
    ),
    finance: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <rect
          x="2"
          y="1"
          width="20"
          height="22"
          rx="2"
          fill="white"
          fillOpacity="0.15"
          stroke="white"
          strokeWidth="1.5"
        />
        <rect
          x="4"
          y="3"
          width="16"
          height="4"
          rx="1"
          fill="white"
          fillOpacity="0.8"
        />
        <rect
          x="4"
          y="9"
          width="16"
          height="8"
          rx="1"
          fill="white"
          fillOpacity="0.1"
        />
        <path
          d="M5 15l3-2 3 1 3-3 3 2 2-1"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="8" cy="13" r="1" fill="white" />
        <circle cx="11" cy="14" r="1" fill="white" />
        <circle cx="14" cy="11" r="1" fill="white" />
        <circle cx="17" cy="13" r="1" fill="white" />
        <rect
          x="4"
          y="19"
          width="8"
          height="1.5"
          rx="0.75"
          fill="white"
          fillOpacity="0.5"
        />
        <rect
          x="14"
          y="19"
          width="6"
          height="3"
          rx="1"
          fill="white"
          fillOpacity="0.2"
        />
      </svg>
    ),
    reports: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <rect
          x="1"
          y="2"
          width="22"
          height="20"
          rx="2"
          fill="white"
          fillOpacity="0.15"
        />
        <rect
          x="3"
          y="4"
          width="8"
          height="6"
          rx="1"
          fill="white"
          fillOpacity="0.4"
        />
        <path
          d="M5 8h4M5 6h2"
          stroke="white"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <rect
          x="13"
          y="4"
          width="8"
          height="6"
          rx="1"
          fill="white"
          fillOpacity="0.25"
        />
        <path
          d="M15 8h4M15 6h3"
          stroke="white"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <rect
          x="3"
          y="12"
          width="18"
          height="8"
          rx="1"
          fill="white"
          fillOpacity="0.1"
        />
        <rect
          x="5"
          y="16"
          width="2"
          height="3"
          rx="0.5"
          fill="white"
          fillOpacity="0.9"
        />
        <rect
          x="8"
          y="14"
          width="2"
          height="5"
          rx="0.5"
          fill="white"
          fillOpacity="0.8"
        />
        <rect
          x="11"
          y="15"
          width="2"
          height="4"
          rx="0.5"
          fill="white"
          fillOpacity="0.7"
        />
        <rect
          x="14"
          y="13"
          width="2"
          height="6"
          rx="0.5"
          fill="white"
          fillOpacity="0.9"
        />
        <rect
          x="17"
          y="14"
          width="2"
          height="5"
          rx="0.5"
          fill="white"
          fillOpacity="0.6"
        />
      </svg>
    ),
    calendar: <CalendarIcon />,
    settings: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <rect
          x="1"
          y="2"
          width="22"
          height="20"
          rx="2"
          fill="white"
          fillOpacity="0.1"
        />
        <rect
          x="3"
          y="4"
          width="10"
          height="8"
          rx="1"
          fill="white"
          fillOpacity="0.1"
        />
        <circle
          cx="8"
          cy="8"
          r="3"
          stroke="white"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M8 6v2l1.5 1.5"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <rect
          x="15"
          y="4"
          width="6"
          height="3"
          rx="1"
          fill="white"
          fillOpacity="0.7"
        />
        <rect
          x="15"
          y="9"
          width="6"
          height="3"
          rx="1"
          fill="white"
          fillOpacity="0.5"
        />
        <rect
          x="3"
          y="14"
          width="6"
          height="6"
          rx="1"
          fill="white"
          fillOpacity="0.1"
        />
        <rect
          x="5"
          y="16"
          width="2"
          height="2"
          rx="0.5"
          fill="white"
          fillOpacity="0.9"
        />
        <rect
          x="11"
          y="14"
          width="6"
          height="6"
          rx="1"
          fill="white"
          fillOpacity="0.1"
        />
        <rect
          x="13"
          y="16"
          width="2"
          height="2"
          rx="0.5"
          fill="white"
          fillOpacity="0.9"
        />
        <rect
          x="19"
          y="14"
          width="4"
          height="6"
          rx="1"
          fill="white"
          fillOpacity="0.1"
        />
        <circle cx="21" cy="17" r="1" fill="white" fillOpacity="0.7" />
        <path
          d="M20 20l0.5 0.5 1.5-1.5"
          stroke="white"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    ),
    radiology: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <rect
          x="2"
          y="2"
          width="20"
          height="20"
          rx="3"
          fill="white"
          fillOpacity="0.1"
          stroke="white"
          strokeWidth="1.5"
        />
        <ellipse
          cx="12"
          cy="12"
          rx="7"
          ry="5"
          stroke="white"
          strokeWidth="1.5"
          fillOpacity="0"
        />
        <circle cx="12" cy="12" r="2" fill="white" fillOpacity="0.9" />
        <path
          d="M5 12h2M17 12h2M12 5v2M12 17v2"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    "diagnosis-codes": (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <rect
          x="3"
          y="2"
          width="18"
          height="20"
          rx="3"
          fill="white"
          fillOpacity="0.15"
          stroke="white"
          strokeWidth="1.5"
        />
        <path
          d="M7 7h4M7 11h6M7 15h5"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M14 7h3M15 11h2M14 15h3"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity="0.5"
        />
      </svg>
    ),
  };
  return <>{icons[id] || null}</>;
}
