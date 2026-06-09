"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FolderKanban,
  LayoutDashboard,
  Settings,
  Users,
  DollarSign,
  FileText,
  ShoppingCart,
  Receipt,
  CreditCard,
  Wallet,
  BarChart3,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Navigation items based on role
const NAV_ITEMS = {
  ADMIN: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Projects", href: "/dashboard/projects", icon: FolderKanban },
    { label: "Users", href: "/dashboard/users", icon: Users },
    { label: "Database", href: "/dashboard/database", icon: Activity },
    { label: "Audit Logs", href: "/dashboard/logs", icon: FileText },
    { label: "Sales Orders", href: "/dashboard/sales-orders", icon: ShoppingCart },
    { label: "Invoices", href: "/dashboard/invoices", icon: Receipt },
    { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  ],
  PROJECT_MANAGER: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Projects", href: "/dashboard/projects", icon: FolderKanban },
    { label: "Purchase Orders", href: "/dashboard/purchase-orders", icon: ShoppingCart },
    { label: "My Tasks", href: "/dashboard/tasks", icon: FileText },
    { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  ],
  TEAM_MEMBER: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Projects", href: "/dashboard/projects", icon: FolderKanban },
    { label: "My Tasks", href: "/dashboard/tasks", icon: FileText },
    { label: "Timesheets", href: "/dashboard/timesheets", icon: Receipt },
    { label: "Expenses", href: "/dashboard/expenses", icon: Wallet },
  ],
  SALES: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Sales Orders", href: "/dashboard/sales-orders", icon: ShoppingCart },
    { label: "Activity Logs", href: "/dashboard/sales-orders/activities", icon: Activity },
    { label: "Invoices", href: "/dashboard/invoices", icon: Receipt },
    { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  ],
  FINANCE: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Projects", href: "/dashboard/projects", icon: FolderKanban },
    { label: "Purchase Orders", href: "/dashboard/purchase-orders", icon: ShoppingCart },
    { label: "Invoices", href: "/dashboard/invoices", icon: Receipt },
    { label: "Vendor Bills", href: "/dashboard/vendor-bills", icon: CreditCard },
    { label: "Expenses", href: "/dashboard/expenses", icon: Wallet },
    { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  ],
};

// Role colors
const ROLE_COLORS = {
  ADMIN: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  PROJECT_MANAGER: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  TEAM_MEMBER: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  SALES: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  FINANCE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

// Role labels
const ROLE_LABELS = {
  ADMIN: "Admin",
  PROJECT_MANAGER: "Project Manager",
  TEAM_MEMBER: "Team Member",
  SALES: "Sales",
  FINANCE: "Finance",
};

export default function RoleBasedNav() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session?.user) return null;

  const userRole = session.user.role || "TEAM_MEMBER";
  const navItems = NAV_ITEMS[userRole] || NAV_ITEMS.TEAM_MEMBER;

  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/40 bg-background/30 backdrop-blur-lg shadow-lg">
      {/* Navigation Links */}
      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          // Exact match for Dashboard, startsWith for other routes
          const isActive = item.href === "/dashboard" 
            ? pathname === "/dashboard"
            : pathname === item.href || pathname.startsWith(item.href + "/");
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "gap-2 whitespace-nowrap rounded-full",
                  isActive && "bg-primary/10 text-primary hover:bg-primary/20"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* User Role Badge */}
      <Badge variant="outline" className={cn("whitespace-nowrap rounded-full", ROLE_COLORS[userRole])}>
        {ROLE_LABELS[userRole]}
      </Badge>
    </div>
  );
}
