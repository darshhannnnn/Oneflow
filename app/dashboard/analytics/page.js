"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, PieChart } from "lucide-react";
import BillableHoursChart from "@/components/charts/BillableHoursChart";
import { RoleGuard } from "@/components/AccessControl";

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    hoursLogged: 0,
    billableHours: 0,
    nonBillableHours: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const timesheetStatsRes = await fetch("/api/timesheets/stats");

      if (timesheetStatsRes.ok) {
        const timesheetStats = await timesheetStatsRes.json();
        setStats({
          hoursLogged: parseFloat(timesheetStats.totalHours),
          billableHours: parseFloat(timesheetStats.billableHours),
          nonBillableHours: parseFloat(timesheetStats.nonBillableHours),
        });
      }
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const userRole = session?.user?.role;
  const userName = session?.user?.name || "User";

  // Define title and description based on role
  const getPageContent = () => {
    switch (userRole) {
      case "ADMIN":
        return {
          title: "Analytics Dashboard",
          description: "Complete insights into all projects, teams, and performance metrics across the organization.",
        };
      case "PROJECT_MANAGER":
        return {
          title: "Project Analytics",
          description: "Insights into your managed projects and team performance.",
        };
      case "TEAM_MEMBER":
        return {
          title: "My Analytics",
          description: "Your personal work hours and project contributions.",
        };
      case "SALES":
      case "FINANCE":
        return {
          title: "Analytics Dashboard",
          description: "Insights into project metrics and performance.",
        };
      default:
        return {
          title: "Analytics Dashboard",
          description: "Insights into your work and projects.",
        };
    }
  };

  const pageContent = getPageContent();

  return (
    <RoleGuard roles={["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "SALES", "FINANCE"]}>
      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{pageContent.title}</h1>
          <p className="text-muted-foreground mt-1">
            {pageContent.description}
          </p>
        </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Logged</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hoursLogged.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total hours on projects</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/40">
        <CardHeader>
          <CardTitle>Billable Hours Breakdown</CardTitle>
          <CardDescription>
            A visual representation of billable vs. non-billable hours logged across all projects.
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <BillableHoursChart
            billable={stats.billableHours}
            nonBillable={stats.nonBillableHours}
          />
        </CardContent>
      </Card>
      </div>
    </RoleGuard>
  );
}
