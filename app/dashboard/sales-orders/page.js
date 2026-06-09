"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  FileText,
  DollarSign,
  Calendar,
  User,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  FileCheck,
  AlertCircle,
  Eye,
  Edit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UI_PERMISSIONS } from "@/lib/rbac";

// Status configuration
const STATUS_CONFIG = {
  DRAFT: {
    label: "Draft",
    icon: FileText,
    color: "bg-slate-500",
    textColor: "text-slate-600",
    bgColor: "bg-slate-500/10",
  },
  PENDING_APPROVAL: {
    label: "Pending Approval",
    icon: Clock,
    color: "bg-orange-500",
    textColor: "text-orange-600",
    bgColor: "bg-orange-500/10",
  },
  APPROVED: {
    label: "Approved",
    icon: CheckCircle2,
    color: "bg-green-500",
    textColor: "text-green-600",
    bgColor: "bg-green-500/10",
  },
  REJECTED: {
    label: "Rejected",
    icon: XCircle,
    color: "bg-red-500",
    textColor: "text-red-600",
    bgColor: "bg-red-500/10",
  },
  CONFIRMED: {
    label: "Confirmed",
    icon: CheckCircle2,
    color: "bg-blue-500",
    textColor: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  SENT: {
    label: "Sent",
    icon: Send,
    color: "bg-purple-500",
    textColor: "text-purple-600",
    bgColor: "bg-purple-500/10",
  },
  DONE: {
    label: "Done",
    icon: FileCheck,
    color: "bg-green-500",
    textColor: "text-green-600",
    bgColor: "bg-green-500/10",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    color: "bg-red-500",
    textColor: "text-red-600",
    bgColor: "bg-red-500/10",
  },
};

export default function SalesOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      // Check if user has permission to view sales orders
      if (!UI_PERMISSIONS.canManageSalesOrders(session.user.role)) {
        router.push("/dashboard");
        return;
      }
      fetchSalesOrders();
    }
  }, [status, activeFilter, session]);

  const fetchSalesOrders = async () => {
    try {
      setLoading(true);
      const url = activeFilter === "all" 
        ? "/api/sales-orders" 
        : `/api/sales-orders?status=${activeFilter}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setSalesOrders(data);
      }
    } catch (error) {
      console.error("Error fetching sales orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "₹0";
    return `₹${parseFloat(amount).toLocaleString("en-IN")}`;
  };

  const formatDate = (date) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusDisplay = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
    return config.label;
  };

  const extractPaymentTerms = (note) => {
    if (!note) return '';
    const match = note.match(/Payment Terms:\s*(.*)/i);
    return match ? match[1].trim() : '';
  };

  const handleCreateSO = () => {
    router.push("/dashboard/sales-orders/new");
  };

  const handleSOClick = (soId) => {
    router.push(`/dashboard/sales-orders/${soId}`);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate stats
  const stats = {
    total: salesOrders.length,
    draft: salesOrders.filter(so => so.status === "DRAFT").length,
    confirmed: salesOrders.filter(so => so.status === "CONFIRMED").length,
    done: salesOrders.filter(so => so.status === "DONE").length,
    totalValue: salesOrders.reduce((sum, so) => sum + parseFloat(so.total || 0), 0),
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Orders</h1>
          <p className="text-muted-foreground mt-1">
            Manage customer sales orders and quotations
          </p>
        </div>
        <Button onClick={handleCreateSO} className="gap-2">
          <Plus className="h-4 w-4" />
          New Sales Order
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Draft
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Confirmed
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confirmed}</div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Tabs value={activeFilter} onValueChange={setActiveFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="PENDING_APPROVAL">Pending</TabsTrigger>
          <TabsTrigger value="APPROVED">Approved</TabsTrigger>
          <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
          <TabsTrigger value="DRAFT">Draft</TabsTrigger>
          <TabsTrigger value="CONFIRMED">Confirmed</TabsTrigger>
          <TabsTrigger value="SENT">Sent</TabsTrigger>
          <TabsTrigger value="DONE">Done</TabsTrigger>
          <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeFilter} className="mt-6">
          {salesOrders.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No sales orders found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first sales order to get started
                </p>
                <Button onClick={handleCreateSO} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Sales Order
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Sales Order No.
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Customer Name / Company
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Project Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Order Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Approval Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Total Amount
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {salesOrders.map((so) => {
                        const statusConfig = STATUS_CONFIG[so.status] || STATUS_CONFIG.DRAFT;
                        const StatusIcon = statusConfig.icon;

                        return (
                          <tr
                            key={so.id}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 text-muted-foreground mr-2" />
                                <span className="font-medium text-sm">{so.number}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center">
                                <Building2 className="h-4 w-4 text-muted-foreground mr-2" />
                                <span className="text-sm font-medium">
                                  {so.partner?.name || "N/A"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm text-muted-foreground">
                                {so.project?.name || "-"}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm">{formatDate(so.date)}</span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  statusConfig.bgColor,
                                  statusConfig.textColor
                                )}
                              >
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                            </td>
                            <td className="px-4 py-4">
                              {so.status === "PENDING_APPROVAL" ? (
                                <span className="text-xs text-muted-foreground">
                                  Waiting for manager approval
                                </span>
                              ) : so.status === "APPROVED" ? (
                                <div className="text-xs">
                                  <div className="text-green-600 font-medium">
                                    Approved by {so.approvedBy?.name}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {formatDate(so.approvedAt)}
                                  </div>
                                </div>
                              ) : so.status === "REJECTED" ? (
                                <div className="text-xs">
                                  <div className="text-red-600 font-medium">
                                    Rejected by {so.approvedBy?.name}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {formatDate(so.approvedAt)}
                                  </div>
                                  {so.approvalNote && (
                                    <div className="text-muted-foreground mt-1">
                                      Reason: {so.approvalNote}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm font-semibold text-green-600">
                                {formatCurrency(so.total)}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSOClick(so.id)}
                                className="gap-1"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
