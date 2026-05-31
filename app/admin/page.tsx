import TopBar from "@/components/admin/TopBar";
import { prisma } from "@/lib/db";
import {
  FileText,
  Newspaper,
  PenLine,
  CalendarClock,
  FolderOpen,
  Tags,
} from "lucide-react";

async function getStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalPosts, postsToday, drafts, scheduled, totalCategories, totalTags] =
    await Promise.all([
      prisma.post.count(),
      prisma.post.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.post.count({ where: { status: "draft" } }),
      prisma.post.count({ where: { status: "scheduled" } }),
      prisma.category.count(),
      prisma.tag.count(),
    ]);

  return { totalPosts, postsToday, drafts, scheduled, totalCategories, totalTags };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const statCards = [
    { label: "Total Posts", value: stats.totalPosts, icon: FileText, color: "bg-blue-50 text-blue-600" },
    { label: "Posts Today", value: stats.postsToday, icon: Newspaper, color: "bg-green-50 text-green-600" },
    { label: "Drafts", value: stats.drafts, icon: PenLine, color: "bg-yellow-50 text-yellow-600" },
    { label: "Scheduled", value: stats.scheduled, icon: CalendarClock, color: "bg-purple-50 text-purple-600" },
    { label: "Categories", value: stats.totalCategories, icon: FolderOpen, color: "bg-pink-50 text-pink-600" },
    { label: "Tags", value: stats.totalTags, icon: Tags, color: "bg-indigo-50 text-indigo-600" },
  ];

  return (
    <>
      <TopBar title="Dashboard" />
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="bg-white rounded-lg border border-gray-200 p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <p className="text-3xl font-bold text-navy mt-1">
                      {card.value}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.color}`}
                  >
                    <Icon size={24} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-navy mb-2">
            Welcome to TruthStrike24 Admin
          </h3>
          <p className="text-gray-500 text-sm">
            Start by creating categories and tags, then write your first article.
            The AI agent can be configured in Agent Settings to auto-publish articles every hour.
          </p>
        </div>
      </div>
    </>
  );
}
