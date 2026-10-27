import { Suspense } from "react";
import { ApprovalsLink, DesktopSidebar, MobileMenu } from "@/components/app-shell/shell";
import { CommandMenu } from "@/components/app-shell/command-menu";

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-sidebar lg:block" />}>
        <DesktopSidebar />
      </Suspense>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-13 items-center gap-3 border-b border-line bg-canvas/90 px-4 backdrop-blur lg:px-8">
          <Suspense fallback={<span className="size-8 lg:hidden" />}>
            <MobileMenu />
          </Suspense>
          <CommandMenu />
          <div className="ml-auto">
            <Suspense>
              <ApprovalsLink />
            </Suspense>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1480px] px-4 py-7 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
