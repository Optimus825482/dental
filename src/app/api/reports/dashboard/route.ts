import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/reports/dashboard — Dashboard KPI verileri
export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clinicId = (session.user as any).clinicId;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      todayAppointments,
      completedToday,
      cancelledToday,
      newPatientsMonth,
      topTreatments,
      recentAppointments,
    ] = await Promise.all([
      prisma.appointment.count({
        where: { clinicId, startTime: { gte: today, lt: tomorrow } },
      }),
      prisma.appointment.count({
        where: {
          clinicId,
          startTime: { gte: today, lt: tomorrow },
          status: "COMPLETED",
        },
      }),
      prisma.appointment.count({
        where: {
          clinicId,
          startTime: { gte: today, lt: tomorrow },
          status: "CANCELLED",
        },
      }),
      prisma.patient.count({
        where: { clinicId, createdAt: { gte: monthStart } },
      }),
      prisma.appointment.groupBy({
        by: ["type"],
        where: {
          clinicId,
          startTime: { gte: monthStart },
          type: { not: null },
        },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 6,
      }),
      prisma.appointment.findMany({
        where: { clinicId, startTime: { gte: today, lt: tomorrow } },
        include: {
          patient: { select: { firstName: true, lastName: true } },
          doctor: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      kpis: {
        todayAppointments,
        completedToday,
        cancelledToday,
        newPatientsMonth,
      },
      topTreatments: topTreatments.map((t) => ({
        name: t.type || "Diğer",
        count: t._count.id,
      })),
      recentActivity: recentAppointments.map((a) => ({
        id: a.id,
        time: a.startTime,
        patient: `${a.patient.firstName} ${a.patient.lastName}`,
        doctor: a.doctor.name,
        type: a.type || "Randevu",
        status: a.status,
      })),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
