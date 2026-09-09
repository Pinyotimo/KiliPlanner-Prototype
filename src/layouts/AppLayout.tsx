import { useState, ReactNode } from "react";
import Navbar from "../components/Navbar";
import Sidebar, { NavTab } from "../components/Sidebar";

interface AppLayoutProps {
  children: ReactNode;
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onReportClick: () => void;
  openCount?: number;
  resolvedCount?: number;
  unreadCount?: number;
}

export default function AppLayout({
  children,
  activeTab,
  onSelectTab,
  onReportClick,
  openCount = 0,
  resolvedCount = 0,
  unreadCount = 0,
}: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen h-screen w-full bg-background text-foreground flex flex-col overflow-hidden">
      {/* Top Navbar: Sticky across all screen sizes */}
      <Navbar
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onReportClick={onReportClick}
        unreadCount={unreadCount}
      />

      {/* Main Container */}
      <div className="flex flex-1 min-h-0 w-full relative">
        {/*
          Responsive Sidebar Routing:
          - Mobile / Small (<768px): Sliding drawer overlay controlled by isSidebarOpen state
          - Medium (768px - 1024px): Fixed width (16rem / 64) docked on the left
          - Large & XL (>1024px): Docked on left with optimal spacing
        */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          openCount={openCount}
          resolvedCount={resolvedCount}
        />

        {/* Dynamic Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto relative bg-background">
          <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}