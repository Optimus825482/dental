import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

function adminOnly(role: string) {
  return role !== "ADMIN"
    ? NextResponse.json(
        { error: "Forbidden — Admin yetkisi gerekli" },
        { status: 403 },
      )
    : null;
}

// Tedavi planından gelen işlemler silinemez (relatedPlanId varsa)
async function checkNotFromPlan(id: string) {
  const tx = await prisma.transaction.findUnique({ where: { id } });
  if (!tx)
    return NextResponse.json({ error: "İşlem bulunamadı" }, { status: 404 });
  if (tx.relatedPlanId) {
    return NextResponse.json(
      {
        error:
          "Bu işlem bir tedavi planına ait. Silmek için ilgili tedavi planına gidin.",
      },
      { status: 400 },
    );
  }
  return null;
}

// PUT /api/transactions/[id] — Düzenle (sadece ADMIN, plan işlemleri hariç)
export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const denied = adminOnly((session.user as any).role);
  if (denied) return denied;

  try {
    const { id } = await params;
    const planCheck = await checkNotFromPlan(id);
    if (planCheck) return planCheck;

    const body = await req.json();
    const data: any = {};
    if (body.amount !== undefined) data.amount = body.amount;
    if (body.description !== undefined) data.description = body.description;
    if (body.paymentMethod !== undefined)
      data.paymentMethod = body.paymentMethod;
    if (body.type !== undefined) data.type = body.type;

    const tx = await prisma.transaction.update({ where: { id }, data });
    await recalcBalance(tx.patientId);
    return NextResponse.json(tx);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/transactions/[id] — Sil (sadece ADMIN, plan işlemleri hariç)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const denied = adminOnly((session.user as any).role);
  if (denied) return denied;

  try {
    const { id } = await params;
    const planCheck = await checkNotFromPlan(id);
    if (planCheck) return planCheck;

    const tx = await prisma.transaction.findUnique({ where: { id } });
    if (!tx)
      return NextResponse.json({ error: "İşlem bulunamadı" }, { status: 404 });

    await prisma.transaction.delete({ where: { id } });
    await recalcBalance(tx.patientId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function recalcBalance(patientId: string) {
  const txs = await prisma.transaction.findMany({ where: { patientId } });
  const balance = txs.reduce((sum, t) => {
    const amt = Number(t.amount);
    if (["PAYMENT", "INSURANCE", "DISCOUNT"].includes(t.type)) return sum + amt;
    return sum - amt;
  }, 0);
  await prisma.patientAccount.upsert({
    where: { patientId },
    update: { balance },
    create: { patientId, balance },
  });
}
