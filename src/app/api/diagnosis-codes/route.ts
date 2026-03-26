import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/diagnosis-codes
export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const codes = await prisma.diagnosisCode.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
  });

  return NextResponse.json({ codes });
}

// POST /api/diagnosis-codes — ADMIN only
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  if (!body.code || !body.description)
    return NextResponse.json(
      { error: "code ve description zorunlu" },
      { status: 400 },
    );

  const code = await prisma.diagnosisCode.create({
    data: {
      code: body.code.toUpperCase(),
      description: body.description,
      parentCode: body.parentCode || null,
    },
  });

  return NextResponse.json(code, { status: 201 });
}
