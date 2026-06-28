import Header from "@/components/public/Header";
import Footer from "@/components/public/Footer";
import CookieConsent from "@/components/public/CookieConsent";
import NotificationPrompt from "@/components/public/NotificationPrompt";
import BreakingBar from "@/components/public/BreakingBar";

// Force every (public) page to render at request time, not at build time.
// Header + BreakingBar query the DB on every render; pre-rendering them at
// build time fails when the DB is unreachable from Vercel's build sandbox.
export const dynamic = "force-dynamic";

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
