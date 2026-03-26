import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clinicId = (session.user as any).clinicId;

  try {
    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
    const settings = (clinic?.settings as any) || {};

    return NextResponse.json({
      clinic: {
        name: clinic?.name || "",
        slug: clinic?.slug || "",
        phone: clinic?.phone || "",
        email: clinic?.email || "",
        address: clinic?.address || "",
      },
      settings: {
        openTime: settings.openTime || "08:30",
        closeTime: settings.closeTime || "18:00",
        slotDuration: settings.slotDuration || 30,
        chairCount: settings.chairCount || 3,
        reminderHours: settings.reminderHours || 24,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const clinicId = (session.user as any).clinicId;

  try {
    const body = await req.json();

    const clinicData: any = {};
    if (body.clinic?.name !== undefined) clinicData.name = body.clinic.name;
    if (body.clinic?.phone !== undefined) clinicData.phone = body.clinic.phone;
    if (body.clinic?.email !== undefined) clinicData.email = body.clinic.email;
    if (body.clinic?.address !== undefined)
      clinicData.address = body.clinic.address;
    if (body.clinic?.slug !== undefined) clinicData.slug = body.clinic.slug;

    if (body.settings) {
      const existing = await prisma.clinic.findUnique({
        where: { id: clinicId },
      });
      const existingSettings = (existing?.settings as any) || {};
      clinicData.settings = { ...existingSettings, ...body.settings };
    }

    const clinic = await prisma.clinic.update({
      where: { id: clinicId },
      data: clinicData,
    });

    return NextResponse.json({ success: true, clinic });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
