import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await params;
    const body = await req.json();
    const { status } = body as { status: string };

    if (status !== "open" && status !== "closed") {
      return NextResponse.json(
        { error: "Status must be 'open' or 'closed'" },
        { status: 400 }
      );
    }

    const chat = await prisma.disputeChat.findUnique({
      where: { secretToken: token },
    });

    if (!chat) {
      return NextResponse.json(
        { error: "Dispute not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.disputeChat.update({
      where: { id: chat.id },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Dispute Status PATCH Error]", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
