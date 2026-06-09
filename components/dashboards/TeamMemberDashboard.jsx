"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
  ListTodo,
  Timer,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TeamMemberDashboard({ user }) {
  const router = useRouter();
  const [stats, setStats] = useState({
    myTasks: 0,
    completedTasks: 0,
    hoursLogged: 0,
    pendingExpenses: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentTimesheets, setRecentTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch my tasks
      const tasksRes = await fetch("/api/tasks?myTasks=true");
      if (tasksRes.ok) {
        const tasks = await tasksRes.json();
        const completed = tasks.filter((t) => t.status === "DONE").length;
        setStats((prev) => ({
          ...prev,
          myTasks: tasks.length,
          completedTasks: completed,
        }));
        setRecentTasks(tasks.slice(0, 5));
      }

      // Fetch timesheets
      const timesheetsRes = await fetch("/api/timesheets?userId=" + user.id);
      if (timesheetsRes.ok) {
        const timesheets = await timesheetsRes.json();
        const totalHours = timesheets.reduce((sum, t) => sum + (parseFloat(t.hours) || 0), 0);
        setStats((prev) => ({ ...prev, hoursLogged: Number(totalHours) || 0 }));
        setRecentTimesheets(timesheets.slice(0, 5));
      }

      // Fetch expenses
      const expensesRes = await fetch("/api/expenses?userId=" + user.id);
      if (expensesRes.ok) {
        const expenses = await expensesRes.json();
        const pending = expenses.filter((e) => !e.approved).length;
        setStats((prev) => ({ ...prev, pendingExpenses: pending }));
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getStatusColor = (status) => {
    switch (status) {
      case "NEW":
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
      case "IN_PROGRESS":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "BLOCKED":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "DONE":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "CRITICAL":
        return "text-red-600";
      case "HIGH":
        return "text-orange-600";
      case "MEDIUM":
        return "text-yellow-600";
      case "LOW":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

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
          <h1 className="text-3xl font-bold">Welcome back, {user.name}!</h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your work today.
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/tasks")}>
          View All Tasks
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.myTasks - stats.completedTasks} active tasks
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.myTasks > 0
                ? Math.round((stats.completedTasks / stats.myTasks) * 100)
                : 0}
              % completion rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Logged</CardTitle>
            <Timer className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(stats.hoursLogged || 0).toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingExpenses}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Tasks */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
            <CardDescription>Your most recent task assignments</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ListTodo className="h-12 w-12 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No tasks assigned yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border/40 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/dashboard/projects/${task.projectId}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={getStatusColor(task.status)}>
                          {task.status.replace("_", " ")}
                        </Badge>
                        <span className={`text-xs ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="font-medium text-sm truncate">{task.title}</p>
                      {task.project && (
                        <p className="text-xs text-muted-foreground">
                          {task.project.name}
                        </p>
                      )}
                      {task.deadline && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(task.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => router.push("/dashboard/tasks")}
            >
              View All Tasks
            </Button>
          </CardContent>
        </Card>

        {/* Recent Timesheets */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle>Recent Time Logs</CardTitle>
            <CardDescription>Your recent hour entries</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTimesheets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No time logged yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => router.push("/dashboard/timesheets")}
                >
                  Log Time
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTimesheets.map((timesheet) => (
                  <div
                    key={timesheet.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/40"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{timesheet.task?.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(timesheet.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{timesheet.hours}h</p>
                      <Badge
                        variant="outline"
                        className={
                          timesheet.billable
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : "bg-gray-500/10 text-gray-600 border-gray-500/20"
                        }
                      >
                        {timesheet.billable ? "Billable" : "Non-billable"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => router.push("/dashboard/timesheets")}
            >
              View All Timesheets
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks you can perform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push("/dashboard/timesheets/new")}
            >
              <Clock className="mr-2 h-4 w-4" />
              Log Hours
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push("/dashboard/expenses/new")}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Submit Expense
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push("/dashboard/tasks")}
            >
              <ListTodo className="mr-2 h-4 w-4" />
              View My Tasks
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
