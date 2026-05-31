import TopBar from "@/components/admin/TopBar";
import { prisma } from "@/lib/db";
import { MessageSquare } from "lucide-react";
import Link from "next/link";

export default async function DisputesPage() {
  const disputes = await prisma.disputeChat.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { messages: true },
      },
    },
  });

  return (
    <>
      <TopBar title="Disputes" />
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <MessageSquare size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                Dispute Reports
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                {disputes.length}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Manage user dispute reports and conversations
            </p>
          </div>
        </div>

        {disputes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <MessageSquare
              size={40}
              className="mx-auto text-gray-300 mb-3"
            />
            <p className="text-gray-500 font-medium">No disputes yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Disputes submitted by users will appear here
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    From
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Page
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                    Messages
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {disputes.map((dispute) => (
                  <tr
                    key={dispute.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            dispute.status === "open"
                              ? "bg-green-500"
                              : "bg-gray-400"
                          }`}
                        />
                        <span
                          className={`text-xs font-medium capitalize ${
                            dispute.status === "open"
                              ? "text-green-700"
                              : "text-gray-500"
                          }`}
                        >
                          {dispute.status}
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/disputes/${dispute.id}`}
                        className="font-medium text-gray-900 hover:text-accent transition-colors"
                      >
                        {dispute.subject}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="text-gray-900 font-medium">
                          {dispute.name}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {dispute.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {dispute.customPageSlug ? (
                        <Link
                          href={`/p/${dispute.customPageSlug}`}
                          target="_blank"
                          className="text-xs text-accent hover:underline"
                        >
                          /p/{dispute.customPageSlug}
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400">--</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                        {dispute._count.messages}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {new Date(dispute.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {new Date(dispute.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
