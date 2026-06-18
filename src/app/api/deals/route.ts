import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { dealSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const stage = searchParams.get("stage") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "50");
  const pipeline = searchParams.get("pipeline") === "true";

  const role = (user as any).role;
  const userId = user!.id;

  const where: any = {
    ...(role === "SALES_USER" ? { assignedToId: userId } : {}),
    ...(stage ? { stage: stage as any } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { contact: { firstName: { contains: search, mode: "insensitive" } } },
            { company: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  if (pipeline) {
    const deals = await prisma.deal.findMany({
      where,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: [{ stage: "asc" }, { order: "asc" }],
    });
    return NextResponse.json({ data: deals, total: deals.length });
  }

  const [data, total] = await Promise.all([
    prisma.deal.findMany({
      where,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.deal.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const parsed = dealSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const maxOrder = await prisma.deal.aggregate({
    where: { stage: parsed.data.stage },
    _max: { order: true },
  });

  const deal = await prisma.deal.create({
    data: {
      ...parsed.data,
      expectedCloseDate: parsed.data.expectedCloseDate ? new Date(parsed.data.expectedCloseDate) : null,
      contactId: parsed.data.contactId || null,
      companyId: parsed.data.companyId || null,
      assignedToId: parsed.data.assignedToId || user!.id,
      createdById: user!.id,
      order: (maxOrder._max.order || 0) + 1,
    },
    include: {
      contact: { select: { id: true, firstName: true, lastName: true } },
      company: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  await prisma.activity.create({
    data: {
      type: "DEAL_CREATED",
      description: `Created deal: ${deal.title}`,
      userId: user!.id,
      dealId: deal.id,
    },
  });

  return NextResponse.json(deal, { status: 201 });
}
