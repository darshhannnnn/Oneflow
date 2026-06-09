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
import { ArrowLeft, Save, Loader2 } from "lucide-react";

export default function NewTimesheetPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [formData, setFormData] = useState({
    taskId: "",
    date: new Date().toISOString().split("T")[0],
    hours: "",
    billable: true,
  });

  useEffect(() => {
    if (status === "authenticated") {
      fetchProjects();
    }
  }, [status]);

  useEffect(() => {
    if (selectedProject) {
      fetchTasks(selectedProject);
    } else {
      setTasks([]);
      setFormData((prev) => ({ ...prev, taskId: "" }));
    }
  }, [selectedProject]);

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

  const fetchTasks = async (projectId) => {
    try {
      const response = await fetch(`/api/tasks?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.taskId || !formData.date || !formData.hours) {
      alert("Please fill in all required fields");
      return;
    }

    if (parseFloat(formData.hours) <= 0 || parseFloat(formData.hours) > 24) {
      alert("Hours must be between 0 and 24");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/timesheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push("/dashboard/timesheets");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create timesheet");
      }
    } catch (error) {
      console.error("Error creating timesheet:", error);
      alert("Failed to create timesheet");
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
          onClick={() => router.push("/dashboard/timesheets")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Log Hours</h1>
          <p className="text-muted-foreground">Record your work time</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle>Time Entry Details</CardTitle>
            <CardDescription>Fill in the information below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project">
                Project <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
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
              <Label htmlFor="taskId">
                Task <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.taskId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, taskId: value }))
                }
                disabled={!selectedProject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedProject && (
                <p className="text-xs text-muted-foreground">
                  Select a project first
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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

              <div className="space-y-2">
                <Label htmlFor="hours">
                  Hours <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="hours"
                  name="hours"
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={formData.hours}
                  onChange={handleChange}
                  placeholder="e.g., 8"
                  required
                />
              </div>
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
                Billable hours
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/timesheets")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Entry
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
