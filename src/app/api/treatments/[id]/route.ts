import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

function adminOnly(role: string) {
  return role !== "ADMIN"
    ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
    : null;
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = adminOnly((session.user as any).role);
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = await req.json();

    const treatment = await prisma.treatmentDefinition.update({
      where: { id },
      data: {
        code: body.code || null,
        name: body.name,
        category: body.category || null,
        price: body.price,
        duration: body.duration || 30,
      },
    });
    return NextResponse.json(treatment);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = adminOnly((session.user as any).role);
  if (denied) return denied;

  try {
    const { id } = await params;
    await prisma.treatmentDefinition.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
