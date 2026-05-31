import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { callAI } from "@/lib/ai-providers";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, chatToken, chatId } = (await req.json()) as {
      text: string;
      chatToken?: string;
      chatId?: string;
    };

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Get AI settings
    const settings = await prisma.agentSettings.findUnique({
      where: { id: "singleton" },
    });

    const provider = (settings?.chatProvider || "groq") as
      | "anthropic"
      | "openai"
      | "groq";
    const model = settings?.chatModel || "llama-3.3-70b-versatile";

    /* ── Fetch full conversation context ── */
    let conversationContext = "";
    let userName = "the user";
    let subject = "";
    let description = "";

    if (chatToken || chatId) {
      const dispute = await prisma.disputeChat.findFirst({
        where: chatToken ? { secretToken: chatToken } : { id: chatId! },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 30, // last 30 messages for context (in chronological order)
          },
        },
      });

      if (dispute) {
        userName = dispute.name;
        subject = dispute.subject;
        description = dispute.description;

        // Build readable conversation history
        conversationContext = dispute.messages
          .map((m) => {
            const role =
              m.sender === "user"
                ? `${dispute.name} (User)`
                : m.sender === "bot"
                  ? "Bot (Auto)"
                  : "Support Agent (You)";
            return `${role}: ${m.content}`;
          })
          .join("\n");
      }
    }

    const systemPrompt = `You are a professional support agent for TruthStrike24, a news investigation platform.

Your job: Take a rough/draft support reply written by an admin and polish it to sound professional, empathetic, and clear. Match the tone of the existing conversation — if it's casual, stay casual; if it's formal, stay formal. Use the conversation history to understand the context, what's been said before, what the user is asking, and how the support has been responding.

RULES:
- Keep the CORE MEANING — don't add new claims or change what the admin wants to say
- Improve grammar, clarity, and tone
- Be concise — don't make it overly long
- Don't repeat greetings if the conversation is already underway
- Don't say "thank you for reaching out" again if a bot already did
- Address the user's actual question or concern from the conversation
- Sound like a real human, not a corporate template
- Return ONLY the polished reply text — no preamble, no "Here is...", no markdown

${subject ? `DISPUTE SUBJECT: ${subject}` : ""}
${description ? `USER'S ORIGINAL REPORT: ${description}` : ""}
${conversationContext ? `\nFULL CONVERSATION SO FAR:\n${conversationContext}` : ""}`;

    const userPrompt = `Admin's draft reply (polish this):
"${text}"

Return only the polished version.`;

    const enhanced = await callAI({
      provider,
      model,
      systemPrompt,
      userMessage: userPrompt,
      maxTokens: 512,
      purpose: "chat_enhance",
    });

    return NextResponse.json({ enhanced: enhanced.trim() });
  } catch (error) {
    console.error("[AI Enhance Error]", error);
    const message =
      error instanceof Error ? error.message : "Enhancement failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
