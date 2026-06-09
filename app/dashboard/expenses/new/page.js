"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Loader2, Upload } from "lucide-react";

export default function NewExpensePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [formData, setFormData] = useState({
    projectId: "",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    billable: false,
    receiptUrl: "",
  });

  useEffect(() => {
    if (status === "authenticated") {
      fetchProjects();
    }
  }, [status]);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/gif", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        alert("Please select a valid file (JPEG, PNG, WebP, GIF, or PDF)");
        return;
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert("File size must be less than 10MB");
        return;
      }

      setSelectedFile(file);
      
      // Create preview for images only
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null); // PDF doesn't need preview
      }
    }
  };

  const handleUploadReceipt = async () => {
    if (!selectedFile) return null;

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", selectedFile);

      const response = await fetch("/api/upload/receipt", {
        method: "POST",
        body: uploadFormData,
      });

      const data = await response.json();

      if (response.ok) {
        setFormData((prev) => ({ ...prev, receiptUrl: data.url }));
        return data.url;
      } else {
        alert(data.error || "Failed to upload receipt");
        return null;
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload receipt");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.projectId || !formData.description || !formData.amount || !formData.date) {
      alert("Please fill in all required fields");
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      alert("Amount must be greater than 0");
      return;
    }

    setLoading(true);

    try {
      // Upload receipt first if selected
      let receiptUrl = formData.receiptUrl;
      if (selectedFile) {
        const uploadedUrl = await handleUploadReceipt();
        if (uploadedUrl) {
          receiptUrl = uploadedUrl;
        } else {
          setLoading(false);
          return; // Stop if upload failed
        }
      }

      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          receiptUrl,
        }),
      });

      if (response.ok) {
        router.push("/dashboard/expenses");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create expense");
      }
    } catch (error) {
      console.error("Error creating expense:", error);
      alert("Failed to create expense");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/expenses")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Submit Expense</h1>
          <p className="text-muted-foreground">Request reimbursement for your expenses</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle>Expense Details</CardTitle>
            <CardDescription>Fill in the information below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectId">
                Project <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, projectId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="What was this expense for?"
                rows={3}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Amount (₹) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="e.g., 1500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Receipt Upload</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6">
                {!selectedFile && !formData.receiptUrl ? (
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <div className="flex flex-col items-center gap-2">
                      <Label
                        htmlFor="receipt-upload"
                        className="cursor-pointer text-sm font-medium text-primary hover:underline"
                      >
                        Click to upload receipt
                      </Label>
                      <input
                        id="receipt-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/webp,image/gif,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <p className="text-xs text-muted-foreground">
                        Images (JPEG, PNG, WebP, GIF) or PDF up to 10MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {previewUrl && (
                      <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden">
                        <img
                          src={previewUrl}
                          alt="Receipt preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    {selectedFile && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{selectedFile.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(selectedFile.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl(null);
                            setFormData((prev) => ({ ...prev, receiptUrl: "" }));
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                    {formData.receiptUrl && !selectedFile && (
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">Receipt uploaded</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, receiptUrl: "" }));
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                    <Label
                      htmlFor="receipt-upload-new"
                      className="cursor-pointer text-sm text-primary hover:underline inline-block"
                    >
                      Upload different file
                    </Label>
                    <input
                      id="receipt-upload-new"
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,image/webp,image/gif,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Upload a photo or PDF of your receipt for reimbursement
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="billable"
                checked={formData.billable}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, billable: checked }))
                }
              />
              <label
                htmlFor="billable"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                This expense is billable to the client
              </label>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 border border-border/40">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Your expense will be submitted for approval by the project manager.
                Make sure to attach receipts for amounts over ₹500.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/expenses")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading || uploading}>
            {loading || uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {uploading ? "Uploading receipt..." : "Submitting..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Submit Expense
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
