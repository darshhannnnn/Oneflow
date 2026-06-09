"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft, Database, Trash2, Edit, Eye, RefreshCw,
  Download, Search, Filter, Loader2, AlertTriangle,
} from "lucide-react";

export default function DatabaseTablePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [tableData, setTableData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const tableName = params.table;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }

    fetchTableData();
  }, [status, session, tableName]);

  const fetchTableData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/database?table=${tableName}`);
      if (res.ok) {
        const data = await res.json();
        setTableData(data);
      }
    } catch (error) {
      console.error('Error fetching table data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!tableData) return;
    const dataStr = JSON.stringify(tableData.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tableName}-${new Date().toISOString()}.json`;
    link.click();
  };

  const handleDelete = async (id) => {
    console.log(`Attempting to delete record with ID: ${id}`);
    
    if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      return;
    }

    try {
      // Use the generic database API endpoint with proper table name mapping
      const prismaTableName = getPrismaTableName(tableName);
      const endpoint = `/api/database/${prismaTableName}/${id}`;
      
      console.log(`DELETE endpoint: ${endpoint}`);
      
      const res = await fetch(endpoint, { method: 'DELETE' });
      
      if (res.ok) {
        alert('Record deleted successfully');
        fetchTableData();
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Delete failed:', errorData);
        if (res.status === 404) {
          alert('Record not found. It may have been already deleted. Refreshing...');
          fetchTableData();
        } else {
          alert(`Failed to delete record: ${errorData.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      alert(`Error deleting record: ${error.message}`);
    }
  };

  const getPrismaTableName = (table) => {
    // Map frontend table names to Prisma model names
    const tableMap = {
      users: 'User',
      projects: 'Project',
      tasks: 'Task',
      timesheets: 'Timesheet',
      expenses: 'Expense',
      salesOrders: 'SalesOrder',
      purchaseOrders: 'PurchaseOrder',
      invoices: 'CustomerInvoice',
      vendorBills: 'VendorBill',
      partners: 'Partner',
      products: 'Product',
      payments: 'Payment',
    };
    return tableMap[table] || table;
  };

  const getViewEndpoint = (table, id) => {
    const endpoints = {
      users: `/dashboard/users/${id}`,
      projects: `/dashboard/projects/${id}`,
      tasks: `/dashboard/tasks/${id}`,
      salesOrders: `/dashboard/sales-orders/${id}`,
      purchaseOrders: `/dashboard/purchase-orders/${id}`,
      invoices: `/dashboard/invoices/${id}`,
    };
    return endpoints[table] || `/dashboard/${table}/${id}`;
  };

  const renderTableData = () => {
    if (!tableData || !tableData.data || tableData.data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Database className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No records found in this table</p>
        </div>
      );
    }

    const filteredData = tableData.data.filter(record => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return JSON.stringify(record).toLowerCase().includes(searchLower);
    });

    // Get column names from first record
    const columns = Object.keys(tableData.data[0]).filter(key => 
      !key.startsWith('_') && typeof tableData.data[0][key] !== 'object'
    );

    return (
      <div className="border rounded-lg">
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(col => (
                  <TableHead key={col} className="capitalize">
                    {col.replace(/([A-Z])/g, ' $1').trim()}
                  </TableHead>
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((record, index) => (
                <TableRow key={record.id || index}>
                  {columns.map(col => (
                    <TableCell key={col}>
                      {renderCellValue(record[col], col)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(getViewEndpoint(tableName, record.id))}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    );
  };

  const renderCellValue = (value, columnName) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">—</span>;
    }

    if (typeof value === 'boolean') {
      return value ? (
        <Badge variant="success">Yes</Badge>
      ) : (
        <Badge variant="secondary">No</Badge>
      );
    }

    if (columnName.toLowerCase().includes('date') || columnName.toLowerCase().includes('at')) {
      try {
        return new Date(value).toLocaleString();
      } catch {
        return value;
      }
    }

    if (columnName.toLowerCase().includes('amount') || 
        columnName.toLowerCase().includes('price') ||
        columnName.toLowerCase().includes('total') ||
        columnName.toLowerCase().includes('cost') ||
        columnName.toLowerCase().includes('revenue')) {
      return `₹${parseFloat(value).toLocaleString()}`;
    }

    if (columnName === 'status' || columnName === 'role') {
      return <Badge variant="outline">{value}</Badge>;
    }

    if (typeof value === 'string' && value.length > 50) {
      return (
        <span title={value}>
          {value.substring(0, 50)}...
        </span>
      );
    }

    return value.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading table data...</p>
        </div>
      </div>
    );
  }

  if (!tableData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Unable to Load Table
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Failed to load table data. Please try again.
            </p>
            <Button onClick={fetchTableData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
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
            <h1 className="text-3xl font-bold capitalize flex items-center gap-2">
              <Database className="h-8 w-8 text-primary" />
              {tableName}
            </h1>
            <p className="text-muted-foreground mt-1">
              {tableData.count.toLocaleString()} total records
              {tableData.hasMore && ` (showing first ${tableData.limit})`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={fetchTableData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table Data */}
      <Card>
        <CardHeader>
          <CardTitle>Records</CardTitle>
          <CardDescription>
            View and manage {tableName} records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderTableData()}
        </CardContent>
      </Card>
    </div>
  );
}
