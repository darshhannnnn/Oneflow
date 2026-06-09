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
import { Loader2, X, ImageIcon, Lock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EditTaskDialog({ isOpen, onClose, task, onTaskUpdated, canManageTasks = true, userId, userRole, projectMembers = [], projectManager = null }) {
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
    loggedHours: "",
    coverUrl: "",
    images: [],
  });

  // Team members can only update status, not other critical fields
  const isTeamMember = userRole === 'TEAM_MEMBER';
  const canEditCriticalFields = !isTeamMember;

  useEffect(() => {
    if (isOpen && task) {
      // Populate form with task data
      setFormData({
        title: task.title || "",
        description: task.description || "",
        assigneeId: task.assigneeId || "",
        status: task.status || "NEW",
        priority: task.priority || "MEDIUM",
        deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : "",
        estimateHours: task.estimateHours || "",
        loggedHours: task.loggedHours || "",
        coverUrl: task.coverUrl || "",
        images: task.images || [],
      });
      // Set existing images as previews
      setImagePreviews(task.images || []);
      setImageFiles([]);
      fetchUsers();
    }
  }, [isOpen, task, projectMembers, projectManager, userId]);

  const fetchUsers = async () => {
    try {
      // Filter users to show only project members and project manager
      // Exclude the current logged-in user from the list
      const eligibleUsers = [];
      
      // Add project manager if exists and is not the current user
      if (projectManager && projectManager.id !== userId) {
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
          if (member.user && member.user.id !== userId) {
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

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is larger than 5MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setImageFiles(prev => [...prev, ...validFiles]);

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index) => {
    // Check if it's an existing image URL or a new file preview
    const isExistingImage = index < (task?.images?.length || 0);
    
    if (isExistingImage) {
      // Remove from existing images
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    } else {
      // Remove from new uploads
      const newFileIndex = index - (task?.images?.length || 0);
      setImageFiles(prev => prev.filter((_, i) => i !== newFileIndex));
    }
    
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
      // Upload new images if any
      let newImageUrls = [];
      if (imageFiles.length > 0) {
        newImageUrls = await uploadMultipleImages();
      }

      // Combine existing images with newly uploaded ones
      const allImages = [...formData.images, ...newImageUrls];

      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          images: allImages,
          assigneeId: formData.assigneeId === "unassigned" ? null : formData.assigneeId,
        }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        if (onTaskUpdated) {
          onTaskUpdated(updatedTask);
        }
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
  };

  if (!task) return null;

  // Check if user can edit this task
  const isTaskOwner = task.assigneeId === userId;
  const canEdit = canManageTasks || isTaskOwner;

  if (!canEdit) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Access Denied</DialogTitle>
            <DialogDescription>
              You don&apos;t have permission to edit this task.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            {isTeamMember ? (
              <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Lock className="h-4 w-4" />
                You can only update status. Use comments to communicate with your manager.
              </span>
            ) : (
              "Update task details"
            )}
          </DialogDescription>
        </DialogHeader>

        {isTeamMember && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              As a team member, you can only update the task status. To communicate about the task, please use the comment feature.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Cover Preview */}
            {formData.coverUrl && (
              <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border">
                <img
                  src={formData.coverUrl}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

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
                disabled={isTeamMember}
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
                disabled={isTeamMember}
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
                  disabled={isTeamMember}
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
                  disabled={isTeamMember}
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
                  disabled={isTeamMember}
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
                  disabled={isTeamMember}
                  className={fieldErrors.estimateHours ? 'border-red-500' : ''}
                />
                {fieldErrors.estimateHours && (
                  <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.estimateHours}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="loggedHours">Logged Hours</Label>
                <Input
                  id="loggedHours"
                  name="loggedHours"
                  type="number"
                  step="0.5"
                  min="0"
                  max="10000"
                  value={formData.loggedHours}
                  onChange={handleChange}
                  placeholder="e.g., 4.5"
                  className={fieldErrors.loggedHours ? 'border-red-500' : ''}
                />
                {fieldErrors.loggedHours && (
                  <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.loggedHours}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Hours already logged on this task
                </p>
              </div>
            </div>

            {!isTeamMember && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="coverUrl">Cover Image URL</Label>
                  <Input
                    id="coverUrl"
                    name="coverUrl"
                    value={formData.coverUrl}
                    onChange={handleChange}
                    placeholder="https://..."
                    className={fieldErrors.coverUrl ? 'border-red-500' : ''}
                  />
                  {fieldErrors.coverUrl && (
                    <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.coverUrl}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coverFile">Upload Cover Image</Label>
                  <Input
                    id="coverFile"
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="text-sm"
                  />
                </div>
              </div>
            )}

            {/* Multiple Images Upload */}
            {!isTeamMember && (
              <div className="space-y-2">
                <Label htmlFor="multipleImages">Task Images (Multiple)</Label>
              <div className="flex flex-col gap-3">
                <label
                  htmlFor="multipleImages"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/40 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-8 w-8" />
                    <p className="text-sm font-medium">Click to add more images</p>
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
                        <button
                          type="button"
                          className="absolute top-1 right-1 h-6 w-6 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {imagePreviews.length} image(s) - Images will be shown in a carousel
                </p>
              </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploadingImages}>
              {loading || uploadingImages ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {uploadingImages ? "Uploading Images..." : "Updating..."}
                </>
              ) : (
                "Update Task"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
