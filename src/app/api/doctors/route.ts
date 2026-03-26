import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/doctors — Hekim listesi
export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clinicId = (session.user as any).clinicId;

  try {
    const doctors = await prisma.doctor.findMany({
      where: { clinicId, isActive: true },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { appointments: true } },
      },
    });
    return NextResponse.json({ doctors });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST /api/doctors — Yeni hekim ekle
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clinicId = (session.user as any).clinicId;
  const body = await req.json();

  if (!body.name)
    return NextResponse.json({ error: "name zorunlu" }, { status: 400 });

  try {
    const doctor = await prisma.doctor.create({
      data: {
        clinicId,
        name: body.name,
        title: body.title,
        specialty: body.specialty,
        email: body.email,
        phone: body.phone,
        color: body.color || "#00677e",
        workingHours: body.workingHours || {},
      },
    });
    return NextResponse.json(doctor, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
