import Header from "@/components/public/Header";
import Footer from "@/components/public/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white dark:bg-[#0a0a0f] transition-colors duration-300 antialiased">
        {children}
      </main>
      <Footer />
    </>
  );
}
