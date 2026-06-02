import Header from "@/components/public/Header";
import Footer from "@/components/public/Footer";
import CookieConsent from "@/components/public/CookieConsent";
import NotificationPrompt from "@/components/public/NotificationPrompt";
import BreakingBar from "@/components/public/BreakingBar";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreakingBar />
      <Header />
      <main className="min-h-screen bg-white dark:bg-[#0a0a0f] transition-colors duration-300 antialiased">
        {children}
      </main>
      <Footer />
      <CookieConsent />
      <NotificationPrompt />
    </>
  );
}
