import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  if (lead.status === "CONVERTED") {
    return NextResponse.json({ error: "Lead is already converted" }, { status: 400 });
  }

  const contact = await prisma.contact.create({
    data: {
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      position: lead.position,
      notes: lead.notes,
      companyId: lead.companyId,
      assignedToId: lead.assignedToId,
      createdById: user!.id,
    },
  });

  let deal = null;
  if (lead.value && lead.value > 0) {
    deal = await prisma.deal.create({
      data: {
        title: `Deal for ${lead.firstName} ${lead.lastName}`,
        value: lead.value,
        stage: "PROSPECTING",
        contactId: contact.id,
        companyId: lead.companyId,
        assignedToId: lead.assignedToId,
        createdById: user!.id,
        order: 0,
      },
    });
  }

  await prisma.lead.update({
    where: { id: params.id },
    data: { status: "CONVERTED" },
  });

  await prisma.activity.create({
    data: {
      type: "LEAD_CONVERTED",
      description: `Converted lead ${lead.firstName} ${lead.lastName} to contact`,
      userId: user!.id,
      leadId: lead.id,
      contactId: contact.id,
    },
  });

  return NextResponse.json({ contact, deal });
}
