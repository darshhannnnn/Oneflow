"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import KanbanBoard from "@/components/KanbanBoard";
import CreateTaskDialog from "@/components/CreateTaskDialog";
import {
  ArrowLeft,
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
  Trash2,
  AlertTriangle,
  Loader2,
  ExternalLink,
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

  // Delete project state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add member state
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState("");

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

  // ─── Delete Project ────────────────────────────────────────────────────────
  const handleDeleteProject = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDeleteDialogOpen(false);
        router.push("/dashboard/projects");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Error deleting project. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Add Member ────────────────────────────────────────────────────────────
  const fetchAllUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        // Filter out users already in the project
        const existingMemberIds = new Set(
          project?.members?.map((m) => m.user.id) || []
        );
        if (project?.manager?.id) existingMemberIds.add(project.manager.id);
        setAllUsers(data.filter((u) => !existingMemberIds.has(u.id)));
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleOpenAddMember = () => {
    setAddMemberError("");
    setSelectedUserId("");
    fetchAllUsers();
    setAddMemberDialogOpen(true);
  };

  const handleAddMember = async () => {
    if (!selectedUserId) {
      setAddMemberError("Please select a team member.");
      return;
    }
    setIsAddingMember(true);
    setAddMemberError("");
    try {
      const currentMemberIds = project?.members?.map((m) => m.user.id) || [];
      const newMemberIds = [...currentMemberIds, selectedUserId];

      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds: newMemberIds }),
      });

      if (response.ok) {
        setAddMemberDialogOpen(false);
        fetchProject(); // Refresh project data
      } else {
        const data = await response.json();
        setAddMemberError(data.error || "Failed to add member");
      }
    } catch (error) {
      console.error("Error adding member:", error);
      setAddMemberError("Error adding member. Please try again.");
    } finally {
      setIsAddingMember(false);
    }
  };

  // ─── Remove Member ─────────────────────────────────────────────────────────
  const handleRemoveMember = async (userId) => {
    if (!confirm("Are you sure you want to remove this member from the project?")) return;
    try {
      const currentMemberIds = project?.members?.map((m) => m.user.id) || [];
      const newMemberIds = currentMemberIds.filter((id) => id !== userId);

      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds: newMemberIds }),
      });

      if (response.ok) {
        fetchProject();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to remove member");
      }
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Error removing member. Please try again.");
    }
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
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 hover:bg-blue-500/10 hover:border-blue-500/40 transition-colors"
              onClick={() => router.push(`/dashboard/sales-orders?projectId=${projectId}`)}
            >
              <ShoppingCart className="h-5 w-5 text-blue-500" />
              <div className="text-center">
                <p className="text-xs font-medium">Sales Orders</p>
                <p className="text-xs text-muted-foreground">{project.salesOrders?.length || 0}</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 hover:bg-orange-500/10 hover:border-orange-500/40 transition-colors"
              onClick={() => router.push(`/dashboard/purchase-orders?projectId=${projectId}`)}
            >
              <FileText className="h-5 w-5 text-orange-500" />
              <div className="text-center">
                <p className="text-xs font-medium">Purchase Orders</p>
                <p className="text-xs text-muted-foreground">{project.purchaseOrders?.length || 0}</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 hover:bg-green-500/10 hover:border-green-500/40 transition-colors"
              onClick={() => router.push(`/dashboard/invoices?projectId=${projectId}`)}
            >
              <Receipt className="h-5 w-5 text-green-500" />
              <div className="text-center">
                <p className="text-xs font-medium">Invoices</p>
                <p className="text-xs text-muted-foreground">{project.customerInvoices?.length || 0}</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 hover:bg-purple-500/10 hover:border-purple-500/40 transition-colors"
              onClick={() => router.push(`/dashboard/invoices?type=vendor&projectId=${projectId}`)}
            >
              <CreditCard className="h-5 w-5 text-purple-500" />
              <div className="text-center">
                <p className="text-xs font-medium">Vendor Bills</p>
                <p className="text-xs text-muted-foreground">{project.vendorBills?.length || 0}</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 hover:bg-yellow-500/10 hover:border-yellow-500/40 transition-colors"
              onClick={() => router.push(`/dashboard/expenses?projectId=${projectId}`)}
            >
              <Wallet className="h-5 w-5 text-yellow-500" />
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
                  {canManageProject && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={handleOpenAddMember}
                    >
                      <Plus className="h-3 w-3" />
                      Add Member
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.members?.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 group">
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
                      {canManageProject && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveMember(member.user.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
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
                Navigate to related sales orders, purchase orders, invoices, and expenses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button
                  variant="outline"
                  className="h-auto justify-start gap-3 p-4 hover:bg-blue-500/10 hover:border-blue-500/40 transition-colors"
                  onClick={() => router.push(`/dashboard/sales-orders?projectId=${projectId}`)}
                >
                  <ShoppingCart className="h-5 w-5 text-blue-500" />
                  <div className="text-left flex-1">
                    <p className="font-medium">Sales Orders</p>
                    <p className="text-xs text-muted-foreground">
                      {project.salesOrders?.length || 0} orders
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </Button>

                <Button
                  variant="outline"
                  className="h-auto justify-start gap-3 p-4 hover:bg-orange-500/10 hover:border-orange-500/40 transition-colors"
                  onClick={() => router.push(`/dashboard/purchase-orders?projectId=${projectId}`)}
                >
                  <FileText className="h-5 w-5 text-orange-500" />
                  <div className="text-left flex-1">
                    <p className="font-medium">Purchase Orders</p>
                    <p className="text-xs text-muted-foreground">
                      {project.purchaseOrders?.length || 0} orders
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </Button>

                <Button
                  variant="outline"
                  className="h-auto justify-start gap-3 p-4 hover:bg-green-500/10 hover:border-green-500/40 transition-colors"
                  onClick={() => router.push(`/dashboard/invoices?projectId=${projectId}`)}
                >
                  <Receipt className="h-5 w-5 text-green-500" />
                  <div className="text-left flex-1">
                    <p className="font-medium">Customer Invoices</p>
                    <p className="text-xs text-muted-foreground">
                      {project.customerInvoices?.length || 0} invoices
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </Button>

                <Button
                  variant="outline"
                  className="h-auto justify-start gap-3 p-4 hover:bg-purple-500/10 hover:border-purple-500/40 transition-colors"
                  onClick={() => router.push(`/dashboard/invoices?type=vendor&projectId=${projectId}`)}
                >
                  <CreditCard className="h-5 w-5 text-purple-500" />
                  <div className="text-left flex-1">
                    <p className="font-medium">Vendor Bills</p>
                    <p className="text-xs text-muted-foreground">
                      {project.vendorBills?.length || 0} bills
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </Button>

                <Button
                  variant="outline"
                  className="h-auto justify-start gap-3 p-4 hover:bg-yellow-500/10 hover:border-yellow-500/40 transition-colors"
                  onClick={() => router.push(`/dashboard/expenses?projectId=${projectId}`)}
                >
                  <Wallet className="h-5 w-5 text-yellow-500" />
                  <div className="text-left flex-1">
                    <p className="font-medium">Expenses</p>
                    <p className="text-xs text-muted-foreground">
                      {project.expenses?.length || 0} expenses
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
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
              <div className="flex items-center justify-between p-4 border border-red-500/20 rounded-lg bg-red-500/5">
                <div>
                  <p className="font-medium text-sm">Delete Project</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Permanently delete this project and all its data. This cannot be undone.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  className="gap-2 ml-4"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Project
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Delete Confirmation Dialog ──────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Project
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">{project.name}</span>? This
              action is permanent and cannot be undone. All tasks, members, and associated
              data will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Yes, Delete Project
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Member Dialog ────────────────────────────────────────────────── */}
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Add Team Member
            </DialogTitle>
            <DialogDescription>
              Select a user to add to{" "}
              <span className="font-semibold text-foreground">{project.name}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a team member…" />
              </SelectTrigger>
              <SelectContent>
                {allUsers.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                    All users are already members of this project.
                  </div>
                ) : (
                  allUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex flex-col">
                        <span>{user.name || user.email}</span>
                        {user.name && (
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {addMemberError && (
              <p className="text-sm text-red-600">{addMemberError}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setAddMemberDialogOpen(false)}
              disabled={isAddingMember}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={isAddingMember || !selectedUserId}
              className="gap-2"
            >
              {isAddingMember ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Member
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
