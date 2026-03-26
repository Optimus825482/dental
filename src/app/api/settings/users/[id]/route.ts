import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

type Params = { params: Promise<{ id: string }> };

function adminOnly(role: string) {
  return role !== "ADMIN"
    ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
    : null;
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = adminOnly((session.user as any).role);
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = await req.json();

    const data: any = {
      name: body.name,
      email: body.email,
      role: body.role,
    };

    if (body.password) {
      data.password = await bcrypt.hash(body.password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
    return NextResponse.json(user);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = adminOnly((session.user as any).role);
  if (denied) return denied;

  try {
    const { id } = await params;
    const selfId = (session.user as any).id;

    if (id === selfId)
      return NextResponse.json(
        { error: "Kendinizi silemezsiniz" },
        { status: 400 },
      );

    await prisma.user.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
