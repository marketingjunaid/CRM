import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { contactSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const all = searchParams.get("all") === "true";

  const role = (user as any).role;
  const userId = user!.id;

  const where: any = {
    ...(role === "SALES_USER" ? { assignedToId: userId } : {}),
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { company: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  if (all) {
    const data = await prisma.contact.findMany({
      where,
      select: { id: true, firstName: true, lastName: true, email: true, company: true },
      orderBy: { firstName: "asc" },
    });
    return NextResponse.json({ data, total: data.length });
  }

  const [data, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        companyRel: { select: { id: true, name: true } },
        _count: { select: { deals: true, tasks: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.contact.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const contact = await prisma.contact.create({
    data: {
      ...parsed.data,
      email: parsed.data.email || null,
      companyId: parsed.data.companyId || null,
      createdById: user!.id,
      assignedToId: parsed.data.assignedToId || user!.id,
    },
    include: {
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  await prisma.activity.create({
    data: {
      type: "CONTACT_CREATED",
      description: `Added contact: ${contact.firstName} ${contact.lastName}`,
      userId: user!.id,
      contactId: contact.id,
    },
  });

  return NextResponse.json(contact, { status: 201 });
}
