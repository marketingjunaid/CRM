import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/session";
import { registerSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const role = (user as any).role;

  if (role === "SALES_USER") {
    const self = await prisma.user.findUnique({
      where: { id: user!.id },
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
    });
    return NextResponse.json({ data: [self] });
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true, updatedAt: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: users });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireRole(["ADMIN"]);
  if (error) return error;

  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(parsed.data.password, 12);

  const newUser = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      password: hashed,
      role: (parsed.data.role as any) || "SALES_USER",
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json(newUser, { status: 201 });
}
