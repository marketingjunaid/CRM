import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  if (q.length < 2) {
    return NextResponse.json({ leads: [], contacts: [], companies: [], deals: [] });
  }

  const role = (user as any).role;
  const userId = user!.id;
  const filter = role === "SALES_USER" ? { assignedToId: userId } : {};

  const searchFilter = { mode: "insensitive" as const };

  const [leads, contacts, companies, deals] = await Promise.all([
    prisma.lead.findMany({
      where: {
        ...filter,
        OR: [
          { firstName: { contains: q, ...searchFilter } },
          { lastName: { contains: q, ...searchFilter } },
          { email: { contains: q, ...searchFilter } },
          { company: { contains: q, ...searchFilter } },
        ],
      },
      select: { id: true, firstName: true, lastName: true, email: true, company: true, status: true },
      take: 5,
    }),
    prisma.contact.findMany({
      where: {
        ...filter,
        OR: [
          { firstName: { contains: q, ...searchFilter } },
          { lastName: { contains: q, ...searchFilter } },
          { email: { contains: q, ...searchFilter } },
          { company: { contains: q, ...searchFilter } },
        ],
      },
      select: { id: true, firstName: true, lastName: true, email: true, company: true },
      take: 5,
    }),
    prisma.company.findMany({
      where: {
        OR: [
          { name: { contains: q, ...searchFilter } },
          { industry: { contains: q, ...searchFilter } },
          { email: { contains: q, ...searchFilter } },
        ],
      },
      select: { id: true, name: true, industry: true, email: true },
      take: 5,
    }),
    prisma.deal.findMany({
      where: {
        ...filter,
        title: { contains: q, ...searchFilter },
      },
      select: { id: true, title: true, value: true, stage: true },
      take: 5,
    }),
  ]);

  return NextResponse.json({ leads, contacts, companies, deals });
}
