import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callAI } from "@/lib/ai-providers";
import { sendEmail, adminRepliedEmail } from "@/lib/email";

/**
 * Auto-reply to disputes where admin hasn't responded within the configured time.
 * Triggered by a cron job (e.g., every 15 minutes).
 */
export async function GET() {
  try {
    const settings = await prisma.agentSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings?.autoReplyEnabled) {
      return NextResponse.json({ skipped: true, reason: "Auto-reply disabled" });
    }

    const delayMinutes = settings.autoReplyMinutes || 60;
    const cutoff = new Date(Date.now() - delayMinutes * 60 * 1000);

    // Find open disputes where:
    // 1. Last message is from "user" (admin hasn't replied yet)
    // 2. Last message was sent before the cutoff time
    const disputes = await prisma.disputeChat.findMany({
      where: {
        status: "open",
      },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const needsReply = disputes.filter((d) => {
      const lastMsg = d.messages[0];
      if (!lastMsg) return false;
      // Only auto-reply if last message is from user and it's older than cutoff
      return (
        lastMsg.sender === "user" &&
        new Date(lastMsg.createdAt) < cutoff
      );
    });

    if (needsReply.length === 0) {
      return NextResponse.json({ replied: 0 });
    }

    const provider = (settings.chatProvider || "groq") as "anthropic" | "openai" | "groq";
    const model = settings.chatModel || "llama-3.3-70b-versatile";

    let repliedCount = 0;

    for (const dispute of needsReply) {
      try {
        // Get full conversation for context (last 30 messages, chronological)
        const allMessages = await prisma.disputeMessage.findMany({
          where: { chatId: dispute.id },
          orderBy: { createdAt: "asc" },
          take: 30,
        });

        // Build readable conversation with clear role labels
        const conversationContext = allMessages
          .map((m) => {
            const role =
              m.sender === "user"
                ? `${dispute.name} (User)`
                : m.sender === "bot"
                  ? "Bot (Previous Auto-Reply)"
                  : "Support Agent";
            return `${role}: ${m.content}`;
          })
          .join("\n");

        // Count messages by sender to understand state
        const userMsgCount = allMessages.filter((m) => m.sender === "user").length;
        const adminMsgCount = allMessages.filter((m) => m.sender === "admin").length;
        const botMsgCount = allMessages.filter((m) => m.sender === "bot").length;
        const lastUserMsg = [...allMessages].reverse().find((m) => m.sender === "user");

        const systemPrompt = `You are a professional support agent for TruthStrike24, a news investigation platform. Your job is to write a helpful follow-up reply because a human admin hasn't responded yet.

CONTEXT YOU HAVE:
- The user's name, the dispute subject, and the FULL conversation history
- How many messages each party has sent
- The user's most recent message

WRITING RULES:
- Read the WHOLE conversation carefully — understand the tone, what's been asked, what's been answered
- Match the conversation's existing tone (casual stays casual, formal stays formal)
- Address the user's MOST RECENT message specifically — don't repeat what's already been said
- If a bot greeting already exists, DON'T greet again — continue naturally
- If the user asked a specific question, acknowledge it and explain a human is reviewing
- Use the user's actual name (${dispute.name}), never placeholders
- Keep it concise: 2-3 sentences, sounds human, empathetic
- Return ONLY the reply message — no preamble, no quotes, no markdown

CONVERSATION STATE:
- Total messages: ${allMessages.length}
- User sent: ${userMsgCount}
- Admin sent: ${adminMsgCount}
- Bot sent: ${botMsgCount}
- This will be a ${botMsgCount === 0 ? "FIRST auto-reply" : "FOLLOW-UP auto-reply"}`;

        const userPrompt = `DISPUTE SUBJECT: ${dispute.subject}
ORIGINAL REPORT: ${dispute.description}

FULL CONVERSATION:
${conversationContext}

USER'S LAST MESSAGE: "${lastUserMsg?.content || dispute.description}"

Write your follow-up reply now:`;

        const reply = await callAI({
          provider,
          model,
          systemPrompt,
          userMessage: userPrompt,
          maxTokens: 320,
          purpose: "auto_reply",
        });

        if (reply.trim()) {
          await prisma.disputeMessage.create({
            data: {
              chatId: dispute.id,
              sender: "bot",
              content: reply.trim(),
            },
          });

          await prisma.disputeChat.update({
            where: { id: dispute.id },
            data: { updatedAt: new Date() },
          });

          // Notify user by email
          const chatUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dispute/${dispute.secretToken}`;
          await sendEmail({
            to: dispute.email,
            subject: `Update on: ${dispute.subject}`,
            html: adminRepliedEmail(dispute.name, chatUrl),
          });

          repliedCount++;
        }
      } catch (err) {
        console.error(`[Auto-reply error for ${dispute.id}]`, err);
      }
    }

    return NextResponse.json({ replied: repliedCount });
  } catch (error) {
    console.error("[Auto-reply Error]", error);
    return NextResponse.json(
      { error: "Auto-reply failed" },
      { status: 500 }
    );
  }
}
