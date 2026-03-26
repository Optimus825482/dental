import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { patientCreateSchema } from "@/lib/validations/patient";

// GET /api/patients — Liste (search, paginate)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where = {
    clinicId: session.user.clinicId,
    isActive: true,
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: "insensitive" as const } },
        { lastName: { contains: search, mode: "insensitive" as const } },
        { phone: { contains: search } },
        { patientNo: { contains: search, mode: "insensitive" as const } },
        { tcKimlik: { contains: search } },
      ],
    }),
  };

  try {
    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        include: {
          allergies: true,
          account: true,
          _count: { select: { appointments: true, treatmentPlans: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.patient.count({ where }),
    ]);

    return NextResponse.json({
      patients,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/patients — Yeni hasta oluştur
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = patientCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const { allergies, birthDate, ...data } = parsed.data;

    // Auto-generate patientNo
    const lastPatient = await prisma.patient.findFirst({
      where: { clinicId: session.user.clinicId },
      orderBy: { patientNo: "desc" },
    });
    const nextNo = lastPatient
      ? `H${String(parseInt(lastPatient.patientNo.replace("H", "")) + 1).padStart(3, "0")}`
      : "H001";

    const patient = await prisma.patient.create({
      data: {
        ...data,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        clinicId: session.user.clinicId,
        patientNo: nextNo,
        allergies: allergies?.length
          ? { createMany: { data: allergies } }
          : undefined,
      },
      include: { allergies: true },
    });

    // Create cari hesap
    await prisma.patientAccount.create({
      data: { patientId: patient.id, balance: 0 },
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
