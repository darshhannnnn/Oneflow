"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  FolderKanban,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";

export default function AdminDashboard({ user }) {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalRevenue: 0,
    totalCost: 0,
    activeProjects: 0,
    completedProjects: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch users
      const usersRes = await fetch("/api/users");
      if (usersRes.ok) {
        const users = await usersRes.json();
        setStats((prev) => ({ ...prev, totalUsers: users.length }));
      }

      // Fetch projects
      const projectsRes = await fetch("/api/projects");
      if (projectsRes.ok) {
        const projects = await projectsRes.json();
        const active = projects.filter((p) => p.status === "IN_PROGRESS").length;
        const completed = projects.filter((p) => p.status === "COMPLETED").length;
        const revenue = projects.reduce((sum, p) => sum + (p.totalRevenue || 0), 0);
        const cost = projects.reduce((sum, p) => sum + (p.totalCost || 0), 0);
        
        setStats((prev) => ({
          ...prev,
          totalProjects: projects.length,
          activeProjects: active,
          completedProjects: completed,
          totalRevenue: revenue,
          totalCost: cost,
        }));
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const profit = (stats.totalRevenue || 0) - (stats.totalCost || 0);
  const profitMargin = stats.totalRevenue > 0 
    ? ((profit / stats.totalRevenue) * 100).toFixed(1) 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Complete overview of your organization
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/users")}>
            <Users className="mr-2 h-4 w-4" />
            Manage Users
          </Button>
          <Button onClick={() => router.push("/dashboard/projects/new")}>
            <FolderKanban className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Across all roles</p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeProjects} active, {stats.completedProjects} completed
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(stats.totalRevenue || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From all projects</p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{(profit || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">{profitMargin}% margin</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>Revenue vs Cost breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Revenue</span>
                <span className="font-semibold text-green-600">
                  ₹{(stats.totalRevenue || 0).toLocaleString()}
                </span>
              </div>
              <Progress 
                value={100} 
                className="h-2 bg-green-100 dark:bg-green-950"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cost</span>
                <span className="font-semibold text-red-600">
                  ₹{(stats.totalCost || 0).toLocaleString()}
                </span>
              </div>
              <Progress 
                value={stats.totalRevenue > 0 ? (stats.totalCost / stats.totalRevenue) * 100 : 0} 
                className="h-2 bg-red-100 dark:bg-red-950"
              />
            </div>

            <div className="pt-4 border-t border-border/40">
              <div className="flex items-center justify-between">
                <span className="font-medium">Net Profit</span>
                <span className={`text-lg font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{profit.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {profitMargin}% profit margin
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
            <CardDescription>Current project states</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">In Progress</span>
                </div>
                <span className="font-semibold">{stats.activeProjects}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Completed</span>
                </div>
                <span className="font-semibold">{stats.completedProjects}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                  <span className="text-sm">Planned</span>
                </div>
                <span className="font-semibold">
                  {stats.totalProjects - stats.activeProjects - stats.completedProjects}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-border/40">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/dashboard/analytics")}
              >
                View Detailed Analytics
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push("/dashboard/users")}
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push("/dashboard/projects")}
            >
              <FolderKanban className="mr-2 h-4 w-4" />
              View Projects
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push("/dashboard/analytics")}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Analytics
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push("/dashboard/settings")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
