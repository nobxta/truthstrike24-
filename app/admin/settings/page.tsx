import TopBar from "@/components/admin/TopBar";

export default function SiteSettingsPage() {
  return (
    <>
      <TopBar title="Site Settings" />
      <div className="p-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-500">Site settings will be available here.</p>
        </div>
      </div>
    </>
  );
}
