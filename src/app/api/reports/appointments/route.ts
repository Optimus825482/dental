import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clinicId = (session.user as any).clinicId;
  const { searchParams } = new URL(req.url);
  const year = parseInt(
    searchParams.get("year") || String(new Date().getFullYear()),
  );
  const month = parseInt(
    searchParams.get("month") || String(new Date().getMonth() + 1),
  );

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  try {
    const appointments = await prisma.appointment.findMany({
      where: { clinicId, startTime: { gte: start, lte: end } },
      include: { doctor: { select: { name: true } } },
    });

    const total = appointments.length;
    const completed = appointments.filter(
      (a) => a.status === "COMPLETED",
    ).length;
    const cancelled = appointments.filter(
      (a) => a.status === "CANCELLED",
    ).length;
    const noShow = appointments.filter((a) => a.status === "NO_SHOW").length;
    const scheduled = appointments.filter((a) =>
      ["SCHEDULED", "CONFIRMED"].includes(a.status),
    ).length;

    const doctorMap: Record<string, { total: number; completed: number }> = {};
    appointments.forEach((a) => {
      const name = a.doctor.name;
      if (!doctorMap[name]) doctorMap[name] = { total: 0, completed: 0 };
      doctorMap[name].total++;
      if (a.status === "COMPLETED") doctorMap[name].completed++;
    });

    const byDoctor = Object.entries(doctorMap)
      .map(([doctorName, stats]) => ({ doctorName, ...stats }))
      .sort((a, b) => b.total - a.total);

    const dayMap: Record<string, number> = {};
    appointments.forEach((a) => {
      const day = new Date(a.startTime).toLocaleDateString("tr-TR", {
        weekday: "short",
      });
      dayMap[day] = (dayMap[day] || 0) + 1;
    });
    const byDay = Object.entries(dayMap).map(([day, count]) => ({
      day,
      count,
    }));

    return NextResponse.json({
      total,
      completed,
      cancelled,
      noShow,
      scheduled,
      byDoctor,
      byDay,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
