import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

function adminOnly(role: string) {
  return role !== "ADMIN"
    ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
    : null;
}

// PUT /api/diagnosis-codes/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const denied = adminOnly((session.user as any).role);
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.diagnosisCode.update({
      where: { id },
      data: {
        code: body.code?.toUpperCase(),
        description: body.description,
        parentCode: body.parentCode ?? undefined,
        isActive: body.isActive ?? undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/diagnosis-codes/[id] — soft delete
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const denied = adminOnly((session.user as any).role);
  if (denied) return denied;

  try {
    const { id } = await params;
    await prisma.diagnosisCode.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
