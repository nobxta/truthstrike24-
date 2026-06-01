import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import UnsubscribeClient from "./UnsubscribeClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function UnsubscribePage({ params }: Props) {
  const { token } = await params;

  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { unsubToken: token },
    select: { email: true, status: true, createdAt: true },
  });

  if (!subscriber) {
    notFound();
  }

  return (
    <UnsubscribeClient
      token={token}
      email={subscriber.email}
      alreadyUnsubscribed={subscriber.status === "unsubscribed"}
    />
  );
}
