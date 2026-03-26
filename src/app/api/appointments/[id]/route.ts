import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/appointments/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        doctor: { select: { id: true, name: true, color: true } },
      },
    });

    if (!appointment)
      return NextResponse.json(
        { error: "Randevu bulunamadı" },
        { status: 404 },
      );

    return NextResponse.json(appointment);
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// PUT /api/appointments/:id — Güncelleme
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const data: any = {};
  if (body.startTime) data.startTime = new Date(body.startTime);
  if (body.endTime) data.endTime = new Date(body.endTime);
  if (body.status) data.status = body.status;
  if (body.chairNo) data.chairNo = body.chairNo;
  if (body.type !== undefined) data.type = body.type;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.doctorId) data.doctorId = body.doctorId;

  try {
    const appointment = await prisma.appointment.update({
      where: { id },
      data,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        doctor: { select: { id: true, name: true, color: true } },
      },
    });
    return NextResponse.json(appointment);
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE /api/appointments/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await prisma.appointment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
