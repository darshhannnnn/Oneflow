"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { projectSchema } from "@/lib/validations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

export default function EditProjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id;
  
  const [loading, setLoading] = useState(false);
  const [fetchingProject, setFetchingProject] = useState(true);
  const [users, setUsers] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    managerId: "",
    status: "PLANNED",
    startDate: "",
    endDate: "",
    budget: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated" && projectId) {
      fetchProject();
      fetchUsers();
    }
  }, [status, projectId]);

  const fetchProject = async () => {
    try {
      setFetchingProject(true);
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        
        // Check if user can edit this project
        if (session?.user?.role !== "ADMIN" && data.managerId !== session?.user?.id) {
          alert("You don't have permission to edit this project");
          router.push(`/dashboard/projects/${projectId}`);
          return;
        }
        
        setFormData({
          name: data.name || "",
          code: data.code || "",
          description: data.description || "",
          managerId: data.managerId || "",
          status: data.status || "PLANNED",
          startDate: data.startDate ? new Date(data.startDate).toISOString().split("T")[0] : "",
          endDate: data.endDate ? new Date(data.endDate).toISOString().split("T")[0] : "",
          budget: data.budget || "",
        });
      } else {
        alert("Failed to load project");
        router.push("/dashboard/projects");
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      alert("Error loading project");
    } finally {
      setFetchingProject(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate with Zod
    const result = projectSchema.safeParse(formData);
    if (!result.success) {
      const errors = {};
      result.error.errors.forEach((err) => {
        errors[err.path[0]] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push(`/dashboard/projects/${projectId}`);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update project");
      }
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Failed to update project");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || fetchingProject) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/dashboard/projects/${projectId}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Project</h1>
          <p className="text-muted-foreground">Update project details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
            <CardDescription>Update the project details below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Project Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter project name"
                required
              />
              {fieldErrors.name && (
                <p className="text-sm text-red-600">{fieldErrors.name}</p>
              )}
            </div>

            {/* Project Code */}
            <div className="space-y-2">
              <Label htmlFor="code">Project Code</Label>
              <Input
                id="code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="e.g., PROJ-001"
              />
              {fieldErrors.code && (
                <p className="text-sm text-red-600">{fieldErrors.code}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Project description"
                rows={4}
              />
              {fieldErrors.description && (
                <p className="text-sm text-red-600">{fieldErrors.description}</p>
              )}
            </div>

            {/* Project Manager */}
            <div className="space-y-2">
              <Label htmlFor="managerId">Project Manager</Label>
              <Select
                value={formData.managerId}
                onValueChange={(value) => handleSelectChange("managerId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project manager" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((u) => u.role === "PROJECT_MANAGER" || u.role === "ADMIN")
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {fieldErrors.managerId && (
                <p className="text-sm text-red-600">{fieldErrors.managerId}</p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleSelectChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNED">Planned</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.status && (
                <p className="text-sm text-red-600">{fieldErrors.status}</p>
              )}
            </div>

            {/* Dates */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                />
                {fieldErrors.startDate && (
                  <p className="text-sm text-red-600">{fieldErrors.startDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate}
                />
                {fieldErrors.endDate && (
                  <p className="text-sm text-red-600">{fieldErrors.endDate}</p>
                )}
              </div>
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (₹)</Label>
              <Input
                id="budget"
                name="budget"
                type="number"
                step="0.01"
                min="0"
                value={formData.budget}
                onChange={handleChange}
                placeholder="0.00"
              />
              {fieldErrors.budget && (
                <p className="text-sm text-red-600">{fieldErrors.budget}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/dashboard/projects/${projectId}`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Updating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update Project
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
