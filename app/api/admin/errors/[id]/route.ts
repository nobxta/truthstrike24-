import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/admin/errors/:id — full error detail incl. stack + metadata
 * PATCH /api/admin/errors/:id { resolved: true } — mark resolved
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const err = await prisma.errorLog.findUnique({ where: { id: params.id } });
  if (!err) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(err);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as { resolved?: boolean };
  const updated = await prisma.errorLog.update({
    where: { id: params.id },
    data: { resolved: Boolean(body.resolved) },
  });
  return NextResponse.json(updated);
}
