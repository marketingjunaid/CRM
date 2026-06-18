import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { companySchema } from "@/lib/validations";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAuth();
  if (error) return error;

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { id: true, name: true } },
      contacts: {
        include: { assignedTo: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      deals: {
        include: { assignedTo: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      leads: {
        orderBy: { createdAt: "desc" },
        take: 10,
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

  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(company);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const role = (user as any).role;
  if (role === "SALES_USER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.company.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = companySchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const updated = await prisma.company.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      email: parsed.data.email || null,
      website: parsed.data.website || null,
    },
    include: { createdBy: { select: { id: true, name: true } } },
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

  const existing = await prisma.company.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.note.deleteMany({ where: { companyId: params.id } });
  await prisma.activity.deleteMany({ where: { companyId: params.id } });
  await prisma.contact.updateMany({ where: { companyId: params.id }, data: { companyId: null } });
  await prisma.deal.updateMany({ where: { companyId: params.id }, data: { companyId: null } });
  await prisma.lead.updateMany({ where: { companyId: params.id }, data: { companyId: null } });
  await prisma.company.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
