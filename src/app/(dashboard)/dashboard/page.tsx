"use client";

import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  Users,
  Target,
  DollarSign,
  CheckSquare,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import axios from "axios";
import { DashboardStats } from "@/types";
import { formatCurrency, formatEnumLabel, getLeadStatusColor, getDealStageColor, getTaskPriorityColor, formatDate } from "@/lib/utils";
import { CardSkeleton } from "@/components/ui/loading";
import Link from "next/link";

const STAGE_COLORS = ["#6366f1", "#3b82f6", "#f59e0b", "#f97316", "#22c55e", "#ef4444"];

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data } = await axios.get("/api/dashboard");
      return data;
    },
  });

  if (isLoading) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back! Here&apos;s what&apos;s happening.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: "Total Leads",
      value: stats.totalLeads,
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
      sub: `+${stats.newLeadsThisMonth} this month`,
      up: stats.newLeadsThisMonth > 0,
      href: "/leads",
    },
    {
      label: "Total Contacts",
      value: stats.totalContacts,
      icon: Users,
      color: "text-green-600",
      bg: "bg-green-50",
      sub: "Active contacts",
      href: "/contacts",
    },
    {
      label: "Open Deals",
      value: stats.openDeals,
      icon: Target,
      color: "text-orange-600",
      bg: "bg-orange-50",
      sub: `${stats.wonDeals} won · ${stats.lostDeals} lost`,
      href: "/deals",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: "text-purple-600",
      bg: "bg-purple-50",
      sub: `${formatCurrency(stats.revenueThisMonth)} this month`,
      up: stats.revenueThisMonth > 0,
      href: "/deals",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back! Here&apos;s what&apos;s happening.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color, bg, sub, up, href }) => (
          <Link href={href} key={label}>
            <div className="stat-card hover:shadow-card-hover transition-shadow cursor-pointer group">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
              <div className="text-sm text-gray-500">{label}</div>
              {sub && (
                <div className="mt-2 flex items-center gap-1">
                  {up !== undefined && (
                    up ? (
                      <ArrowUpRight className="w-3 h-3 text-green-500" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-gray-400" />
                    )
                  )}
                  <span className="text-xs text-gray-500">{sub}</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Monthly Overview</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.monthlyLeads.map((m, i) => ({
              month: m.month,
              Leads: m.count,
              Deals: stats.monthlyDeals[i]?.count || 0,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Leads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Deals" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Pipeline by Stage</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={stats.dealsByStage.filter((s) => s.count > 0)}
                dataKey="count"
                nameKey="stage"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ stage, count }) => count > 0 ? formatEnumLabel(stage) : ""}
                labelLine={false}
              >
                {stats.dealsByStage.map((_, idx) => (
                  <Cell key={idx} fill={STAGE_COLORS[idx % STAGE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val, name) => [val, formatEnumLabel(name as string)]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
            <Link href="/leads" className="text-xs text-blue-600 hover:text-blue-700">View all</Link>
          </div>
          {stats.recentActivities.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {stats.recentActivities.slice(0, 6).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-700 flex-shrink-0">
                    {activity.user?.name?.[0] || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {activity.user?.name} · {new Date(activity.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Upcoming Tasks</h3>
            <Link href="/tasks" className="text-xs text-blue-600 hover:text-blue-700">View all</Link>
          </div>
          {stats.upcomingTasks.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No upcoming tasks</p>
          ) : (
            <div className="space-y-3">
              {stats.upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3">
                  <CheckSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {task.dueDate && (
                        <span className="text-xs text-gray-500">Due {formatDate(task.dueDate)}</span>
                      )}
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${getTaskPriorityColor(task.priority)}`}>
                        {formatEnumLabel(task.priority)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card mt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={stats.monthlyDeals}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => formatCurrency(v as number)} />
            <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
