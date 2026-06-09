"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Calendar,
  DollarSign,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Status configuration for projects
const STATUS_CONFIG = {
  PLANNED: {
    label: "Planned",
    color: "bg-blue-500",
    textColor: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  IN_PROGRESS: {
    label: "Running",
    color: "bg-orange-500",
    textColor: "text-orange-600",
    bgColor: "bg-orange-500/10",
    icon: Clock,
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-green-500",
    textColor: "text-green-600",
    bgColor: "bg-green-500/10",
    icon: CheckCircle2,
  },
  ON_HOLD: {
    label: "Under Review",
    color: "bg-yellow-500",
    textColor: "text-yellow-600",
    bgColor: "bg-yellow-500/10",
    icon: AlertCircle,
  },
};

export default function NewSalesOrderPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProjects();
    }
  }, [status]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "₹0";
    return `₹${parseFloat(amount).toLocaleString("en-IN")}`;
  };

  const formatDate = (date) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleRequestSalesOrder = async () => {
    if (!selectedProject) {
      alert("Please select a project");
      return;
    }

    try {
      setSubmitting(true);
      
      // Generate sales order number
      const soNumber = `SO${Date.now().toString().slice(-6)}`;
      
      const response = await fetch("/api/sales-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: soNumber,
          projectId: selectedProject.id,
          status: "PENDING_APPROVAL",
          note: note || `Sales order request for ${selectedProject.name}`,
          currency: "INR",
          subtotal: selectedProject.budget || 0,
          total: selectedProject.budget || 0,
          taxTotal: 0,
          lines: [], // No lines during request phase
        }),
      });

      if (response.ok) {
        alert("Sales order request submitted successfully! Waiting for manager approval.");
        router.push("/dashboard/sales-orders");
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || "Failed to submit request"}`);
      }
    } catch (error) {
      console.error("Error submitting sales order request:", error);
      alert("Failed to submit sales order request");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold">Request Sales Order</h1>
          <p className="text-muted-foreground mt-1">
            Select a project to create a sales order request. The project manager will review and approve.
          </p>
        </div>
      </div>

      {/* Selected Project Summary */}
      {selectedProject && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Selected Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-lg">{selectedProject.name}</div>
              <Badge className={cn("text-xs", STATUS_CONFIG[selectedProject.status]?.bgColor, STATUS_CONFIG[selectedProject.status]?.textColor)}>
                {STATUS_CONFIG[selectedProject.status]?.label || selectedProject.status}
              </Badge>
            </div>
            <div className="text-2xl font-bold text-green-600">
              Estimated Price: {formatCurrency(selectedProject.budget)}
            </div>
            {selectedProject.description && (
              <p className="text-sm text-muted-foreground">{selectedProject.description}</p>
            )}
            
            {/* Note field */}
            <div className="pt-4">
              <Label htmlFor="note">Additional Note (Optional)</Label>
              <Textarea
                id="note"
                placeholder="Add any additional information for the project manager..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleRequestSalesOrder}
                disabled={submitting}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {submitting ? "Submitting..." : "Submit Request to Manager"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedProject(null)}
              >
                Change Project
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects Grid */}
      {!selectedProject && (
        <>
          <div className="text-lg font-semibold">
            Available Projects ({projects.length})
          </div>

          {projects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No projects available</h3>
                <p className="text-muted-foreground text-center">
                  There are no projects available for sales order requests.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => {
                const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.PLANNED;
                const StatusIcon = statusConfig.icon;

                return (
                  <Card
                    key={project.id}
                    className="border-border/40 hover:border-primary transition-all hover:shadow-lg cursor-pointer group overflow-hidden"
                    onClick={() => setSelectedProject(project)}
                  >
                    {/* Project Image */}
                    <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden">
                      {project.imageUrl ? (
                        <img
                          src={project.imageUrl}
                          alt={project.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-16 w-16 mb-2" />
                          <span className="text-sm">No image</span>
                        </div>
                      )}
                      
                      {/* Status Badge Overlay */}
                      <div className="absolute top-3 right-3">
                        <Badge className={cn("text-xs backdrop-blur-sm", statusConfig.bgColor, statusConfig.textColor)}>
                          {StatusIcon && <StatusIcon className="h-3 w-3 mr-1" />}
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </div>

                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                        {project.name}
                      </CardTitle>
                      {project.description && (
                        <CardDescription className="line-clamp-2">
                          {project.description}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {/* Estimated Selling Price */}
                      <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          <span>Estimated Price</span>
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(project.budget)}
                        </div>
                      </div>

                      {/* Project Manager */}
                      {project.manager && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          <span>Manager: {project.manager.name}</span>
                        </div>
                      )}

                      {/* Dates */}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(project.startDate)}</span>
                        </div>
                        {project.endDate && (
                          <span className="text-xs">
                            to {formatDate(project.endDate)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
