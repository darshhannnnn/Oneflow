"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, Mail, Shield, DollarSign, Save, Loader2, 
  ArrowLeft, CheckCircle2, AlertCircle, Upload, Camera 
} from "lucide-react";
import { profileSchema } from "@/lib/validations";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    hourlyRate: "",
    avatarUrl: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || "",
        email: session.user.email || "",
        role: session.user.role || "TEAM_MEMBER",
        hourlyRate: "",
        avatarUrl: session.user.image || "",
      });
      setPreviewUrl(session.user.image || "");
    }
  }, [session]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        setMessage({ type: "error", text: "Please select a valid image file (JPEG, PNG, WebP, or GIF)" });
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setMessage({ type: "error", text: "File size must be less than 5MB" });
        return;
      }

      setSelectedFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      setMessage({ type: "", text: "" });
    }
  };

  const handleUploadImage = async () => {
    if (!selectedFile) return null;

    setIsUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", selectedFile);

      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: uploadFormData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Image uploaded successfully!" });
        return data.url;
      } else {
        setMessage({ type: "error", text: data.error || "Failed to upload image" });
        return null;
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({ type: "error", text: "Failed to upload image" });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });
    setFieldErrors({});

    // Validate form data with Zod
    const validation = profileSchema.safeParse({
      name: formData.name,
      hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
      avatarUrl: formData.avatarUrl || undefined,
    });

    if (!validation.success) {
      const errors = {};
      if (validation.error?.issues) {
        validation.error.issues.forEach((err) => {
          errors[err.path[0]] = err.message;
        });
      }
      setFieldErrors(errors);
      setMessage({ type: "error", text: "Please fix the validation errors" });
      setIsLoading(false);
      return;
    }

    try {
      // Upload image first if a new one is selected
      let newAvatarUrl = formData.avatarUrl;
      if (selectedFile) {
        const uploadedUrl = await handleUploadImage();
        if (uploadedUrl) {
          newAvatarUrl = uploadedUrl;
        } else {
          setIsLoading(false);
          return; // Stop if upload failed
        }
      }

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role,
          hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
          avatarUrl: newAvatarUrl || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setSelectedFile(null);
        // Update the session with new data
        await update({
          ...session,
          user: {
            ...session.user,
            name: formData.name,
            role: formData.role,
            image: newAvatarUrl,
          },
        });
        
        // Reload the page to ensure all components reflect the new image
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update profile" });
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  const userInitials = formData.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || formData.email?.[0]?.toUpperCase() || "U";

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
      case "PROJECT_MANAGER":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "SALES":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      case "FINANCE":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard")}
            className="hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground ivy-font">Profile Settings</h1>
            <p className="text-muted-foreground ivy-font">Manage your account information</p>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            )}
            <p
              className={`text-sm ivy-font ${
                message.type === "success"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <Card className="md:col-span-1 border-border/40 backdrop-blur-sm bg-card/50 h-fit">
            <CardHeader>
              <CardTitle className="ivy-font">Profile</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-emerald-500/20">
                  <AvatarImage src={previewUrl || undefined} alt={formData.name} />
                  <AvatarFallback className="bg-emerald-500 text-white text-3xl font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                
                {/* Upload Button Overlay */}
                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <div className="flex flex-col items-center gap-1">
                    <Camera className="w-6 h-6 text-white" />
                    <span className="text-xs text-white font-medium">Change</span>
                  </div>
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              
              {selectedFile && (
                <div className="text-center">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 ivy-font">
                    New image selected
                  </p>
                  <p className="text-xs text-muted-foreground ivy-font">
                    {selectedFile.name}
                  </p>
                </div>
              )}
              
              <div className="text-center">
                <h3 className="text-xl font-semibold text-foreground ivy-font">
                  {formData.name || "User"}
                </h3>
                <p className="text-sm text-muted-foreground ivy-font">{formData.email}</p>
                <Badge
                  variant="outline"
                  className={`mt-3 ${getRoleBadgeColor(formData.role)}`}
                >
                  <Shield className="w-3 h-3 mr-1" />
                  {formData.role?.replace("_", " ")}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Edit Form */}
          <Card className="md:col-span-2 border-border/40 backdrop-blur-sm bg-card/50">
            <CardHeader>
              <CardTitle className="ivy-font">Edit Profile</CardTitle>
              <CardDescription className="ivy-font">
                Update your personal information and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="ivy-font">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      className={`pl-10 ivy-font ${fieldErrors.name ? 'border-red-500' : ''}`}
                      required
                    />
                  </div>
                  {fieldErrors.name && (
                    <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.name}</p>
                  )}
                </div>

                {/* Email (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="ivy-font">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      className="pl-10 ivy-font bg-muted/50"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-muted-foreground ivy-font">
                    Email cannot be changed
                  </p>
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="ivy-font">
                    Role
                  </Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ivy-font"
                    >
                      <option value="TEAM_MEMBER">Team Member</option>
                      <option value="PROJECT_MANAGER">Project Manager</option>
                      <option value="SALES">Sales</option>
                      <option value="FINANCE">Finance</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>

                {/* Hourly Rate */}
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate" className="ivy-font">
                    Hourly Rate (Optional)
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="hourlyRate"
                      name="hourlyRate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="10000"
                      placeholder="50.00"
                      value={formData.hourlyRate}
                      onChange={handleChange}
                      className={`pl-10 ivy-font ${fieldErrors.hourlyRate ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {fieldErrors.hourlyRate && (
                    <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.hourlyRate}</p>
                  )}
                  <p className="text-xs text-muted-foreground ivy-font">
                    Used for timesheet calculations
                  </p>
                </div>

                {/* Avatar URL */}
                <div className="space-y-2">
                  <Label htmlFor="avatarUrl" className="ivy-font">
                    Avatar URL (Optional)
                  </Label>
                  <Input
                    id="avatarUrl"
                    name="avatarUrl"
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={formData.avatarUrl}
                    onChange={handleChange}
                    className="ivy-font"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground ivy-font">
                    Upload an image using the profile picture above or it will be set automatically
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white ivy-font"
                  disabled={isLoading || isUploading}
                >
                  {isLoading || isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isUploading ? "Uploading image..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
