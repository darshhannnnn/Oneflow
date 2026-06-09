"use client";

import { useState, useEffect } from "react";
import { taskSchema } from "@/lib/validations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus, Loader2, X, ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";

export default function CreateTaskDialog({ projectId, onTaskCreated, trigger, projectMembers = [], projectManager = null, currentUserId = null }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigneeId: "",
    status: "NEW",
    priority: "MEDIUM",
    deadline: "",
    estimateHours: "",
    coverUrl: "",
    images: [],
  });

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open, projectMembers, projectManager, currentUserId]);

  const fetchUsers = async () => {
    try {
      // Filter users to show only project members and project manager
      // Exclude the current logged-in user from the list
      const eligibleUsers = [];
      
      // Add project manager if exists and is not the current user
      if (projectManager && projectManager.id !== currentUserId) {
        eligibleUsers.push({
          id: projectManager.id,
          name: projectManager.name,
          email: projectManager.email,
          role: projectManager.role || 'PROJECT_MANAGER',
        });
      }
      
      // Add team members who are not the current user
      if (projectMembers && projectMembers.length > 0) {
        projectMembers.forEach(member => {
          if (member.user && member.user.id !== currentUserId) {
            eligibleUsers.push({
              id: member.user.id,
              name: member.user.name,
              email: member.user.email,
              role: member.user.role || 'TEAM_MEMBER',
            });
          }
        });
      }
      
      // Remove duplicates based on user ID
      const uniqueUsers = eligibleUsers.filter((user, index, self) =>
        index === self.findIndex((u) => u.id === user.id)
      );
      
      setUsers(uniqueUsers);
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

  const handleMultipleImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file sizes
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is larger than 5MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setImageFiles(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadMultipleImages = async () => {
    if (imageFiles.length === 0) return [];

    setUploadingImages(true);
    const uploadedUrls = [];

    try {
      for (const file of imageFiles) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);

        const response = await fetch("/api/upload/image", {
          method: "POST",
          body: formDataUpload,
        });

        if (response.ok) {
          const data = await response.json();
          uploadedUrls.push(data.url);
        } else {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }
      return uploadedUrls;
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Failed to upload some images");
      return uploadedUrls;
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    // Validate form data with Zod
    const validation = taskSchema.safeParse(formData);
    
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
      // Upload multiple images first if any are selected
      let imageUrls = [];
      if (imageFiles.length > 0) {
        imageUrls = await uploadMultipleImages();
        if (imageUrls.length === 0 && imageFiles.length > 0) {
          setLoading(false);
          return;
        }
      }

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          projectId,
          images: imageUrls,
        }),
      });

      if (response.ok) {
        const task = await response.json();
        if (onTaskCreated) {
          onTaskCreated(task);
        }
        setOpen(false);
        // Reset form
        setFormData({
          title: "",
          description: "",
          assigneeId: "",
          status: "NEW",
          priority: "MEDIUM",
          deadline: "",
          estimateHours: "",
          coverUrl: "",
          images: [],
        });
        setImageFiles([]);
        setImagePreviews([]);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create task");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to the project. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Task Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter task title"
                required
                className={fieldErrors.title ? 'border-red-500' : ''}
              />
              {fieldErrors.title && (
                <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter task description"
                rows={3}
                className={fieldErrors.description ? 'border-red-500' : ''}
              />
              {fieldErrors.description && (
                <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.description}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="BLOCKED">Blocked</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleSelectChange("priority", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="assigneeId">Assign To</Label>
                <Select
                  value={formData.assigneeId || "unassigned"}
                  onValueChange={(value) => handleSelectChange("assigneeId", value === "unassigned" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  name="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={fieldErrors.deadline ? 'border-red-500' : ''}
                />
                {fieldErrors.deadline && (
                  <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.deadline}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="estimateHours">Estimated Hours</Label>
                <Input
                  id="estimateHours"
                  name="estimateHours"
                  type="number"
                  step="0.5"
                  min="0"
                  max="10000"
                  value={formData.estimateHours}
                  onChange={handleChange}
                  placeholder="e.g., 8"
                  className={fieldErrors.estimateHours ? 'border-red-500' : ''}
                />
                {fieldErrors.estimateHours && (
                  <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.estimateHours}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverUrl">Cover Image</Label>
                <div className="flex gap-2">
                  <Input
                    id="coverUrl"
                    name="coverUrl"
                    value={formData.coverUrl}
                    onChange={handleChange}
                    placeholder="https://... or upload below"
                    className={fieldErrors.coverUrl ? 'border-red-500' : ''}
                  />
                </div>
                {fieldErrors.coverUrl && (
                  <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.coverUrl}</p>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      // Upload file
                      const formDataUpload = new FormData();
                      formDataUpload.append('file', file);
                      
                      try {
                        const response = await fetch('/api/upload/task-cover', {
                          method: 'POST',
                          body: formDataUpload,
                        });
                        
                        if (response.ok) {
                          const data = await response.json();
                          setFormData(prev => ({ ...prev, coverUrl: data.url }));
                        } else {
                          alert('Failed to upload image');
                        }
                      } catch (error) {
                        console.error('Upload error:', error);
                        alert('Failed to upload image');
                      }
                    }}
                    className="text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload an image or paste a URL above
                </p>
              </div>
            </div>

            {/* Multiple Images Upload */}
            <div className="space-y-2">
              <Label htmlFor="multipleImages">Task Images (Multiple)</Label>
              <div className="flex flex-col gap-3">
                <label
                  htmlFor="multipleImages"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/40 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-8 w-8" />
                    <p className="text-sm font-medium">Click to upload task images</p>
                    <p className="text-xs">PNG, JPG or WEBP (max 5MB each)</p>
                  </div>
                  <input
                    id="multipleImages"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleMultipleImagesChange}
                    className="hidden"
                  />
                </label>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-border/40"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Upload multiple images to create a carousel in the task card
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploadingImages}>
              {loading || uploadingImages ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {uploadingImages ? "Uploading Images..." : "Creating..."}
                </>
              ) : (
                "Create Task"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
