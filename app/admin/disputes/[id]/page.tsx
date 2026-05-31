import TopBar from "@/components/admin/TopBar";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import AdminDisputeChat from "@/components/admin/DisputeChat";

interface DisputeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DisputeDetailPage({
  params,
}: DisputeDetailPageProps) {
  const { id } = await params;

  const dispute = await prisma.disputeChat.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!dispute) {
    redirect("/admin/disputes");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const secretLink = `${siteUrl}/dispute/${dispute.secretToken}`;

  const serializedDispute = {
    id: dispute.id,
    email: dispute.email,
    name: dispute.name,
    subject: dispute.subject,
    description: dispute.description,
    secretToken: dispute.secretToken,
    customPageId: dispute.customPageId,
    customPageSlug: dispute.customPageSlug,
    status: dispute.status,
    createdAt: dispute.createdAt.toISOString(),
    updatedAt: dispute.updatedAt.toISOString(),
  };

  const serializedMessages = dispute.messages.map((m) => ({
    id: m.id,
    chatId: m.chatId,
    sender: m.sender,
    content: m.content,
    imageUrl: m.imageUrl,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <>
      <TopBar title="Dispute Details" />
      <div className="p-6 max-w-7xl mx-auto">
        <Link
          href="/admin/disputes"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Back to Disputes
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel - Dispute info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {dispute.subject}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {dispute.description}
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    From
                  </p>
                  <p className="text-gray-900 font-medium">{dispute.name}</p>
                  <p className="text-gray-500">{dispute.email}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Status
                  </p>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      dispute.status === "open"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        dispute.status === "open"
                          ? "bg-green-500"
                          : "bg-gray-400"
                      }`}
                    />
                    {dispute.status === "open" ? "Open" : "Closed"}
                  </span>
                </div>

                {dispute.customPageSlug && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      Related Page
                    </p>
                    <Link
                      href={`/p/${dispute.customPageSlug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-accent hover:underline"
                    >
                      /p/{dispute.customPageSlug}
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Created
                  </p>
                  <p className="text-gray-600">
                    {new Date(dispute.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Secret Link
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={secretLink}
                    className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-600 truncate"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Share this link with the user to continue the conversation
                </p>
              </div>
            </div>
          </div>

          {/* Right panel - Chat */}
          <div className="lg:col-span-2">
            <AdminDisputeChat
              dispute={serializedDispute}
              initialMessages={serializedMessages}
            />
          </div>
        </div>
      </div>
    </>
  );
}
