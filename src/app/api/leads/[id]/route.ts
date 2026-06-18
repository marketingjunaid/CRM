import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { leadSchema } from "@/lib/validations";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
      companyRel: true,
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
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const role = (user as any).role;
  if (role === "SALES_USER" && lead.assignedToId !== user!.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(lead);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const existing = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const role = (user as any).role;
  if (role === "SALES_USER" && existing.assignedToId !== user!.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = leadSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const updated = await prisma.lead.update({
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

  await prisma.activity.create({
    data: {
      type: "LEAD_UPDATED",
      description: `Updated lead: ${updated.firstName} ${updated.lastName}`,
      userId: user!.id,
      leadId: updated.id,
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

  const existing = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  await prisma.activity.deleteMany({ where: { leadId: params.id } });
  await prisma.note.deleteMany({ where: { leadId: params.id } });
  await prisma.emailLog.deleteMany({ where: { leadId: params.id } });
  await prisma.task.updateMany({ where: { leadId: params.id }, data: { leadId: null } });
  await prisma.lead.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
