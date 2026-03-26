import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createSchema = z.object({
  patientId: z.string().min(1),
  type: z.enum([
    "CHARGE",
    "PAYMENT",
    "DISCOUNT",
    "REFUND",
    "INSURANCE",
    "ADJUSTMENT",
  ]),
  amount: z.number(),
  paymentMethod: z
    .enum([
      "CASH",
      "CREDIT_CARD",
      "DEBIT_CARD",
      "TRANSFER",
      "INSTALLMENT",
      "INSURANCE",
    ])
    .optional(),
  description: z.string().optional(),
  installments: z.number().int().optional(),
});

// GET /api/transactions — İşlem listesi
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");

  if (!patientId)
    return NextResponse.json({ error: "patientId gerekli" }, { status: 400 });

  try {
    const [transactions, account] = await Promise.all([
      prisma.transaction.findMany({
        where: { patientId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.patientAccount.findUnique({ where: { patientId } }),
    ]);

    return NextResponse.json({
      transactions,
      balance: account ? Number(account.balance) : 0,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/transactions — Yeni işlem (ödeme/borç)
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
    const userId = (session.user as any).id;
    const {
      patientId,
      type,
      amount,
      paymentMethod,
      description,
      installments,
    } = parsed.data;

    const transaction = await prisma.transaction.create({
      data: {
        patientId,
        type,
        amount,
        paymentMethod,
        description,
        installments,
        createdBy: userId,
      },
    });

    const balanceChange =
      type === "CHARGE"
        ? -Math.abs(amount)
        : type === "PAYMENT"
          ? Math.abs(amount)
          : type === "DISCOUNT"
            ? Math.abs(amount)
            : type === "REFUND"
              ? -Math.abs(amount)
              : type === "INSURANCE"
                ? Math.abs(amount)
                : amount;

    await prisma.patientAccount.upsert({
      where: { patientId },
      create: { patientId, balance: balanceChange },
      update: { balance: { increment: balanceChange } },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
