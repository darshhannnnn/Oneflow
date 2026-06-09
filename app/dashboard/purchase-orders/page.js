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
  Truck,
  Package,
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
  RECEIVED: {
    label: "Received",
    icon: Package,
    color: "bg-orange-500",
    textColor: "text-orange-600",
    bgColor: "bg-orange-500/10",
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

export default function PurchaseOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      // Check if user has permission to view purchase orders
      if (!UI_PERMISSIONS.canManagePurchaseOrders(session.user.role)) {
        router.push("/dashboard");
        return;
      }
      fetchPurchaseOrders();
    }
  }, [status, activeFilter, session]);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const url = activeFilter === "all" 
        ? "/api/purchase-orders" 
        : `/api/purchase-orders?status=${activeFilter}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPurchaseOrders(data);
      }
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
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
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleCreatePO = () => {
    router.push("/dashboard/purchase-orders/new");
  };

  const handlePOClick = (poId) => {
    router.push(`/dashboard/purchase-orders/${poId}`);
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
    total: purchaseOrders.length,
    draft: purchaseOrders.filter(po => po.status === "DRAFT").length,
    confirmed: purchaseOrders.filter(po => po.status === "CONFIRMED").length,
    received: purchaseOrders.filter(po => po.status === "RECEIVED").length,
    totalValue: purchaseOrders.reduce((sum, po) => sum + parseFloat(po.total || 0), 0),
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground mt-1">
            Manage vendor purchase orders and procurement
          </p>
        </div>
        <Button onClick={handleCreatePO} className="gap-2">
          <Plus className="h-4 w-4" />
          New Purchase Order
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
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(stats.totalValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Tabs value={activeFilter} onValueChange={setActiveFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="DRAFT">Draft</TabsTrigger>
          <TabsTrigger value="CONFIRMED">Confirmed</TabsTrigger>
          <TabsTrigger value="SENT">Sent</TabsTrigger>
          <TabsTrigger value="RECEIVED">Received</TabsTrigger>
          <TabsTrigger value="DONE">Done</TabsTrigger>
          <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeFilter} className="mt-6">
          {purchaseOrders.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No purchase orders found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first purchase order to get started
                </p>
                <Button onClick={handleCreatePO} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Purchase Order
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {purchaseOrders.map((po) => {
                const statusConfig = STATUS_CONFIG[po.status] || STATUS_CONFIG.DRAFT;
                const StatusIcon = statusConfig.icon;

                return (
                  <Card
                    key={po.id}
                    className="border-border/40 hover:border-border transition-all hover:shadow-lg cursor-pointer group"
                    onClick={() => handlePOClick(po.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={cn("text-xs", statusConfig.bgColor, statusConfig.textColor)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {po.number}
                          </CardTitle>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-orange-600">
                            {formatCurrency(po.total)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {po.currency}
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {/* Vendor */}
                      {po.partner && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{po.partner.name}</span>
                        </div>
                      )}

                      {/* Project */}
                      {po.project && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span>{po.project.name}</span>
                        </div>
                      )}

                      {/* Date */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(po.date)}</span>
                        </div>
                      </div>

                      {/* Expected Delivery */}
                      {po.expectedDeliveryDate && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Truck className="h-4 w-4" />
                          <span className="text-xs">
                            Expected: {formatDate(po.expectedDeliveryDate)}
                          </span>
                        </div>
                      )}

                      {/* Lines count */}
                      <div className="pt-2 border-t border-border/40">
                        <div className="text-xs text-muted-foreground">
                          {po._count?.lines || 0} line items •{" "}
                          {po._count?.vendorBills || 0} vendor bills
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
