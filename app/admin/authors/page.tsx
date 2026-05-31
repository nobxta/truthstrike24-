import TopBar from "@/components/admin/TopBar";

export default function AuthorsPage() {
  return (
    <>
      <TopBar title="Authors" />
      <div className="p-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-500">Author management will be available here.</p>
        </div>
      </div>
    </>
  );
}
