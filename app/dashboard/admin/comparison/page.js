"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, AreaChart,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter, ZAxis,
} from "recharts";
import {
  TrendingUp, TrendingDown, Calendar, Download, RefreshCw,
  ArrowLeft, BarChart3, Loader2, Users, FolderKanban,
} from "lucide-react";

const COLORS = {
  primary: '#10b981',
  secondary: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#a855f7',
};

export default function ComparisonDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }

    fetchProjects();
  }, [status, session]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        
        // Auto-select top 5 projects by revenue
        const top5 = data
          .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
          .slice(0, 5)
          .map(p => p.id);
        setSelectedProjects(top5);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjects.length > 0) {
      generateComparisonData();
    }
  }, [selectedProjects, projects]);

  const generateComparisonData = () => {
    const selected = projects.filter(p => selectedProjects.includes(p.id));
    
    const comparison = {
      financial: selected.map(p => ({
        name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
        revenue: Number(p.totalRevenue) || 0,
        cost: Number(p.totalCost) || 0,
        profit: (Number(p.totalRevenue) || 0) - (Number(p.totalCost) || 0),
        budget: Number(p.budget) || 0,
      })),
      
      tasks: selected.map(p => ({
        name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
        total: p.stats?.totalTasks || 0,
        completed: p.stats?.completedTasks || 0,
        inProgress: p.stats?.inProgressTasks || 0,
        blocked: p.stats?.blockedTasks || 0,
        completionRate: p.stats?.completionRate || 0,
      })),
      
      team: selected.map(p => ({
        name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
        members: p.members?.length || 0,
        tasksPerMember: p.members?.length > 0 
          ? ((p.stats?.totalTasks || 0) / p.members.length).toFixed(1)
          : 0,
      })),
      
      performance: selected.map(p => ({
        project: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
        progress: p.progressPct || 0,
        efficiency: p.stats?.completionRate || 0,
        profitMargin: p.totalRevenue > 0 
          ? (((Number(p.totalRevenue) - Number(p.totalCost)) / Number(p.totalRevenue)) * 100).toFixed(1)
          : 0,
        budgetUtilization: p.budget > 0
          ? ((Number(p.totalCost) / Number(p.budget)) * 100).toFixed(1)
          : 0,
        teamSize: p.members?.length || 0,
      })),
      
      timeline: selected.map(p => ({
        name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
        start: p.startDate ? new Date(p.startDate).getTime() : null,
        end: p.endDate ? new Date(p.endDate).getTime() : null,
        duration: p.startDate && p.endDate 
          ? Math.ceil((new Date(p.endDate) - new Date(p.startDate)) / (1000 * 60 * 60 * 24))
          : 0,
      })),
    };
    
    setComparisonData(comparison);
  };

  const toggleProject = (projectId) => {
    setSelectedProjects(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      } else {
        if (prev.length >= 10) {
          alert('Maximum 10 projects can be compared at once');
          return prev;
        }
        return [...prev, projectId];
      }
    });
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(comparisonData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `project-comparison-${new Date().toISOString()}.json`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading comparison data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              Project Comparison Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Compare multiple projects across key metrics
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={fetchProjects}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Projects to Compare</CardTitle>
          <CardDescription>
            Choose up to 10 projects ({selectedProjects.length} selected)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {projects.map(project => (
              <Badge
                key={project.id}
                variant={selectedProjects.includes(project.id) ? "default" : "outline"}
                className="cursor-pointer hover:opacity-80 transition-opacity px-3 py-1"
                onClick={() => toggleProject(project.id)}
              >
                {project.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Charts */}
      {comparisonData && (
        <Tabs defaultValue="financial" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Financial Comparison */}
          <TabsContent value="financial" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue vs Cost vs Budget</CardTitle>
                  <CardDescription>Financial overview comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={comparisonData.financial}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-15} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="revenue" fill={COLORS.success} name="Revenue" />
                      <Bar dataKey="cost" fill={COLORS.danger} name="Cost" />
                      <Line type="monotone" dataKey="budget" stroke={COLORS.info} strokeWidth={2} name="Budget" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Profit Comparison</CardTitle>
                  <CardDescription>Net profit by project</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={comparisonData.financial}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-15} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="profit" fill={COLORS.primary} name="Profit" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Task Comparison */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Task Status Distribution</CardTitle>
                  <CardDescription>Task breakdown by status</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={comparisonData.tasks}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-15} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completed" stackId="a" fill={COLORS.success} name="Completed" />
                      <Bar dataKey="inProgress" stackId="a" fill={COLORS.info} name="In Progress" />
                      <Bar dataKey="blocked" stackId="a" fill={COLORS.danger} name="Blocked" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Completion Rate</CardTitle>
                  <CardDescription>Task completion percentage</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={comparisonData.tasks}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-15} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="completionRate" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.6} name="Completion Rate %" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Team Comparison */}
          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Size & Workload</CardTitle>
                <CardDescription>Team members and tasks per member</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={comparisonData.team}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-15} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="members" fill={COLORS.secondary} name="Team Members" />
                    <Line type="monotone" dataKey="tasksPerMember" stroke={COLORS.danger} strokeWidth={2} name="Tasks per Member" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Radar */}
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Multi-Dimensional Performance Analysis</CardTitle>
                <CardDescription>Comprehensive performance metrics radar chart</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={500}>
                  <RadarChart data={comparisonData.performance}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="project" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Progress %" dataKey="progress" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.3} />
                    <Radar name="Efficiency %" dataKey="efficiency" stroke={COLORS.secondary} fill={COLORS.secondary} fillOpacity={0.3} />
                    <Radar name="Profit Margin %" dataKey="profitMargin" stroke={COLORS.success} fill={COLORS.success} fillOpacity={0.3} />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
