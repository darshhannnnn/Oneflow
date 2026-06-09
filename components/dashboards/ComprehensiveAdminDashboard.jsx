"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users, FolderKanban, DollarSign, TrendingUp, TrendingDown,
  Clock, FileText, Database, Activity, BarChart3,
  PieChart, ArrowUpRight, ArrowDownRight, RefreshCw,
  Download, Filter, Calendar, Zap, Target, Award,
  AlertTriangle, CheckCircle2, XCircle, Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart,
} from "recharts";

const COLORS = {
  primary: '#10b981',
  secondary: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#a855f7',
  pink: '#ec4899',
};

const CHART_COLORS = [
  COLORS.primary, COLORS.secondary, COLORS.warning, 
  COLORS.danger, COLORS.info, COLORS.purple, COLORS.pink
];

export default function ComprehensiveAdminDashboard({ user }) {
  const router = useRouter();
  const [analytics, setAnalytics] = useState(null);
  const [dbStats, setDbStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAllData();
  }, [timeRange]);

  const fetchAllData = async () => {
    try {
      setRefreshing(true);
      const [analyticsRes, dbRes] = await Promise.all([
        fetch(`/api/admin/analytics?timeRange=${timeRange}`),
        fetch('/api/admin/database'),
      ]);

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }

      if (dbRes.ok) {
        const data = await dbRes.json();
        setDbStats(data);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchAllData();
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(analytics, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-analytics-${new Date().toISOString()}.json`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading comprehensive analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Unable to Load Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Failed to load analytics data. Please try again.
            </p>
            <Button onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { overview, projectDistribution, taskDistribution, financialSummary, 
          topProjects, userPerformance, recentActivities } = analytics;

  // Prepare chart data
  const projectStatusData = projectDistribution.map(item => ({
    name: item.status.replace('_', ' '),
    value: item.count,
    revenue: item.totalRevenue,
    cost: item.totalCost,
  }));

  const taskStatusData = taskDistribution.map(item => ({
    name: item.status.replace('_', ' '),
    value: item.count,
    hours: item.totalHours,
  }));

  const financialComparisonData = [
    { name: 'Sales Orders', amount: financialSummary.salesOrders.total, count: financialSummary.salesOrders.count },
    { name: 'Purchase Orders', amount: financialSummary.purchaseOrders.total, count: financialSummary.purchaseOrders.count },
    { name: 'Invoices', amount: financialSummary.invoices.total, count: financialSummary.invoices.count },
    { name: 'Vendor Bills', amount: financialSummary.vendorBills.total, count: financialSummary.vendorBills.count },
  ];

  const revenueVsCostData = topProjects.slice(0, 10).map(project => ({
    name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
    revenue: project.totalRevenue,
    cost: project.totalCost,
    profit: project.profit,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8 text-primary" />
            Comprehensive Admin Panel
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete system overview with detailed analytics and database control
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{overview.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              {overview.profitMargin}% margin
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overview.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{overview.profit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cost: ₹{overview.totalCost.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.totalTasks} total tasks
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.totalHoursLogged.toFixed(0)}h logged
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Project Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Project Status Distribution</CardTitle>
                <CardDescription>Current state of all projects</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Task Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Task Status Distribution</CardTitle>
                <CardDescription>Task completion overview</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={taskStatusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill={COLORS.primary} name="Tasks" />
                    <Bar dataKey="hours" fill={COLORS.secondary} name="Hours" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Utilization Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Resource Utilization</CardTitle>
              <CardDescription>Team productivity and efficiency metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Hours Utilization</span>
                  <span className="text-muted-foreground">
                    {overview.totalHoursLogged.toFixed(0)} / {overview.totalHoursEstimated.toFixed(0)} hours
                  </span>
                </div>
                <Progress value={parseFloat(overview.utilizationRate)} className="h-2" />
                <p className="text-xs text-muted-foreground">{overview.utilizationRate}% utilized</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Budget Utilization</span>
                  <span className="text-muted-foreground">
                    ₹{overview.totalCost.toLocaleString()} / ₹{overview.totalBudget.toLocaleString()}
                  </span>
                </div>
                <Progress 
                  value={overview.totalBudget > 0 ? (overview.totalCost / overview.totalBudget) * 100 : 0} 
                  className="h-2" 
                />
                <p className="text-xs text-muted-foreground">
                  {overview.totalBudget > 0 ? ((overview.totalCost / overview.totalBudget) * 100).toFixed(1) : 0}% of budget used
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Financial Documents Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Documents Overview</CardTitle>
                <CardDescription>Sales, purchases, invoices, and bills</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={financialComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="amount" fill={COLORS.primary} name="Amount (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cash Flow Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Summary</CardTitle>
                <CardDescription>Income vs expenses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Income</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      ₹{financialSummary.invoices.total.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ArrowDownRight className="h-5 w-5 text-red-600" />
                      <span className="font-medium">Expenses</span>
                    </div>
                    <span className="text-lg font-bold text-red-600">
                      ₹{financialSummary.vendorBills.total.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border-2 border-primary">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      <span className="font-medium">Net Cash Flow</span>
                    </div>
                    <span className={`text-lg font-bold ${financialSummary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{financialSummary.netCashFlow.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Sales Orders</p>
                      <p className="font-semibold">{financialSummary.salesOrders.count}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Purchase Orders</p>
                      <p className="font-semibold">{financialSummary.purchaseOrders.count}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Invoices</p>
                      <p className="font-semibold">{financialSummary.invoices.count}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Vendor Bills</p>
                      <p className="font-semibold">{financialSummary.vendorBills.count}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue vs Cost by Project */}
          <Card>
            <CardHeader>
              <CardTitle>Top Projects: Revenue vs Cost</CardTitle>
              <CardDescription>Financial performance of top 10 projects</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={revenueVsCostData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-15} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="revenue" fill={COLORS.success} name="Revenue" />
                  <Bar dataKey="cost" fill={COLORS.danger} name="Cost" />
                  <Line type="monotone" dataKey="profit" stroke={COLORS.primary} name="Profit" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Projects</CardTitle>
              <CardDescription>Projects ranked by revenue and profitability</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {topProjects.map((project, index) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{project.name}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Badge variant="outline">{project.status}</Badge>
                            </span>
                            <span>{project._count.tasks} tasks</span>
                            <span>{project._count.members} members</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-sm font-semibold text-green-600">
                          ₹{project.totalRevenue.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {project.profitMargin}% margin
                        </div>
                        <Progress value={project.progressPct || 0} className="h-1 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance Metrics</CardTitle>
              <CardDescription>Individual productivity and contribution analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {userPerformance.slice(0, 20).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold">{user.name || 'Unnamed User'}</h4>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <Badge variant="outline" className="mt-1">{user.role}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-primary">{user._count.assignedTasks}</p>
                          <p className="text-xs text-muted-foreground">Tasks</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-600">{user._count.timesheets}</p>
                          <p className="text-xs text-muted-foreground">Timesheets</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-purple-600">{user.productivity}</p>
                          <p className="text-xs text-muted-foreground">Productivity</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-4">
          {dbStats && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Database Health
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                      <span className="text-2xl font-bold text-green-600">Healthy</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      All systems operational
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Total Records</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{dbStats.totalRecords.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Across {dbStats.tables.length} tables
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Last Checked</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-medium">
                      {new Date(dbStats.lastChecked).toLocaleString()}
                    </div>
                    <Button variant="outline" size="sm" className="mt-2" onClick={handleRefresh}>
                      <RefreshCw className="mr-2 h-3 w-3" />
                      Refresh
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Database Tables</CardTitle>
                  <CardDescription>Record counts and table management</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {dbStats.tables.map((table) => (
                      <div
                        key={table.name}
                        className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/dashboard/admin/database/${table.name}`)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold capitalize">{table.name}</h4>
                          <Badge>{table.count}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{table.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
            <Button variant="outline" onClick={() => router.push('/dashboard/users')}>
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard/projects')}>
              <FolderKanban className="mr-2 h-4 w-4" />
              View Projects
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard/analytics')}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Detailed Analytics
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard/admin/comparison')}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Compare Projects
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard/settings')}>
              <FileText className="mr-2 h-4 w-4" />
              System Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
