"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  FolderKanban,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  Pause,
  Target,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getUserCapabilities } from "@/lib/rbac-client";

// Status configuration
const STATUS_CONFIG = {
  PLANNED: {
    label: "Planned",
    icon: Target,
    color: "bg-blue-500",
    textColor: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: Clock,
    color: "bg-orange-500",
    textColor: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  ON_HOLD: {
    label: "On Hold",
    icon: Pause,
    color: "bg-yellow-500",
    textColor: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    color: "bg-green-500",
    textColor: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: AlertCircle,
    color: "bg-red-500",
    textColor: "text-red-500",
    bgColor: "bg-red-500/10",
  },
};

// Project Card Component
function ProjectCard({ project, onClick }) {
  const status = STATUS_CONFIG[project.status] || STATUS_CONFIG.PLANNED;
  const StatusIcon = status.icon;

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "₹0";
    return `₹${parseFloat(amount).toLocaleString("en-IN")}`;
  };

  const profit = (project.totalRevenue || 0) - (project.totalCost || 0);

  return (
    <Card
      className="border-border/40 hover:border-border transition-all hover:shadow-lg cursor-pointer group"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={cn("text-xs", status.bgColor, status.textColor)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
              {project.code && (
                <Badge variant="secondary" className="text-xs">
                  {project.code}
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg group-hover:text-primary transition-colors">
              {project.name}
            </CardTitle>
            {project.description && (
              <CardDescription className="mt-2 line-clamp-2">
                {project.description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{project.stats?.completionRate || 0}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${project.stats?.completionRate || 0}%` }}
            />
          </div>
        </div>

        {/* Task Statistics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <FolderKanban className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Tasks</p>
              <p className="font-semibold">{project.stats?.totalTasks || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="font-semibold">{project.stats?.completedTasks || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Clock className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">In Progress</p>
              <p className="font-semibold">{project.stats?.inProgressTasks || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Blocked</p>
              <p className="font-semibold">{project.stats?.blockedTasks || 0}</p>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        {(project.budget || project.totalRevenue || project.totalCost) && (
          <div className="pt-3 border-t border-border/40">
            <div className="grid grid-cols-3 gap-2 text-xs">
              {project.budget && (
                <div>
                  <p className="text-muted-foreground mb-1">Budget</p>
                  <p className="font-semibold">{formatCurrency(project.budget)}</p>
                </div>
              )}
              {project.totalRevenue !== null && (
                <div>
                  <p className="text-muted-foreground mb-1">Revenue</p>
                  <p className="font-semibold text-green-600">{formatCurrency(project.totalRevenue)}</p>
                </div>
              )}
              {project.totalCost !== null && (
                <div>
                  <p className="text-muted-foreground mb-1">Cost</p>
                  <p className="font-semibold text-red-600">{formatCurrency(project.totalCost)}</p>
                </div>
              )}
            </div>
            {profit !== 0 && (
              <div className="mt-2 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Profit</span>
                  <span className={cn("font-semibold text-sm", profit >= 0 ? "text-green-600" : "text-red-600")}>
                    {formatCurrency(profit)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Team Members */}
        <div className="flex items-center justify-between pt-3 border-t border-border/40">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Team</span>
          </div>
          <div className="flex -space-x-2">
            {project.manager && (
              <Avatar className="h-7 w-7 border-2 border-background">
                <AvatarImage src={project.manager.avatarUrl} alt={project.manager.name} />
                <AvatarFallback className="text-xs">{getInitials(project.manager.name)}</AvatarFallback>
              </Avatar>
            )}
            {project.members?.slice(0, 3).map((member) => (
              <Avatar key={member.id} className="h-7 w-7 border-2 border-background">
                <AvatarImage src={member.user.avatarUrl} alt={member.user.name} />
                <AvatarFallback className="text-xs">{getInitials(member.user.name)}</AvatarFallback>
              </Avatar>
            ))}
            {project.members?.length > 3 && (
              <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                <span className="text-xs font-medium">+{project.members.length - 3}</span>
              </div>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(project.startDate)}</span>
          </div>
          <span>→</span>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(project.endDate)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// KPI Card Component
function KPICard({ title, value, change, icon: Icon, trend }) {
  return (
    <Card className="border-border/40">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={cn("text-xs mt-1", trend === "up" ? "text-green-600" : "text-red-600")}>
            {change} from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Main Projects Page
export default function ProjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      // Block SALES role from accessing projects page
      if (session?.user?.role === "SALES") {
        router.push("/dashboard/sales-orders");
        return;
      }
      fetchProjects();
    }
  }, [status, activeFilter, session, router]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const url = activeFilter === "all" 
        ? "/api/projects" 
        : `/api/projects?status=${activeFilter}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (projectId) => {
    router.push(`/dashboard/projects/${projectId}`);
  };

  const handleCreateProject = () => {
    router.push("/dashboard/projects/new");
  };

  // Calculate KPIs
  const kpis = {
    total: projects.length,
    active: projects.filter((p) => p.status === "IN_PROGRESS").length,
    delayed: projects.filter((p) => {
      if (!p.endDate) return false;
      return new Date(p.endDate) < new Date() && p.status !== "COMPLETED";
    }).length,
    completed: projects.filter((p) => p.status === "COMPLETED").length,
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const userRole = session?.user?.role;
  const capabilities = getUserCapabilities(session?.user);
  
  // Get appropriate page title based on role
  const getPageTitle = () => {
    if (userRole === "TEAM_MEMBER") return "My Projects";
    if (userRole === "PROJECT_MANAGER") return "My Projects";
    return "Projects";
  };

  const getPageDescription = () => {
    if (userRole === "TEAM_MEMBER") return "Projects you're working on";
    if (userRole === "PROJECT_MANAGER") return "Manage and track your projects";
    return "Manage and track all projects";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{getPageTitle()}</h1>
          <p className="text-muted-foreground mt-1">
            {getPageDescription()}
          </p>
        </div>
        {capabilities.canCreateProjects && (
          <Button onClick={handleCreateProject} className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Projects"
          value={kpis.total}
          icon={FolderKanban}
        />
        <KPICard
          title="Active Projects"
          value={kpis.active}
          icon={TrendingUp}
        />
        <KPICard
          title="Delayed Projects"
          value={kpis.delayed}
          icon={AlertCircle}
        />
        <KPICard
          title="Completed"
          value={kpis.completed}
          icon={CheckCircle2}
        />
      </div>

      {/* Filters */}
      <Tabs value={activeFilter} onValueChange={setActiveFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="PLANNED">Planned</TabsTrigger>
          <TabsTrigger value="IN_PROGRESS">In Progress</TabsTrigger>
          <TabsTrigger value="ON_HOLD">On Hold</TabsTrigger>
          <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeFilter} className="mt-6">
          {projects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {capabilities.canCreateProjects 
                    ? "Get started by creating your first project"
                    : "No projects assigned to you yet"}
                </p>
                {capabilities.canCreateProjects && (
                  <Button onClick={handleCreateProject} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Project
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => handleProjectClick(project.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
