import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { noteSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const parsed = noteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const note = await prisma.note.create({
    data: {
      content: parsed.data.content,
      leadId: parsed.data.leadId || null,
      contactId: parsed.data.contactId || null,
      companyId: parsed.data.companyId || null,
      dealId: parsed.data.dealId || null,
      createdById: user!.id,
    },
    include: { createdBy: { select: { id: true, name: true } } },
  });

  const entityType = parsed.data.leadId
    ? "lead"
    : parsed.data.contactId
    ? "contact"
    : parsed.data.companyId
    ? "company"
    : "deal";

  await prisma.activity.create({
    data: {
      type: "NOTE_ADDED",
      description: `Added a note`,
      userId: user!.id,
      leadId: parsed.data.leadId || null,
      contactId: parsed.data.contactId || null,
      companyId: parsed.data.companyId || null,
      dealId: parsed.data.dealId || null,
    },
  });

  return NextResponse.json(note, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Note ID required" }, { status: 400 });

  const note = await prisma.note.findUnique({ where: { id } });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (note.createdById !== user!.id && (user as any).role === "SALES_USER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.note.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
