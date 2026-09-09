import { useState } from "react";
import type { ReactNode } from "react";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import type { Issue } from "../../types/issue";

type AdminLayoutProps = {
  children: ReactNode;
  title: string;
  realtimeStatus: "connecting" | "live" | "offline";
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  showBreadcrumb?: boolean;
  notifications?: Issue[];
  onNotificationsRead?: () => void;
};

export default function AdminLayout({ children, title, realtimeStatus, showSearch, searchValue, onSearchChange, refreshing, onRefresh, showBreadcrumb, notifications, onNotificationsRead }: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <AdminSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        <main className="min-w-0 flex-1 p-4 lg:p-8">
          <AdminHeader title={title} onMenuClick={() => setMobileOpen(true)} realtimeStatus={realtimeStatus} showSearch={showSearch} searchValue={searchValue} onSearchChange={onSearchChange} refreshing={refreshing} onRefresh={onRefresh} showBreadcrumb={showBreadcrumb} notifications={notifications} onNotificationsRead={onNotificationsRead} />
          {children}
        </main>
      </div>
    </div>
  );
}
