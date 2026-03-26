import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { patientUpdateSchema } from "@/lib/validations/patient";

// GET /api/patients/:id — Hasta detay
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        allergies: true,
        medications: true,
        account: true,
        dentalChart: { orderBy: { toothNumber: "asc" } },
        documents: { orderBy: { createdAt: "desc" } },
        radiologyImages: { orderBy: { createdAt: "desc" } },
        treatmentPlans: {
          include: {
            items: { include: { treatmentDef: true } },
            sessions: true,
            doctor: true,
          },
          orderBy: { createdAt: "desc" },
        },
        appointments: {
          include: { doctor: true },
          orderBy: { startTime: "desc" },
          take: 10,
        },
      },
    });

    if (!patient || patient.clinicId !== session.user.clinicId) {
      return NextResponse.json({ error: "Hasta bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(patient);
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// PUT /api/patients/:id — Hasta güncelle
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = patientUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { birthDate, allergies, ...data } = parsed.data;

  try {
    const patient = await prisma.patient.update({
      where: { id },
      data: {
        ...data,
        birthDate: birthDate ? new Date(birthDate) : undefined,
      },
      include: { allergies: true },
    });
    return NextResponse.json(patient);
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE /api/patients/:id — Soft delete
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await prisma.patient.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
