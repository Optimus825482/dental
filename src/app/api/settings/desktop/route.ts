import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const settings = await prisma.userDesktopSettings.findUnique({
      where: { userId: session.user.id },
    });

    const blob = settings?.widgetPositions as any;

    return NextResponse.json({
      widgetsLocked: settings?.widgetsLocked ?? false,
      wallpaperId: settings?.wallpaperId ?? "default",
      zoomLevel: (settings as any)?.zoomLevel ?? 100,
      widgetPositions: blob?.positions ?? null,
      hiddenWidgets: blob?.hiddenWidgets ?? [],
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

  try {
    const body = await req.json();

    const existing = await prisma.userDesktopSettings.findUnique({
      where: { userId: session.user.id },
    });
    const existingBlob = (existing?.widgetPositions as any) ?? {};

    const newBlob = {
      positions:
        body.widgetPositions !== undefined
          ? body.widgetPositions
          : (existingBlob.positions ?? null),
      hiddenWidgets:
        body.hiddenWidgets !== undefined
          ? body.hiddenWidgets
          : (existingBlob.hiddenWidgets ?? []),
    };

    const data: Record<string, unknown> = { widgetPositions: newBlob };
    if (body.widgetsLocked !== undefined)
      data.widgetsLocked = body.widgetsLocked;
    if (body.wallpaperId !== undefined) data.wallpaperId = body.wallpaperId;
    if (body.zoomLevel !== undefined) data.zoomLevel = body.zoomLevel;

    const settings = await prisma.userDesktopSettings.upsert({
      where: { userId: session.user.id },
      update: data,
      create: {
        userId: session.user.id,
        widgetsLocked: (data.widgetsLocked as boolean) ?? false,
        wallpaperId: (data.wallpaperId as string) ?? "default",
        zoomLevel: (data.zoomLevel as number) ?? 100,
        widgetPositions: newBlob,
      },
    });

    return NextResponse.json(settings);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
