import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/patients/visit?patientId=xxx
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");
  if (!patientId)
    return NextResponse.json({ error: "patientId gerekli" }, { status: 400 });

  try {
    const visits = await prisma.activityLog.findMany({
      where: { action: "VISIT", entity: "Patient", entityId: patientId },
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ visits });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/patients/visit — Geliş kaydı oluştur
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { patientId, visitDate, reason } = body;
    if (!patientId || !reason)
      return NextResponse.json(
        { error: "patientId ve reason zorunlu" },
        { status: 400 },
      );

    const userId = (session.user as any).id;

    const visit = await prisma.activityLog.create({
      data: {
        userId,
        action: "VISIT",
        entity: "Patient",
        entityId: patientId,
        details: {
          visitDate: visitDate || new Date().toISOString().slice(0, 10),
          reason,
          diagnosis: null,
          diagnosisCode: null,
          diagnosisDoctorId: null,
          treatments: [],
          status: "open",
        },
      },
      include: { user: { select: { name: true, role: true } } },
    });
    return NextResponse.json(visit);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT /api/patients/visit — Visit detaylarını güncelle (teşhis, tedavi)
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { visitId, details } = body;
    if (!visitId)
      return NextResponse.json({ error: "visitId gerekli" }, { status: 400 });

    const existing = await prisma.activityLog.findUnique({
      where: { id: visitId },
    });
    if (!existing)
      return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });

    const updated = await prisma.activityLog.update({
      where: { id: visitId },
      data: { details: { ...(existing.details as any), ...details } },
      include: { user: { select: { name: true, role: true } } },
    });
    return NextResponse.json(updated);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
