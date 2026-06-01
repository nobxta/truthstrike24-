import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail, disputeCreatedEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, subject, description, customPageId, customPageSlug } = body as {
      email: string;
      name: string;
      subject: string;
      description: string;
      customPageId?: string;
      customPageSlug?: string;
    };

    if (!email || !name || !subject || !description) {
      return NextResponse.json(
        { error: "Missing required fields: email, name, subject, description" },
        { status: 400 }
      );
    }

    const chat = await prisma.disputeChat.create({
      data: {
        email,
        name,
        subject,
        description,
        customPageId: customPageId || null,
        customPageSlug: customPageSlug || "",
        messages: {
          create: [
            {
              sender: "user",
              content: description,
            },
            {
              sender: "bot",
              content: `Hey ${name}, thanks for reaching out to our support team regarding "${subject}". We've received your report and our support agent will review it and get back to you shortly. You'll receive an email notification when we reply.`,
            },
          ],
        },
      },
    });

    const chatUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dispute/${chat.secretToken}`;

    await sendEmail({
      to: email,
      subject: `Dispute Received: ${subject}`,
      html: disputeCreatedEmail(name, chatUrl, subject),
      from: "support",
      replyTo: "support",
    });

    return NextResponse.json({ success: true, chatUrl });
  } catch (error) {
    console.error("[Disputes POST Error]", error);
    return NextResponse.json(
      { error: "Failed to create dispute" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const disputes = await prisma.disputeChat.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json(disputes);
  } catch (error) {
    console.error("[Disputes GET Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch disputes" },
      { status: 500 }
    );
  }
}
