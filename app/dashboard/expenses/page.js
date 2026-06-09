"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  Plus,
  Calendar,
  Edit,
  Trash2,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Receipt,
} from "lucide-react";

export default function ExpensesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState("all");
  const [filterApproved, setFilterApproved] = useState("all");
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    totalAmount: 0,
    pending: 0,
    approved: 0,
  });

  useEffect(() => {
    if (status === "authenticated") {
      fetchExpenses();
      fetchProjects();
    }
  }, [status]);

  useEffect(() => {
    applyFilters();
  }, [expenses, filterProject, filterApproved]);

  const fetchExpenses = async () => {
    try {
      const response = await fetch(`/api/expenses?userId=${session.user.id}`);
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
        calculateStats(data);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
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
    const totalAmount = data.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const pending = data.filter((e) => !e.approved).length;
    const approved = data.filter((e) => e.approved).length;

    setStats({
      totalAmount,
      pending,
      approved,
    });
  };

  const applyFilters = () => {
    let filtered = [...expenses];

    if (filterProject !== "all") {
      filtered = filtered.filter((e) => e.project?.id === filterProject);
    }

    if (filterApproved !== "all") {
      filtered = filtered.filter((e) => 
        filterApproved === "approved" ? e.approved : !e.approved
      );
    }

    setFilteredExpenses(filtered);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setExpenses(expenses.filter((e) => e.id !== id));
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete expense");
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Error deleting expense");
    }
  };

  const getStatusBadge = (approved) => {
    if (approved) {
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
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
          <h1 className="text-3xl font-bold">My Expenses</h1>
          <p className="text-muted-foreground mt-1">
            Submit and track your expense reimbursements
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/expenses/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Expense
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All expenses</p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Ready for reimbursement</p>
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
              <label className="text-sm font-medium">Status</label>
              <Select value={filterApproved} onValueChange={setFilterApproved}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setFilterProject("all");
                  setFilterApproved("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle>Expense Submissions</CardTitle>
          <CardDescription>
            {filteredExpenses.length} expenses found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No expenses yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Submit your first expense for reimbursement
              </p>
              <Button onClick={() => router.push("/dashboard/expenses/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Submit Expense
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/40 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">
                        {expense.description}
                      </h4>
                      {getStatusBadge(expense.approved)}
                      {expense.billable && (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                          Billable
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {expense.project?.name}
                      {expense.category && ` • ${expense.category}`}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(expense.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ₹{parseFloat(expense.amount).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {expense.status === "PENDING" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            router.push(`/dashboard/expenses/${expense.id}/edit`)
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(expense.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    )}
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
