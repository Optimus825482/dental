export const TOOTH_NUMBERS = {
  upperRight: [18, 17, 16, 15, 14, 13, 12, 11],
  upperLeft: [21, 22, 23, 24, 25, 26, 27, 28],
  lowerLeft: [31, 32, 33, 34, 35, 36, 37, 38],
  lowerRight: [48, 47, 46, 45, 44, 43, 42, 41],
} as const;

export const APPOINTMENT_COLORS: Record<string, string> = {
  Muayene: "bg-primary-container/20 border-primary text-on-primary-container",
  Cerrahi: "bg-tertiary/10 border-tertiary text-on-tertiary-container",
  Dolgu: "bg-emerald-400/20 border-emerald-500 text-emerald-800",
  Kontrol: "bg-amber-400/20 border-amber-500 text-amber-800",
  "Kanal Tedavisi": "bg-purple-400/20 border-purple-500 text-purple-800",
  İmplant: "bg-rose-400/20 border-rose-500 text-rose-800",
};

export const ROLES_TR: Record<string, string> = {
  ADMIN: "Yönetici",
  DOCTOR: "Hekim",
  SECRETARY: "Sekreter",
  ACCOUNTANT: "Muhasebe",
  VIEWER: "İzleyici",
};
