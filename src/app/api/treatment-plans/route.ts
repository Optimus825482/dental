import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  title: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      treatmentDefId: z.string().min(1),
      toothNumber: z.number().int().optional(),
      quantity: z.number().int().default(1),
      unitPrice: z.number(),
      discount: z.number().default(0),
    }),
  ),
});

// GET /api/treatment-plans?patientId=xxx
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");
  if (!patientId)
    return NextResponse.json({ error: "patientId gerekli" }, { status: 400 });

  try {
    const plans = await prisma.treatmentPlan.findMany({
      where: { patientId },
      include: {
        doctor: { select: { id: true, name: true } },
        items: {
          include: {
            treatmentDef: {
              select: { id: true, name: true, code: true, category: true },
            },
          },
        },
        sessions: { orderBy: { sessionNo: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ plans });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/treatment-plans — Yeni tedavi planı oluştur
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );

  try {
    const { patientId, doctorId, title, notes, items } = parsed.data;

    const totalCost = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity - item.discount,
      0,
    );

    const plan = await prisma.treatmentPlan.create({
      data: {
        patientId,
        doctorId,
        title: title || "Tedavi Planı",
        notes,
        totalCost,
        items: {
          create: items.map((item) => ({
            treatmentDefId: item.treatmentDefId,
            toothNumber: item.toothNumber,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
          })),
        },
      },
      include: {
        items: { include: { treatmentDef: true } },
        doctor: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(plan, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
