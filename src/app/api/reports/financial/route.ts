import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/reports/financial?period=monthly&year=2026&month=3
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clinicId = (session.user as any).clinicId;
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "monthly"; // daily | monthly | yearly
  const year = parseInt(
    searchParams.get("year") || String(new Date().getFullYear()),
  );
  const month = parseInt(
    searchParams.get("month") || String(new Date().getMonth() + 1),
  );

  let start: Date, end: Date;

  if (period === "daily") {
    start = new Date(year, month - 1, parseInt(searchParams.get("day") || "1"));
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setHours(23, 59, 59, 999);
  } else if (period === "yearly") {
    start = new Date(year, 0, 1);
    end = new Date(year, 11, 31, 23, 59, 59);
  } else {
    start = new Date(year, month - 1, 1);
    end = new Date(year, month, 0, 23, 59, 59);
  }

  try {
    // Tüm işlemler
    const transactions = await prisma.transaction.findMany({
      where: { patient: { clinicId }, createdAt: { gte: start, lte: end } },
      include: { patient: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
    });

    // Özet hesapla
    const totalCharge = transactions
      .filter((t) => t.type === "CHARGE")
      .reduce((s, t) => s + Number(t.amount), 0);
    const totalPayment = transactions
      .filter((t) => t.type === "PAYMENT")
      .reduce((s, t) => s + Number(t.amount), 0);
    const totalInsurance = transactions
      .filter((t) => t.type === "INSURANCE")
      .reduce((s, t) => s + Number(t.amount), 0);
    const totalDiscount = transactions
      .filter((t) => t.type === "DISCOUNT")
      .reduce((s, t) => s + Number(t.amount), 0);
    const totalRefund = transactions
      .filter((t) => t.type === "REFUND")
      .reduce((s, t) => s + Number(t.amount), 0);

    // Ödeme yöntemi dağılımı
    const byMethod: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "PAYMENT" && t.paymentMethod)
      .forEach((t) => {
        const m = t.paymentMethod!;
        byMethod[m] = (byMethod[m] || 0) + Number(t.amount);
      });

    // Günlük ciro (aylık rapor için)
    const dailyRevenue: { date: string; charge: number; payment: number }[] =
      [];
    if (period === "monthly") {
      const days = new Date(year, month, 0).getDate();
      for (let d = 1; d <= days; d++) {
        const dayStart = new Date(year, month - 1, d, 0, 0, 0);
        const dayEnd = new Date(year, month - 1, d, 23, 59, 59);
        const dayTx = transactions.filter((t) => {
          const dt = new Date(t.createdAt);
          return dt >= dayStart && dt <= dayEnd;
        });
        dailyRevenue.push({
          date: `${d}`,
          charge: dayTx
            .filter((t) => t.type === "CHARGE")
            .reduce((s, t) => s + Number(t.amount), 0),
          payment: dayTx
            .filter((t) => t.type === "PAYMENT")
            .reduce((s, t) => s + Number(t.amount), 0),
        });
      }
    }

    // Aylık ciro (yıllık rapor için)
    const monthlyRevenue: { month: string; charge: number; payment: number }[] =
      [];
    if (period === "yearly") {
      const monthNames = [
        "Oca",
        "Şub",
        "Mar",
        "Nis",
        "May",
        "Haz",
        "Tem",
        "Ağu",
        "Eyl",
        "Eki",
        "Kas",
        "Ara",
      ];
      for (let m = 0; m < 12; m++) {
        const mStart = new Date(year, m, 1);
        const mEnd = new Date(year, m + 1, 0, 23, 59, 59);
        const mTx = transactions.filter((t) => {
          const dt = new Date(t.createdAt);
          return dt >= mStart && dt <= mEnd;
        });
        monthlyRevenue.push({
          month: monthNames[m],
          charge: mTx
            .filter((t) => t.type === "CHARGE")
            .reduce((s, t) => s + Number(t.amount), 0),
          payment: mTx
            .filter((t) => t.type === "PAYMENT")
            .reduce((s, t) => s + Number(t.amount), 0),
        });
      }
    }

    return NextResponse.json({
      period,
      start,
      end,
      summary: {
        totalCharge,
        totalPayment,
        totalInsurance,
        totalDiscount,
        totalRefund,
        netBalance: totalPayment + totalInsurance - totalCharge,
      },
      byMethod,
      dailyRevenue,
      monthlyRevenue,
      transactions: transactions.slice(0, 50).map((t) => ({
        id: t.id,
        date: t.createdAt,
        patient: `${t.patient.firstName} ${t.patient.lastName}`,
        type: t.type,
        amount: Number(t.amount),
        paymentMethod: t.paymentMethod,
        description: t.description,
      })),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
