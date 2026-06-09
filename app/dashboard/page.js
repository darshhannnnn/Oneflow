"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import ComprehensiveAdminDashboard from "@/components/dashboards/ComprehensiveAdminDashboard";
import ProjectManagerDashboard from "@/components/dashboards/ProjectManagerDashboard";
import TeamMemberDashboard from "@/components/dashboards/TeamMemberDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user) {
      // Skip approval check for ADMIN users
      if (session.user.role === "ADMIN") {
        return; // Admins always have access
      }
      // Check approval for non-admin users
      if (!session.user.isApproved) {
        router.push("/auth/pending-approval");
      }
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const userRole = session.user.role || "TEAM_MEMBER";

  // Render role-based dashboard
  const renderDashboard = () => {
    switch (userRole) {
      case "ADMIN":
        return <ComprehensiveAdminDashboard user={session.user} />;
      case "PROJECT_MANAGER":
        return <ProjectManagerDashboard user={session.user} />;
      case "TEAM_MEMBER":
        return <TeamMemberDashboard user={session.user} />;
      case "SALES":
      case "FINANCE":
        // For now, show a placeholder for Sales and Finance
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">{userRole} Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Welcome to your {userRole.toLowerCase()} dashboard
              </p>
            </div>
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle>Coming Soon</CardTitle>
                <CardDescription>
                  The {userRole.toLowerCase()} dashboard is under development
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    This dashboard will include features specific to {userRole.toLowerCase()} operations
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return <TeamMemberDashboard user={session.user} />;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {renderDashboard()}
    </div>
  );
}
