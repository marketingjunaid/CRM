import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { companySchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const all = searchParams.get("all") === "true";

  const where: any = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { industry: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  if (all) {
    const data = await prisma.company.findMany({
      where,
      select: { id: true, name: true, industry: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ data, total: data.length });
  }

  const [data, total] = await Promise.all([
    prisma.company.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { contacts: true, deals: true, leads: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.company.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const parsed = companySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const company = await prisma.company.create({
    data: {
      ...parsed.data,
      email: parsed.data.email || null,
      website: parsed.data.website || null,
      createdById: user!.id,
    },
    include: { createdBy: { select: { id: true, name: true } } },
  });

  await prisma.activity.create({
    data: {
      type: "COMPANY_CREATED",
      description: `Added company: ${company.name}`,
      userId: user!.id,
      companyId: company.id,
    },
  });

  return NextResponse.json(company, { status: 201 });
}
