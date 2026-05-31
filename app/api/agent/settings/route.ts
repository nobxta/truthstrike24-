import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let settings = await prisma.agentSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      settings = await prisma.agentSettings.create({
        data: { id: "singleton" },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[Agent Settings GET Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      model?: string;
      enabled?: boolean;
      topicFocus?: string;
      postProvider?: string;
      chatProvider?: string;
      chatModel?: string;
      imageModel?: string;
      watermarkUrl?: string;
      useWebSearch?: boolean;
      wordLimit?: number;
      writingStyle?: string;
      postIntervalMinutes?: number;
      autoReplyEnabled?: boolean;
      autoReplyMinutes?: number;
    };

    const settings = await prisma.agentSettings.upsert({
      where: { id: "singleton" },
      update: {
        ...(body.model !== undefined && { model: body.model }),
        ...(body.enabled !== undefined && { enabled: body.enabled }),
        ...(body.topicFocus !== undefined && { topicFocus: body.topicFocus }),
        ...(body.postProvider !== undefined && { postProvider: body.postProvider }),
        ...(body.chatProvider !== undefined && { chatProvider: body.chatProvider }),
        ...(body.chatModel !== undefined && { chatModel: body.chatModel }),
        ...(body.imageModel !== undefined && { imageModel: body.imageModel }),
        ...(body.watermarkUrl !== undefined && { watermarkUrl: body.watermarkUrl }),
        ...(body.useWebSearch !== undefined && { useWebSearch: body.useWebSearch }),
        ...(body.wordLimit !== undefined && { wordLimit: body.wordLimit }),
        ...(body.writingStyle !== undefined && { writingStyle: body.writingStyle }),
        ...(body.postIntervalMinutes !== undefined && { postIntervalMinutes: body.postIntervalMinutes }),
        ...(body.autoReplyEnabled !== undefined && { autoReplyEnabled: body.autoReplyEnabled }),
        ...(body.autoReplyMinutes !== undefined && { autoReplyMinutes: body.autoReplyMinutes }),
      },
      create: {
        id: "singleton",
        model: body.model,
        enabled: body.enabled,
        topicFocus: body.topicFocus,
        postProvider: body.postProvider,
        chatProvider: body.chatProvider,
        chatModel: body.chatModel,
        imageModel: body.imageModel,
        watermarkUrl: body.watermarkUrl,
        useWebSearch: body.useWebSearch,
        wordLimit: body.wordLimit,
        writingStyle: body.writingStyle,
        postIntervalMinutes: body.postIntervalMinutes,
        autoReplyEnabled: body.autoReplyEnabled,
        autoReplyMinutes: body.autoReplyMinutes,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[Agent Settings PUT Error]", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
