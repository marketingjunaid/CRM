import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { startOfMonth, subMonths, format } from "date-fns";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const role = (user as any).role;
  const userId = user!.id;

  const whereClause = role === "SALES_USER" ? { assignedToId: userId } : {};

  const [
    totalLeads,
    totalContacts,
    allDeals,
    recentActivities,
    upcomingTasks,
  ] = await Promise.all([
    prisma.lead.count({ where: whereClause }),
    prisma.contact.count({ where: whereClause }),
    prisma.deal.findMany({
      where: whereClause,
      select: { value: true, stage: true, createdAt: true },
    }),
    prisma.activity.findMany({
      where: role === "SALES_USER" ? { userId } : {},
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true, avatar: true } } },
    }),
    prisma.task.findMany({
      where: {
        ...(role === "SALES_USER" ? { assignedToId: userId } : {}),
        status: { not: "COMPLETED" },
        dueDate: { gte: new Date() },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      include: {
        assignedTo: { select: { name: true } },
        contact: { select: { firstName: true, lastName: true } },
        deal: { select: { title: true } },
      },
    }),
  ]);

  const totalDeals = allDeals.length;
  const totalRevenue = allDeals
    .filter((d) => d.stage === "WON")
    .reduce((sum, d) => sum + d.value, 0);
  const wonDeals = allDeals.filter((d) => d.stage === "WON").length;
  const lostDeals = allDeals.filter((d) => d.stage === "LOST").length;
  const openDeals = allDeals.filter((d) => !["WON", "LOST"].includes(d.stage)).length;

  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const newLeadsThisMonth = await prisma.lead.count({
    where: { ...whereClause, createdAt: { gte: thisMonthStart } },
  });
  const thisMonthDeals = allDeals.filter((d) => new Date(d.createdAt) >= thisMonthStart);
  const dealsClosedThisMonth = thisMonthDeals.filter((d) => d.stage === "WON").length;
  const revenueThisMonth = thisMonthDeals
    .filter((d) => d.stage === "WON")
    .reduce((sum, d) => sum + d.value, 0);

  const monthlyLeads = [];
  const monthlyDealsData = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = startOfMonth(subMonths(now, i - 1));
    const label = format(monthStart, "MMM");

    const [leads, deals] = await Promise.all([
      prisma.lead.count({
        where: { ...whereClause, createdAt: { gte: monthStart, lt: monthEnd } },
      }),
      prisma.deal.findMany({
        where: { ...whereClause, createdAt: { gte: monthStart, lt: monthEnd }, stage: "WON" },
        select: { value: true },
      }),
    ]);

    monthlyLeads.push({ month: label, count: leads });
    monthlyDealsData.push({
      month: label,
      count: deals.length,
      revenue: deals.reduce((s, d) => s + d.value, 0),
    });
  }

  const stageGroups = ["PROSPECTING", "QUALIFICATION", "PROPOSAL", "NEGOTIATION", "WON", "LOST"].map(
    (stage) => {
      const stageDeals = allDeals.filter((d) => d.stage === stage);
      return {
        stage,
        count: stageDeals.length,
        value: stageDeals.reduce((s, d) => s + d.value, 0),
      };
    }
  );

  return NextResponse.json({
    totalLeads,
    totalContacts,
    totalDeals,
    totalRevenue,
    wonDeals,
    lostDeals,
    openDeals,
    newLeadsThisMonth,
    dealsClosedThisMonth,
    revenueThisMonth,
    monthlyLeads,
    monthlyDeals: monthlyDealsData,
    dealsByStage: stageGroups,
    recentActivities,
    upcomingTasks,
  });
}
