import webpush from "web-push";
import { prisma } from "@/lib/db";

let configured = false;
function configure(): boolean {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@truthstrike24.com";
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  image?: string;
  icon?: string;
  badge?: string;
  tag?: string;
}

export async function sendPushToAll(
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  if (!configure()) return { sent: 0, failed: 0 };

  const subs = await prisma.pushSubscription.findMany({
    where: { status: "active" },
    select: { id: true, endpoint: true, p256dh: true, auth: true, failureCount: true },
  });

  const json = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          json
        );
        sent++;
        await prisma.pushSubscription.update({
          where: { id: s.id },
          data: { lastSentAt: new Date(), failureCount: 0 },
        });
      } catch (err) {
        failed++;
        const statusCode =
          err && typeof err === "object" && "statusCode" in err
            ? (err as { statusCode?: number }).statusCode
            : undefined;
        const gone = statusCode === 404 || statusCode === 410;
        const newCount = s.failureCount + 1;
        await prisma.pushSubscription.update({
          where: { id: s.id },
          data: {
            failureCount: newCount,
            status: gone || newCount >= 3 ? "unsubscribed" : "failed",
          },
        });
      }
    })
  );

  return { sent, failed };
}
