import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

function adminOnly(role: string) {
  return role !== "ADMIN"
    ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
    : null;
}

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = adminOnly((session.user as any).role);
  if (denied) return denied;

  const clinicId = (session.user as any).clinicId;

  try {
    const users = await prisma.user.findMany({
      where: { clinicId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ users });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = adminOnly((session.user as any).role);
  if (denied) return denied;

  const clinicId = (session.user as any).clinicId;

  try {
    const body = await req.json();

    if (!body.name || !body.username || !body.email || !body.password)
      return NextResponse.json(
        { error: "Zorunlu alanlar eksik" },
        { status: 400 },
      );

    const hashed = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
      data: {
        clinicId,
        name: body.name,
        username: body.username,
        email: body.email,
        password: hashed,
        role: body.role || "SECRETARY",
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
