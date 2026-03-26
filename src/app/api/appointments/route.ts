import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  chairNo: z.number().int().min(1).default(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  type: z.string().optional(),
  notes: z.string().optional(),
  color: z.string().optional(),
  source: z.enum(["MANUAL", "ONLINE", "PHONE", "WAITLIST"]).default("MANUAL"),
});

// GET /api/appointments — Randevu listesi
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clinicId = (session.user as any).clinicId;
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const doctorId = searchParams.get("doctorId");
  const patientId = searchParams.get("patientId");
  const status = searchParams.get("status");

  const where: any = { clinicId };

  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    where.startTime = { gte: start, lte: end };
  }

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (from && to && !date) {
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    where.startTime = { gte: start, lte: end };
  }

  if (doctorId) where.doctorId = doctorId;
  if (patientId) where.patientId = patientId;
  if (status) where.status = status;

  try {
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        doctor: { select: { id: true, name: true, color: true } },
      },
      orderBy: { startTime: "asc" },
    });
    return NextResponse.json({ appointments });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST /api/appointments — Randevu oluştur
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clinicId = (session.user as any).clinicId;
  const body = await req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const appointment = await prisma.appointment.create({
      data: {
        clinicId,
        ...parsed.data,
        startTime: new Date(parsed.data.startTime),
        endTime: new Date(parsed.data.endTime),
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        doctor: { select: { id: true, name: true, color: true } },
      },
    });
    return NextResponse.json(appointment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
