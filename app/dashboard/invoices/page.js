"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, DollarSign, Calendar, User } from "lucide-react";
import Link from "next/link";

const STATUS_CONFIG = {
  DRAFT: { label: "Draft", color: "bg-slate-500/10 text-slate-600" },
  SENT: { label: "Sent", color: "bg-blue-500/10 text-blue-600" },
  PAID: { label: "Paid", color: "bg-green-500/10 text-green-600" },
  PARTIAL: { label: "Partial", color: "bg-yellow-500/10 text-yellow-600" },
  CANCELLED: { label: "Cancelled", color: "bg-red-500/10 text-red-600" },
};

export default function InvoicesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchInvoices();
    }
  }, [status]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/invoices");
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Customer Invoices</h1>
          <p className="text-muted-foreground mt-1">
            Manage customer invoices and payments
          </p>
        </div>
        <Link href="/dashboard/invoices/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {invoices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Invoices Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first customer invoice
              </p>
              <Link href="/dashboard/invoices/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Invoice
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          invoices.map((invoice) => (
            <Card key={invoice.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{invoice.number}</h3>
                      <Badge className={STATUS_CONFIG[invoice.status]?.color}>
                        {STATUS_CONFIG[invoice.status]?.label || invoice.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {/* Customer */}
                      {invoice.partner && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>{invoice.partner.name}</span>
                        </div>
                      )}

                      {/* Date */}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{formatDate(invoice.date)}</span>
                      </div>

                      {/* Due Date */}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Due: {formatDate(invoice.dueDate)}
                        </span>
                      </div>

                      {/* Amount */}
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">
                          {formatCurrency(invoice.total)}
                        </span>
                      </div>
                    </div>

                    {invoice.project && (
                      <div className="text-sm text-muted-foreground">
                        Project: {invoice.project.name}
                      </div>
                    )}
                  </div>

                  <Link href={`/dashboard/invoices/${invoice.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
