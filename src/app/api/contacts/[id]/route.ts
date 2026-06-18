import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { contactSchema } from "@/lib/validations";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const contact = await prisma.contact.findUnique({
    where: { id: params.id },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
      companyRel: true,
      deals: {
        include: { assignedTo: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      tasks: {
        include: { assignedTo: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      notes_rel: {
        include: { createdBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      activities: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      emailLogs: {
        include: { createdBy: { select: { name: true } } },
        orderBy: { sentAt: "desc" },
      },
    },
  });

  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = (user as any).role;
  if (role === "SALES_USER" && contact.assignedToId !== user!.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(contact);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const existing = await prisma.contact.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = (user as any).role;
  if (role === "SALES_USER" && existing.assignedToId !== user!.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = contactSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const updated = await prisma.contact.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      email: parsed.data.email || null,
      companyId: parsed.data.companyId || null,
    },
    include: {
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const role = (user as any).role;
  if (role === "SALES_USER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.contact.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.note.deleteMany({ where: { contactId: params.id } });
  await prisma.activity.deleteMany({ where: { contactId: params.id } });
  await prisma.emailLog.deleteMany({ where: { contactId: params.id } });
  await prisma.task.updateMany({ where: { contactId: params.id }, data: { contactId: null } });
  await prisma.deal.updateMany({ where: { contactId: params.id }, data: { contactId: null } });
  await prisma.contact.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
