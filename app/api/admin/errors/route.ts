import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/errors?status=open|all
 * Returns recent error log entries + unresolved count for the badge.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const showAll = url.searchParams.get("status") === "all";

  const [errors, unresolvedCount] = await Promise.all([
    prisma.errorLog.findMany({
      where: showAll ? {} : { resolved: false },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        source: true,
        route: true,
        message: true,
        severity: true,
        resolved: true,
        createdAt: true,
      },
    }),
    prisma.errorLog.count({ where: { resolved: false } }),
  ]);

  return NextResponse.json({ errors, unresolvedCount });
}

/**
 * DELETE /api/admin/errors?id=xxx — delete one
 * DELETE /api/admin/errors?all=1   — clear all resolved
 */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const all = url.searchParams.get("all") === "1";
  if (all) {
    const { count } = await prisma.errorLog.deleteMany({});
    return NextResponse.json({ deleted: count });
  }
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  await prisma.errorLog.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
