"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import KanbanBoard from "@/components/KanbanBoard";
import CreateTaskDialog from "@/components/CreateTaskDialog";
import {
  ArrowLeft,
  Settings,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Edit,
  Plus,
  FileText,
  ShoppingCart,
  Receipt,
  CreditCard,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Status configuration
const STATUS_CONFIG = {
  PLANNED: { label: "Planned", color: "bg-blue-500" },
  IN_PROGRESS: { label: "In Progress", color: "bg-orange-500" },
  ON_HOLD: { label: "On Hold", color: "bg-yellow-500" },
  COMPLETED: { label: "Completed", color: "bg-green-500" },
  CANCELLED: { label: "Cancelled", color: "bg-red-500" },
};

export default function ProjectDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id;

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tasks");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated" && projectId) {
      fetchProject();
    }
  }, [status, projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      } else {
        const errorText = await response.text();
        console.error("Failed to fetch project:", response.status, errorText);
        // Don't redirect immediately, show error state instead
        alert(`Failed to load project: ${response.status}. Please check console for details.`);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      alert("Error loading project. Please check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = (updatedTasks) => {
    setProject((prev) => ({
      ...prev,
      tasks: updatedTasks,
    }));
  };

  const handleTaskCreated = (newTask) => {
    setProject((prev) => ({
      ...prev,
      tasks: [...(prev.tasks || []), newTask],
    }));
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (amount) => {
    if (!amount) return "₹0";
    return `₹${parseFloat(amount).toLocaleString("en-IN")}`;
  };

  const formatDate = (date) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.PLANNED;
  const userRole = session?.user?.role;
  const isAdmin = userRole === "ADMIN";
  const isProjectManager = userRole === "PROJECT_MANAGER";
  const isTeamMember = userRole === "TEAM_MEMBER";
  const isProjectOwner = project.managerId === session?.user?.id;
  const canManageProject = isAdmin || (isProjectManager && isProjectOwner);

  const profit = (project.totalRevenue || 0) - (project.totalCost || 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/projects")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <Badge variant="outline" className={cn("text-white border-0", statusConfig.color)}>
              {statusConfig.label}
            </Badge>
            {project.code && (
              <Badge variant="secondary">{project.code}</Badge>
            )}
          </div>
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}
        </div>
        {(session?.user?.role === "ADMIN" || 
          session?.user?.role === "PROJECT_MANAGER" && project.managerId === session?.user?.id) && (
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => router.push(`/dashboard/projects/${projectId}/edit`)}
          >
            <Edit className="h-4 w-4" />
            Edit Project
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Budget
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(project.budget)}</div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(project.totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cost
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(project.totalCost)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Profit
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", profit >= 0 ? "text-green-600" : "text-red-600")}>
              {formatCurrency(profit)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Links Panel - Quick Access to Documents */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="text-lg">Quick Links</CardTitle>
          <CardDescription>
            Quick access to sales orders, invoices, and other documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Button variant="outline" className="h-auto flex-col gap-2 py-4">
              <ShoppingCart className="h-5 w-5" />
              <div className="text-center">
                <p className="text-xs font-medium">Sales Orders</p>
                <p className="text-xs text-muted-foreground">{project.salesOrders?.length || 0}</p>
              </div>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4">
              <FileText className="h-5 w-5" />
              <div className="text-center">
                <p className="text-xs font-medium">Purchase Orders</p>
                <p className="text-xs text-muted-foreground">{project.purchaseOrders?.length || 0}</p>
              </div>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4">
              <Receipt className="h-5 w-5" />
              <div className="text-center">
                <p className="text-xs font-medium">Invoices</p>
                <p className="text-xs text-muted-foreground">{project.customerInvoices?.length || 0}</p>
              </div>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4">
              <CreditCard className="h-5 w-5" />
              <div className="text-center">
                <p className="text-xs font-medium">Vendor Bills</p>
                <p className="text-xs text-muted-foreground">{project.vendorBills?.length || 0}</p>
              </div>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4">
              <Wallet className="h-5 w-5" />
              <div className="text-center">
                <p className="text-xs font-medium">Expenses</p>
                <p className="text-xs text-muted-foreground">{project.expenses?.length || 0}</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="project">Project</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          {canManageProject && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>

        {/* Project Tab */}
        <TabsContent value="project" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Project Details */}
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Project Manager</p>
                  {project.manager ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={project.manager.avatarUrl} alt={project.manager.name} />
                        <AvatarFallback>{getInitials(project.manager.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{project.manager.name}</p>
                        <p className="text-xs text-muted-foreground">{project.manager.email}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm">Not assigned</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Duration</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(project.startDate)} → {formatDate(project.endDate)}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Progress</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${project.progressPct || 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">{project.progressPct || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Members */}
            <Card className="border-border/40">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Team Members</CardTitle>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-3 w-3" />
                    Add Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.members?.map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={member.user.avatarUrl} alt={member.user.name} />
                        <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{member.user.name}</p>
                        <p className="text-xs text-muted-foreground">{member.user.email}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {member.user.role}
                      </Badge>
                    </div>
                  ))}
                  {(!project.members || project.members.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No team members assigned yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Task Board</h2>
              <p className="text-muted-foreground">
                {canManageProject 
                  ? "Drag and drop tasks to update their status"
                  : "View and update your assigned tasks"}
              </p>
            </div>
            {canManageProject && (
              <CreateTaskDialog 
                projectId={projectId} 
                onTaskCreated={handleTaskCreated}
                projectMembers={project.members || []}
                projectManager={project.manager}
                currentUserId={session?.user?.id}
              />
            )}
          </div>

          <KanbanBoard 
            tasks={project.tasks || []} 
            onTaskUpdate={handleTaskUpdate}
            canManageTasks={canManageProject}
            userId={session?.user?.id}
            userRole={session?.user?.role}
            projectMembers={project.members || []}
            projectManager={project.manager}
          />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle>Financial Documents</CardTitle>
              <CardDescription>
                Create or link sales orders, purchase orders, invoices, and expenses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" className="h-auto justify-start gap-3 p-4">
                  <ShoppingCart className="h-5 w-5" />
                  <div className="text-left">
                    <p className="font-medium">Sales Orders</p>
                    <p className="text-xs text-muted-foreground">
                      {project.salesOrders?.length || 0} orders
                    </p>
                  </div>
                </Button>

                <Button variant="outline" className="h-auto justify-start gap-3 p-4">
                  <FileText className="h-5 w-5" />
                  <div className="text-left">
                    <p className="font-medium">Purchase Orders</p>
                    <p className="text-xs text-muted-foreground">
                      {project.purchaseOrders?.length || 0} orders
                    </p>
                  </div>
                </Button>

                <Button variant="outline" className="h-auto justify-start gap-3 p-4">
                  <Receipt className="h-5 w-5" />
                  <div className="text-left">
                    <p className="font-medium">Customer Invoices</p>
                    <p className="text-xs text-muted-foreground">
                      {project.customerInvoices?.length || 0} invoices
                    </p>
                  </div>
                </Button>

                <Button variant="outline" className="h-auto justify-start gap-3 p-4">
                  <CreditCard className="h-5 w-5" />
                  <div className="text-left">
                    <p className="font-medium">Vendor Bills</p>
                    <p className="text-xs text-muted-foreground">
                      {project.vendorBills?.length || 0} bills
                    </p>
                  </div>
                </Button>

                <Button variant="outline" className="h-auto justify-start gap-3 p-4">
                  <Wallet className="h-5 w-5" />
                  <div className="text-left">
                    <p className="font-medium">Expenses</p>
                    <p className="text-xs text-muted-foreground">
                      {project.expenses?.length || 0} expenses
                    </p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 border-red-500/20">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive">Delete Project</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
