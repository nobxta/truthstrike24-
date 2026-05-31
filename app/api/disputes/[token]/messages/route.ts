import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail, adminRepliedEmail } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json();
    const { content, imageUrl, sender } = body as {
      content: string;
      imageUrl?: string;
      sender?: string;
    };

    const messageSender = sender || "user";

    if (!content) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    if (messageSender === "admin") {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const chat = await prisma.disputeChat.findUnique({
      where: { secretToken: token },
    });

    if (!chat) {
      return NextResponse.json(
        { error: "Chat not found" },
        { status: 404 }
      );
    }

    const message = await prisma.disputeMessage.create({
      data: {
        chatId: chat.id,
        sender: messageSender,
        content,
        imageUrl: imageUrl || "",
      },
    });

    await prisma.disputeChat.update({
      where: { id: chat.id },
      data: { updatedAt: new Date() },
    });

    if (messageSender === "admin") {
      const chatUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dispute/${chat.secretToken}`;
      await sendEmail({
        to: chat.email,
        subject: `New Reply: ${chat.subject}`,
        html: adminRepliedEmail(chat.name, chatUrl),
      });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("[Dispute Message POST Error]", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
