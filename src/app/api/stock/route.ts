import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/stock — Ürün/stok listesi
export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clinicId = (session.user as any).clinicId;

  try {
    const products = await prisma.product.findMany({
      where: { clinicId, isActive: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST /api/stock — Yeni ürün ekle
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clinicId = (session.user as any).clinicId;
  const body = await req.json();

  if (!body.name)
    return NextResponse.json({ error: "name zorunlu" }, { status: 400 });

  try {
    const product = await prisma.product.create({
      data: {
        clinicId,
        name: body.name,
        sku: body.sku,
        category: body.category,
        unit: body.unit || "adet",
        currentStock: body.currentStock || 0,
        minStock: body.minStock || 5,
        price: body.price || 0,
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
