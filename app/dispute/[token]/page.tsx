import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import ChatClient from "./ChatClient";

interface DisputePageProps {
  params: Promise<{ token: string }>;
}

export default async function DisputePage({ params }: DisputePageProps) {
  const { token } = await params;

  const chat = await prisma.disputeChat.findUnique({
    where: { secretToken: token },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!chat) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              backgroundColor: "#1a1a1a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              border: "1px solid #2a2a2a",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#666"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <line x1="9" y1="10" x2="15" y2="10" />
            </svg>
          </div>
          <h1
            style={{
              color: "#fff",
              fontSize: 20,
              fontWeight: 600,
              margin: "0 0 8px",
            }}
          >
            Chat not found
          </h1>
          <p style={{ color: "#666", fontSize: 14, margin: 0 }}>
            This dispute link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  const serializedChat = {
    id: chat.id,
    email: chat.email,
    name: chat.name,
    subject: chat.subject,
    description: chat.description,
    secretToken: chat.secretToken,
    customPageSlug: chat.customPageSlug,
    status: chat.status,
    createdAt: chat.createdAt.toISOString(),
    updatedAt: chat.updatedAt.toISOString(),
    messages: chat.messages.map((m) => ({
      id: m.id,
      chatId: m.chatId,
      sender: m.sender,
      content: m.content,
      imageUrl: m.imageUrl,
      createdAt: m.createdAt.toISOString(),
    })),
  };

  return <ChatClient chat={serializedChat} token={token} />;
}
