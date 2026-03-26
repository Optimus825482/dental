import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updateSchema = z.object({
  patientId: z.string().min(1),
  teeth: z.array(
    z.object({
      toothNumber: z.number().int().min(11).max(48),
      condition: z.enum([
        "HEALTHY",
        "FILLING_NEEDED",
        "ROOT_CANAL",
        "EXTRACTION",
        "IMPLANT",
        "CROWN",
        "BRIDGE",
        "MISSING",
        "FILLED",
        "TREATED",
      ]),
      surface: z.string().optional(),
      notes: z.string().optional(),
    }),
  ),
});

// PUT /api/dental-chart — Diş haritası güncelle
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );

  try {
    const { patientId, teeth } = parsed.data;

    const results = await Promise.all(
      teeth.map((t) =>
        prisma.dentalChart.upsert({
          where: {
            patientId_toothNumber: { patientId, toothNumber: t.toothNumber },
          },
          create: {
            patientId,
            toothNumber: t.toothNumber,
            condition: t.condition,
            surface: t.surface,
            notes: t.notes,
          },
          update: {
            condition: t.condition,
            surface: t.surface,
            notes: t.notes,
          },
        }),
      ),
    );

    return NextResponse.json({ updated: results.length });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
