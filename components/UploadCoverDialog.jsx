"use client";

import { useState } from "react";
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
import { Loader2, Upload, Image as ImageIcon } from "lucide-react";

export default function UploadCoverDialog({ isOpen, onClose, onUpload, currentCoverUrl }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentCoverUrl || null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [manualUrl, setManualUrl] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/upload/task-cover', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      onUpload(data.url);
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleManualUrl = () => {
    if (!manualUrl.trim()) {
      alert('Please enter a URL');
      return;
    }

    onUpload(manualUrl.trim());
    onClose();
  };

  const handleRemoveCover = () => {
    onUpload("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change Task Cover</DialogTitle>
          <DialogDescription>
            Upload an image or provide a URL for the task cover
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Preview */}
          {preview && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Upload Image</Label>
            <div className="flex gap-2">
              <Input
                id="file"
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp,image/gif"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Max 5MB. Supports JPEG, PNG, WebP, GIF
            </p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Manual URL */}
          <div className="space-y-2">
            <Label htmlFor="url">Image URL</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                disabled={uploading}
              />
              <Button
                onClick={handleManualUrl}
                disabled={!manualUrl.trim() || uploading}
                variant="outline"
                className="gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                Use URL
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="destructive"
            onClick={handleRemoveCover}
            disabled={uploading}
          >
            Remove Cover
          </Button>
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
