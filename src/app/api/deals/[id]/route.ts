import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { dealSchema } from "@/lib/validations";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const deal = await prisma.deal.findUnique({
    where: { id: params.id },
    include: {
      contact: { select: { id: true, firstName: true, lastName: true, email: true } },
      company: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
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
    },
  });

  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = (user as any).role;
  if (role === "SALES_USER" && deal.assignedToId !== user!.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(deal);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const existing = await prisma.deal.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = (user as any).role;
  if (role === "SALES_USER" && existing.assignedToId !== user!.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = dealSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const updated = await prisma.deal.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      expectedCloseDate: parsed.data.expectedCloseDate
        ? new Date(parsed.data.expectedCloseDate)
        : existing.expectedCloseDate,
      contactId: parsed.data.contactId !== undefined ? parsed.data.contactId || null : undefined,
      companyId: parsed.data.companyId !== undefined ? parsed.data.companyId || null : undefined,
    },
    include: {
      contact: { select: { id: true, firstName: true, lastName: true } },
      company: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  if (existing.stage !== updated.stage) {
    await prisma.activity.create({
      data: {
        type: "DEAL_STAGE_CHANGED",
        description: `Deal "${updated.title}" moved to ${updated.stage}`,
        userId: user!.id,
        dealId: updated.id,
      },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const role = (user as any).role;
  if (role === "SALES_USER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.deal.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.note.deleteMany({ where: { dealId: params.id } });
  await prisma.activity.deleteMany({ where: { dealId: params.id } });
  await prisma.task.updateMany({ where: { dealId: params.id }, data: { dealId: null } });
  await prisma.deal.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
