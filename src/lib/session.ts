import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { SessionUser } from "@/types";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user: session.user as unknown as SessionUser, error: null };
}

export async function requireRole(roles: string[]) {
  const { user, error } = await requireAuth();
  if (error) return { user: null, error };

  if (!roles.includes((user as any).role)) {
    return {
      user: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { user, error: null };
}

export function buildWhereClause(userId: string, role: string, assignedField = "assignedToId") {
  if (role === "SALES_USER") {
    return { [assignedField]: userId };
  }
  return {};
}
