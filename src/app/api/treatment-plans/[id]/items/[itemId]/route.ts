import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type Params = { params: Promise<{ id: string; itemId: string }> };

// DELETE /api/treatment-plans/[id]/items/[itemId]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json(
      { error: "Forbidden — Admin yetkisi gerekli" },
      { status: 403 },
    );

  try {
    const { id: planId, itemId } = await params;

    const item = await prisma.treatmentPlanItem.findUnique({
      where: { id: itemId },
      include: { plan: { select: { patientId: true } } },
    });

    if (!item)
      return NextResponse.json({ error: "İşlem bulunamadı" }, { status: 404 });

    const patientId = item.plan.patientId;

    const itemTxs = await prisma.transaction.findMany({
      where: {
        patientId,
        type: "CHARGE",
        description: { contains: item.treatmentDef?.name || "" },
        relatedPlanId: planId,
      },
    });

    await prisma.treatmentPlanItem.delete({ where: { id: itemId } });

    if (itemTxs.length > 0) {
      const closest = itemTxs.reduce((prev, curr) =>
        Math.abs(Number(curr.amount) - Number(item.unitPrice)) <
        Math.abs(Number(prev.amount) - Number(item.unitPrice))
          ? curr
          : prev,
      );
      await prisma.transaction.delete({ where: { id: closest.id } });
    }

    const remainingItems = await prisma.treatmentPlanItem.findMany({
      where: { planId },
    });
    const newTotal = remainingItems.reduce(
      (sum, i) => sum + Number(i.unitPrice) * i.quantity - Number(i.discount),
      0,
    );
    await prisma.treatmentPlan.update({
      where: { id: planId },
      data: { totalCost: newTotal },
    });

    const allTxs = await prisma.transaction.findMany({ where: { patientId } });
    const balance = allTxs.reduce((sum, t) => {
      const amt = Number(t.amount);
      return ["PAYMENT", "INSURANCE", "DISCOUNT"].includes(t.type)
        ? sum + amt
        : sum - amt;
    }, 0);
    await prisma.patientAccount.upsert({
      where: { patientId },
      update: { balance },
      create: { patientId, balance },
    });

    return NextResponse.json({ success: true, newTotal });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
