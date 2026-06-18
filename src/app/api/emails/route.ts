import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { emailLogSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const parsed = emailLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const emailLog = await prisma.emailLog.create({
    data: {
      subject: parsed.data.subject,
      message: parsed.data.message,
      recipient: parsed.data.recipient,
      leadId: parsed.data.leadId || null,
      contactId: parsed.data.contactId || null,
      createdById: user!.id,
    },
    include: { createdBy: { select: { id: true, name: true } } },
  });

  await prisma.activity.create({
    data: {
      type: "EMAIL_LOGGED",
      description: `Logged email: ${emailLog.subject}`,
      userId: user!.id,
      leadId: parsed.data.leadId || null,
      contactId: parsed.data.contactId || null,
    },
  });

  return NextResponse.json(emailLog, { status: 201 });
}
