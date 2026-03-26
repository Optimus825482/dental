import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const allergySchema = z.object({
  allergen: z.string().min(1),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  notes: z.string().optional(),
});

// POST /api/patients/:id/allergies — Alerji ekle (FR-010)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = allergySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const { id } = await params;
    const allergy = await prisma.patientAllergy.create({
      data: { patientId: id, ...parsed.data },
    });
    return NextResponse.json(allergy, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/patients/:id/allergies?allergyId=xxx
export async function DELETE(
  req: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const allergyId = searchParams.get("allergyId");
  if (!allergyId)
    return NextResponse.json({ error: "allergyId gerekli" }, { status: 400 });

  try {
    await prisma.patientAllergy.delete({ where: { id: allergyId } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
