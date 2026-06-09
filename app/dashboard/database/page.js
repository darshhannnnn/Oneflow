"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RoleGuard } from "@/components/AccessControl";
import { Database, Plus, Edit, Trash2, Search, RefreshCw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const TABLES = [
  { value: "User", label: "Users" },
  { value: "Project", label: "Projects" },
  { value: "Task", label: "Tasks" },
  { value: "Timesheet", label: "Timesheets" },
  { value: "Expense", label: "Expenses" },
  { value: "SalesOrder", label: "Sales Orders" },
  { value: "CustomerInvoice", label: "Customer Invoices" },
  { value: "PurchaseOrder", label: "Purchase Orders" },
  { value: "Partner", label: "Partners" },
];

export default function DatabaseManagementPage() {
  const { data: session } = useSession();
  const [selectedTable, setSelectedTable] = useState("");
  const [records, setRecords] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (selectedTable) {
      fetchRecords();
    }
  }, [selectedTable]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/database/${selectedTable}`);
      if (response.ok) {
        const data = await response.json();
        setRecords(data.records);
        setColumns(data.columns);
      }
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch(`/api/database/${selectedTable}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setCreateDialog(false);
        setFormData({});
        fetchRecords();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create record");
      }
    } catch (error) {
      console.error("Error creating record:", error);
      alert("Failed to create record");
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch(`/api/database/${selectedTable}/${selectedRecord.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setEditDialog(false);
        setFormData({});
        setSelectedRecord(null);
        fetchRecords();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update record");
      }
    } catch (error) {
      console.error("Error updating record:", error);
      alert("Failed to update record");
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/database/${selectedTable}/${selectedRecord.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDeleteDialog(false);
        setSelectedRecord(null);
        fetchRecords();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete record");
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("Failed to delete record");
    }
  };

  const openEditDialog = (record) => {
    setSelectedRecord(record);
    setFormData({ ...record });
    setEditDialog(true);
  };

  const openDeleteDialog = (record) => {
    setSelectedRecord(record);
    setDeleteDialog(true);
  };

  const openCreateDialog = () => {
    setFormData({});
    setCreateDialog(true);
  };

  const filteredRecords = records.filter((record) => {
    if (!searchTerm) return true;
    return Object.values(record).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <RoleGuard roles={["ADMIN"]}>
      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Database className="h-8 w-8" />
              Database Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Direct CRUD operations on database tables
            </p>
          </div>
        </div>

        <Card className="border-border/40">
          <CardHeader>
            <CardTitle>Select Table</CardTitle>
            <CardDescription>Choose a table to view and manage records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Select value={selectedTable} onValueChange={setSelectedTable}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a table" />
                  </SelectTrigger>
                  <SelectContent>
                    {TABLES.map((table) => (
                      <SelectItem key={table.value} value={table.value}>
                        {table.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedTable && (
                <>
                  <Button onClick={fetchRecords} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button onClick={openCreateDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedTable && (
          <Card className="border-border/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{TABLES.find((t) => t.value === selectedTable)?.label}</CardTitle>
                  <CardDescription>{records.length} records found</CardDescription>
                </div>
                <div className="w-64">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search records..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {columns.map((col) => (
                          <TableHead key={col}>{col}</TableHead>
                        ))}
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">
                            No records found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRecords.map((record, idx) => (
                          <TableRow key={record.id || idx}>
                            {columns.map((col) => (
                              <TableCell key={col} className="max-w-xs truncate">
                                {record[col] !== null && record[col] !== undefined
                                  ? typeof record[col] === "object"
                                    ? JSON.stringify(record[col])
                                    : String(record[col])
                                  : "-"}
                              </TableCell>
                            ))}
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(record)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDeleteDialog(record)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create Dialog */}
        <Dialog open={createDialog} onOpenChange={setCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Record</DialogTitle>
              <DialogDescription>
                Add a new record to {TABLES.find((t) => t.value === selectedTable)?.label}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {columns
                .filter((col) => col !== "id" && col !== "createdAt" && col !== "updatedAt")
                .map((col) => (
                  <div key={col} className="grid gap-2">
                    <Label htmlFor={col}>{col}</Label>
                    <Input
                      id={col}
                      value={formData[col] || ""}
                      onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
                      placeholder={`Enter ${col}`}
                    />
                  </div>
                ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Record</DialogTitle>
              <DialogDescription>
                Update record in {TABLES.find((t) => t.value === selectedTable)?.label}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {columns
                .filter((col) => col !== "id" && col !== "createdAt" && col !== "updatedAt")
                .map((col) => (
                  <div key={col} className="grid gap-2">
                    <Label htmlFor={col}>{col}</Label>
                    <Input
                      id={col}
                      value={formData[col] || ""}
                      onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
                      placeholder={`Enter ${col}`}
                    />
                  </div>
                ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>Update</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Record</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this record? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
