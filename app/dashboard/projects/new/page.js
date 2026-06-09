"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
import { ArrowLeft, Save, Loader2, Upload, X, Image as ImageIcon } from "lucide-react";

export default function NewProjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
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
    imageUrl: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchUsers();
      // Set current user as default manager if they're a project manager
      if (session?.user?.role === "PROJECT_MANAGER") {
        setFormData((prev) => ({ ...prev, managerId: session.user.id }));
      }
    }
  }, [status, session]);

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
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error when user changes selection
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("Image size should be less than 5MB");
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, imageUrl: "" }));
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", imageFile);

      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      } else {
        throw new Error("Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    // Validate form data with Zod
    const validation = projectSchema.safeParse({
      ...formData,
      memberIds: selectedMembers,
    });
    
    if (!validation.success) {
      const errors = {};
      const errorMessages = [];
      if (validation.error?.issues) {
        validation.error.issues.forEach((err) => {
          const field = err.path[0];
          errors[field] = err.message;
          const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
          errorMessages.push(`• ${fieldName}: ${err.message}`);
        });
      }
      setFieldErrors(errors);
      alert(`Please fix the following validation errors:\n\n${errorMessages.join('\n')}`);
      return;
    }

    setLoading(true);

    try {
      // Upload image first if one is selected
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        imageUrl = await uploadImage();
        if (!imageUrl) {
          setLoading(false);
          return;
        }
      }

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          imageUrl,
          memberIds: selectedMembers,
        }),
      });

      if (response.ok) {
        const project = await response.json();
        router.push(`/dashboard/projects/${project.id}`);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create project");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  const handleMemberToggle = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  if (status === "loading") {
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
          onClick={() => router.push("/dashboard/projects")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Project</h1>
          <p className="text-muted-foreground">
            Set up a new project and assign team members
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the basic details of your project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
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
                    className={fieldErrors.name ? 'border-red-500' : ''}
                  />
                  {fieldErrors.name && (
                    <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Project Code</Label>
                  <Input
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="e.g., PROJ-001"
                    className={fieldErrors.code ? 'border-red-500' : ''}
                  />
                  {fieldErrors.code && (
                    <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.code}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter project description"
                  rows={4}
                  className={fieldErrors.description ? 'border-red-500' : ''}
                />
                {fieldErrors.description && (
                  <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.description}</p>
                )}
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="image">Project Image</Label>
                <div className="flex flex-col gap-4">
                  {imagePreview ? (
                    <div className="relative w-full max-w-md">
                      <img
                        src={imagePreview}
                        alt="Project preview"
                        className="w-full h-48 object-cover rounded-lg border border-border/40"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label
                      htmlFor="image"
                      className="flex flex-col items-center justify-center w-full max-w-md h-48 border-2 border-dashed border-border/40 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <ImageIcon className="h-10 w-10" />
                        <p className="text-sm font-medium">Click to upload project image</p>
                        <p className="text-xs">PNG, JPG or WEBP (max 5MB)</p>
                      </div>
                      <input
                        id="image"
                        name="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange("status", value)}
                  >
                    <SelectTrigger className={fieldErrors.status ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLANNED">Planned</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldErrors.status && (
                    <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.status}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="managerId">Project Manager</Label>
                  <Select
                    value={formData.managerId}
                    onValueChange={(value) => handleSelectChange("managerId", value)}
                  >
                    <SelectTrigger className={fieldErrors.managerId ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select manager" />
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
                    <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.managerId}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline & Budget */}
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle>Timeline & Budget</CardTitle>
              <CardDescription>
                Set project timeline and budget constraints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={fieldErrors.startDate ? 'border-red-500' : ''}
                  />
                  {fieldErrors.startDate && (
                    <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.startDate}</p>
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
                    min={new Date().toISOString().split('T')[0]}
                    className={fieldErrors.endDate ? 'border-red-500' : ''}
                  />
                  {fieldErrors.endDate && (
                    <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.endDate}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Budget (₹)</Label>
                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1000000000"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="Enter project budget"
                  className={fieldErrors.budget ? 'border-red-500' : ''}
                />
                {fieldErrors.budget && (
                  <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.budget}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Select team members to assign to this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {users
                  .filter((u) => u.role === "TEAM_MEMBER" || u.role === "PROJECT_MANAGER")
                  .map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleMemberToggle(user.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(user.id)}
                        onChange={() => handleMemberToggle(user.id)}
                        className="h-4 w-4"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{user.role}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/projects")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {uploadingImage ? "Uploading Image..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Project
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
