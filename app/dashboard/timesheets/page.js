"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  Plus,
  Calendar,
  Edit,
  Trash2,
  Filter,
  Download,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export default function TimesheetsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [timesheets, setTimesheets] = useState([]);
  const [filteredTimesheets, setFilteredTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState("all");
  const [filterBillable, setFilterBillable] = useState("all");
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    totalHours: 0,
    billableHours: 0,
    nonBillableHours: 0,
    thisWeek: 0,
  });

  useEffect(() => {
    if (status === "authenticated") {
      fetchTimesheets();
      fetchProjects();
    }
  }, [status]);

  useEffect(() => {
    applyFilters();
  }, [timesheets, filterProject, filterBillable]);

  const fetchTimesheets = async () => {
    try {
      const response = await fetch(`/api/timesheets?userId=${session.user.id}`);
      if (response.ok) {
        const data = await response.json();
        setTimesheets(data);
        calculateStats(data);
      }
    } catch (error) {
      console.error("Error fetching timesheets:", error);
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

  const calculateStats = (data) => {
    const totalHours = data.reduce((sum, t) => sum + parseFloat(t.hours || 0), 0);
    const billableHours = data
      .filter((t) => t.isBillable)
      .reduce((sum, t) => sum + parseFloat(t.hours || 0), 0);
    const nonBillableHours = totalHours - billableHours;

    // Calculate this week's hours
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeek = data
      .filter((t) => new Date(t.date) >= oneWeekAgo)
      .reduce((sum, t) => sum + parseFloat(t.hours || 0), 0);

    setStats({
      totalHours,
      billableHours,
      nonBillableHours,
      thisWeek,
    });
  };

  const applyFilters = () => {
    let filtered = [...timesheets];

    if (filterProject !== "all") {
      filtered = filtered.filter((t) => t.task?.project?.id === filterProject);
    }

    if (filterBillable !== "all") {
      filtered = filtered.filter((t) =>
        filterBillable === "billable" ? t.isBillable : !t.isBillable
      );
    }

    setFilteredTimesheets(filtered);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this timesheet entry?")) return;

    try {
      const response = await fetch(`/api/timesheets/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTimesheets(timesheets.filter((t) => t.id !== id));
      } else {
        alert("Failed to delete timesheet");
      }
    } catch (error) {
      console.error("Error deleting timesheet:", error);
      alert("Error deleting timesheet");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Timesheets</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your work hours
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/timesheets/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Log Hours
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billable Hours</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.billableHours.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalHours > 0
                ? ((stats.billableHours / stats.totalHours) * 100).toFixed(0)
                : 0}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non-Billable</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.nonBillableHours.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalHours > 0
                ? ((stats.nonBillableHours / stats.totalHours) * 100).toFixed(0)
                : 0}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.thisWeek.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project</label>
              <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger>
                  <SelectValue placeholder="All Projects" />
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={filterBillable} onValueChange={setFilterBillable}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="billable">Billable</SelectItem>
                  <SelectItem value="non-billable">Non-Billable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setFilterProject("all");
                  setFilterBillable("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timesheets List */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
          <CardDescription>
            {filteredTimesheets.length} entries found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTimesheets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No time entries yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start logging your work hours to track your time
              </p>
              <Button onClick={() => router.push("/dashboard/timesheets/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Log Your First Entry
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTimesheets.map((timesheet) => (
                <div
                  key={timesheet.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/40 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">
                        {timesheet.task?.title}
                      </h4>
                      <Badge
                        variant="outline"
                        className={
                          timesheet.isBillable
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : "bg-gray-500/10 text-gray-600 border-gray-500/20"
                        }
                      >
                        {timesheet.isBillable ? "Billable" : "Non-billable"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {timesheet.task?.project?.name}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(timesheet.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timesheet.hours}h
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        router.push(`/dashboard/timesheets/${timesheet.id}/edit`)
                      }
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(timesheet.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
