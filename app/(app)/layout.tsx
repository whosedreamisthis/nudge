import { FocusWatcher } from "@/components/focus/FocusWatcher";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { BottomNav } from "@/components/shared/BottomNav";
import { Sidebar } from "@/components/shared/Sidebar";

// Shell for the signed-in pages. Each page still checks access itself; this only lays things out.
// Phones get a bottom tab bar, md and up get a left sidebar.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1">
      <Sidebar />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 pt-6 pb-24 md:max-w-3xl md:px-8 md:pb-8 xl:max-w-6xl">
        {children}
      </main>
      <BottomNav />
      <FocusWatcher />
      <ScrollToTop />
    </div>
  );
}
