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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EditTaskDialog from "@/components/EditTaskDialog";
import TaskCommentDialog from "@/components/TaskCommentDialog";
import ImageCarousel from "@/components/ImageCarousel";
import {
  Clock,
  Calendar,
  User,
  FolderKanban,
  AlertCircle,
  CheckCircle2,
  Pause,
  ListTodo,
  MessageSquare,
  Paperclip,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Task status colors
const STATUS_COLORS = {
  NEW: "bg-slate-500",
  IN_PROGRESS: "bg-blue-500",
  BLOCKED: "bg-red-500",
  DONE: "bg-green-500",
};

// Task status labels
const STATUS_LABELS = {
  NEW: "New",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  DONE: "Done",
};

// Priority colors
const PRIORITY_COLORS = {
  LOW: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  HIGH: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  CRITICAL: "bg-red-500/10 text-red-600 border-red-500/20",
};

// Priority labels
const PRIORITY_LABELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export default function TasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(
    session?.user?.role === "TEAM_MEMBER" ? "my" : "all"
  );
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchTasks();
      fetchProjects();
    }
  }, [status, activeTab]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const userRole = session?.user?.role;
      
      // Build URL based on role and active tab
      let url = "/api/tasks";
      
      // For team members, determine if we should fetch only their tasks or all project tasks
      if (userRole === "TEAM_MEMBER") {
        // Only fetch "my tasks" when explicitly on the "my" tab
        // For all other tabs (all, status tabs), fetch all project tasks
        if (activeTab === "my") {
          url = "/api/tasks?myTasks=true";
        }
        // For "all" or status tabs, don't pass myTasks parameter
        // This will show all tasks from projects they're members of
      }
      
      console.log("Fetching tasks with URL:", url, "Active tab:", activeTab);
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched tasks:", data.length, "tasks");
        setTasks(data);
      } else {
        console.error("Failed to fetch tasks");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
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

  const formatDate = (date) => {
    if (!date) return "No deadline";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderPriorityStars = (priority) => {
    const starCount = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      CRITICAL: 3,
    }[priority] || 1;

    return (
      <div className="flex gap-0.5">
        {[...Array(starCount)].map((_, i) => (
          <span key={i} className="text-yellow-500 text-sm">★</span>
        ))}
      </div>
    );
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    // Team members see comment dialog, others see edit dialog
    if (isTeamMember) {
      setCommentDialogOpen(true);
    } else {
      setEditDialogOpen(true);
    }
  };

  const handleAddComment = (task) => {
    setSelectedTask(task);
    setCommentDialogOpen(true);
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
  };

  // Filter tasks based on active tab, project, and priority
  const filteredTasks = tasks.filter((task) => {
    // Filter by status tab (skip for "my" and "all" tabs)
    if (activeTab !== "all" && activeTab !== "my") {
      // Check if activeTab is a status value
      if (["NEW", "IN_PROGRESS", "BLOCKED", "DONE"].includes(activeTab)) {
        console.log("Filtering by status:", activeTab, "Task status:", task.status, "Match:", task.status === activeTab);
        if (task.status !== activeTab) return false;
      }
    }
    
    // Filter by project
    if (selectedProject !== "all" && task.projectId !== selectedProject) return false;
    
    // Filter by priority
    if (selectedPriority !== "all" && task.priority !== selectedPriority) return false;
    
    return true;
  });
  
  console.log("Total tasks:", tasks.length, "Filtered tasks:", filteredTasks.length, "Active tab:", activeTab);

  // Group tasks by status for statistics
  const taskStats = {
    all: tasks.length,
    NEW: tasks.filter((t) => t.status === "NEW").length,
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    BLOCKED: tasks.filter((t) => t.status === "BLOCKED").length,
    DONE: tasks.filter((t) => t.status === "DONE").length,
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const userRole = session?.user?.role;
  const isTeamMember = userRole === "TEAM_MEMBER";
  const isProjectManager = userRole === "PROJECT_MANAGER";
  const isAdmin = userRole === "ADMIN";

  // Get appropriate page title and description based on role
  const getPageTitle = () => {
    if (isTeamMember) return "My Tasks";
    if (isProjectManager) return "Project Tasks";
    if (isAdmin) return "All Tasks";
    return "Tasks";
  };

  const getPageDescription = () => {
    if (isTeamMember) return "View and update your assigned tasks";
    if (isProjectManager) return "Manage tasks across your projects";
    if (isAdmin) return "System-wide task overview";
    return "Task management";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{getPageTitle()}</h1>
          <p className="text-muted-foreground mt-1">
            {getPageDescription()}
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.all}</div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New</CardTitle>
            <div className="w-3 h-3 rounded-full bg-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.NEW}</div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <div className="w-3 h-3 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.IN_PROGRESS}</div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked</CardTitle>
            <div className="w-3 h-3 rounded-full bg-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.BLOCKED}</div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.DONE}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/40">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-base">Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Project</label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedProject("all");
                  setSelectedPriority("all");
                }}
                disabled={selectedProject === "all" && selectedPriority === "all"}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={cn(
          "grid w-full",
          isTeamMember ? "grid-cols-6" : "grid-cols-5"
        )}>
          {isTeamMember && (
            <TabsTrigger value="my">
              My Tasks
            </TabsTrigger>
          )}
          <TabsTrigger value="all">
            {isTeamMember ? "All" : `All (${taskStats.all})`}
          </TabsTrigger>
          <TabsTrigger value="NEW">
            New ({taskStats.NEW})
          </TabsTrigger>
          <TabsTrigger value="IN_PROGRESS">
            In Progress ({taskStats.IN_PROGRESS})
          </TabsTrigger>
          <TabsTrigger value="BLOCKED">
            Blocked ({taskStats.BLOCKED})
          </TabsTrigger>
          <TabsTrigger value="DONE">
            Done ({taskStats.DONE})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredTasks.length === 0 ? (
            <Card className="border-border/40">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No tasks found matching your filters
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTasks.map((task) => (
                <Card
                  key={task.id}
                  className="border-border/40 hover:border-border transition-all hover:shadow-md group"
                >
                  <CardContent className="p-4">
                    <div 
                      className="cursor-pointer"
                      onClick={() => handleTaskClick(task)}
                    >
                    {/* Image Carousel or Cover */}
                    {task.images && task.images.length > 0 ? (
                      <div className="mb-3 -mx-4 -mt-4 h-32 overflow-hidden rounded-t-lg">
                        <ImageCarousel images={task.images} />
                      </div>
                    ) : task.coverUrl ? (
                      <div className="mb-3 -mx-4 -mt-4 h-32 overflow-hidden rounded-t-lg">
                        <img
                          src={task.coverUrl}
                          alt={task.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : null}

                    {/* Header: Priority and Stars */}
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className={cn("text-xs", PRIORITY_COLORS[task.priority])}>
                        {PRIORITY_LABELS[task.priority]}
                      </Badge>
                      {renderPriorityStars(task.priority)}
                    </div>

                    {/* Project Name */}
                    {task.project && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <FolderKanban className="h-3 w-3" />
                        <span className="font-semibold">{task.project.name}</span>
                      </div>
                    )}

                    {/* Task Title */}
                    <h4 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {task.title}
                    </h4>

                    {/* Description Preview */}
                    {task.description && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {/* Status Badge */}
                    <Badge className={cn("mb-3 text-white border-0", STATUS_COLORS[task.status])}>
                      {STATUS_LABELS[task.status]}
                    </Badge>

                    {/* Metadata */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      {task.deadline && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(task.deadline)}</span>
                        </div>
                      )}
                      {(task.estimateHours || task.loggedHours) && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {task.loggedHours || 0}h / {task.estimateHours || 0}h
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Comments & Attachments */}
                    {(task._count?.comments > 0 || task._count?.attachments > 0) && (
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        {task._count?.comments > 0 && (
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>{task._count.comments}</span>
                          </div>
                        )}
                        {task._count?.attachments > 0 && (
                          <div className="flex items-center gap-1">
                            <Paperclip className="h-3 w-3" />
                            <span>{task._count.attachments}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Assignee */}
                    {task.assignee && (
                      <div className="flex items-center gap-2 pt-3 border-t border-border/40">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={task.assignee.avatarUrl || task.assignee.image}
                            alt={task.assignee.name}
                          />
                          <AvatarFallback className="text-xs">
                            {getInitials(task.assignee.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          {task.assignee.name}
                        </span>
                      </div>
                    )}
                    </div>

                    {/* Action Buttons - Outside clickable area */}
                    {!isTeamMember && (
                      <div className="mt-3 pt-3 border-t border-border/40 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddComment(task);
                          }}
                        >
                          <MessageSquare className="h-3 w-3" />
                          Comment
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Task Dialog */}
      <EditTaskDialog
        isOpen={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onTaskUpdated={handleTaskUpdated}
        userId={session?.user?.id}
        userRole={session?.user?.role}
      />

      {/* Task Comment Dialog for Team Members */}
      <TaskCommentDialog
        isOpen={commentDialogOpen}
        onClose={() => {
          setCommentDialogOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        userId={session?.user?.id}
        userRole={session?.user?.role}
      />
    </div>
  );
}
