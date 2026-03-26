import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/treatments — İşlem/fiyat listesi
export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clinicId = (session.user as any).clinicId;

  try {
    const treatments = await prisma.treatmentDefinition.findMany({
      where: { clinicId, isActive: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ treatments });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST /api/treatments — Yeni işlem tanımı
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clinicId = (session.user as any).clinicId;
  const body = await req.json();

  if (!body.name)
    return NextResponse.json({ error: "name zorunlu" }, { status: 400 });

  try {
    const treatment = await prisma.treatmentDefinition.create({
      data: {
        clinicId,
        code: body.code,
        name: body.name,
        category: body.category,
        price: body.price,
        duration: body.duration || 30,
        description: body.description,
      },
    });
    return NextResponse.json(treatment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
