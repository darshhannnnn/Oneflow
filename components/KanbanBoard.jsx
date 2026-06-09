"use client";

import { useState, useMemo } from "react";
import UploadCoverDialog from "./UploadCoverDialog";
import EditTaskDialog from "./EditTaskDialog";
import ImageCarousel from "./ImageCarousel";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Clock,
  MessageSquare,
  Paperclip,
  AlertCircle,
  Calendar,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Task status columns configuration
const COLUMNS = [
  { id: "NEW", title: "New", color: "bg-slate-500" },
  { id: "IN_PROGRESS", title: "In Progress", color: "bg-blue-500" },
  { id: "BLOCKED", title: "Blocked", color: "bg-red-500" },
  { id: "DONE", title: "Done", color: "bg-green-500" },
];

// Priority colors
const PRIORITY_COLORS = {
  LOW: "bg-gray-500",
  MEDIUM: "bg-yellow-500",
  HIGH: "bg-orange-500",
  CRITICAL: "bg-red-600",
};

// Priority icons
const PRIORITY_LABELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

// Task Card Component
function TaskCard({ task, isDragging, onEdit, onDelete, onChangeCover, canManageTasks, userId }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id, disabled: !canManageTasks });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Render priority stars
  const renderPriorityStars = () => {
    const starCount = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      CRITICAL: 3,
    }[task.priority] || 1;

    return (
      <div className="flex gap-0.5">
        {[...Array(starCount)].map((_, i) => (
          <span key={i} className="text-yellow-500 text-sm">★</span>
        ))}
      </div>
    );
  };

  const handleCardClick = (e) => {
    // Don't trigger if clicking on drag handle
    if (e.target.closest('[data-drag-handle]')) return;
    onEdit?.(task);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "mb-3",
        isDragging && "opacity-50"
      )}
    >
      <Card className="border-border/40 hover:border-border transition-all hover:shadow-md group relative">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          data-drag-handle
          className="absolute top-2 right-2 p-1 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity bg-muted/80 hover:bg-muted z-10"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-muted-foreground">
            <circle cx="4" cy="4" r="1.5"/>
            <circle cx="4" cy="8" r="1.5"/>
            <circle cx="4" cy="12" r="1.5"/>
            <circle cx="12" cy="4" r="1.5"/>
            <circle cx="12" cy="8" r="1.5"/>
            <circle cx="12" cy="12" r="1.5"/>
          </svg>
        </div>

        <CardContent className="p-4 cursor-pointer" onClick={handleCardClick}>
          {/* Image Carousel or Cover Image */}
          {task.images && task.images.length > 0 ? (
            <div className="mb-3 -mx-4 -mt-4 h-32 overflow-hidden rounded-t-lg">
              <ImageCarousel images={task.images} />
            </div>
          ) : task.coverUrl ? (
            <div className="mb-3 -mx-4 -mt-4 h-32 overflow-hidden rounded-t-lg relative group/cover">
              <img
                src={task.coverUrl}
                alt={task.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeCover?.(task);
                }}
                className="absolute top-2 right-2 p-1.5 rounded bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover/cover:opacity-100 transition-opacity"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </button>
            </div>
          ) : null}

          {/* Header: Priority Badge and Stars */}
          <div className="flex items-start justify-between mb-2">
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                task.priority === "CRITICAL" && "bg-red-500/10 text-red-600 border-red-500/20",
                task.priority === "HIGH" && "bg-orange-500/10 text-orange-600 border-orange-500/20",
                task.priority === "MEDIUM" && "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
                task.priority === "LOW" && "bg-gray-500/10 text-gray-600 border-gray-500/20"
              )}
            >
              {PRIORITY_LABELS[task.priority]}
            </Badge>
            {renderPriorityStars()}
          </div>

          {/* Project Name */}
          {task.project && (
            <p className="text-xs font-semibold text-foreground mb-1">
              Project: {task.project.name}
            </p>
          )}

          {/* Task Title */}
          <h4 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {task.title}
          </h4>

          {/* Description Preview */}
          {task.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Deadline and Time Tracking */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            {task.deadline && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(task.deadline)}</span>
              </div>
            )}
            {(task.estimateHours || task.loggedHours) && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  {task.loggedHours || 0}h / {task.estimateHours || 0}h
                </span>
              </div>
            )}
          </div>

          {/* Metadata: Comments, Attachments */}
          {(task._count?.comments > 0 || task._count?.attachments > 0) && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
              {task._count?.comments > 0 && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>{task._count.comments}</span>
                </div>
              )}
              {task._count?.attachments > 0 && (
                <div className="flex items-center gap-1">
                  <Paperclip className="h-3 w-3" />
                  <span>{task._count.attachments}</span>
                </div>
              )}
            </div>
          )}

          {/* Footer: Assignee */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
            {task.assignee && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={task.assignee.avatarUrl || task.assignee.image}
                    alt={task.assignee.name}
                  />
                  <AvatarFallback className="text-xs">
                    {getInitials(task.assignee.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">{task.assignee.name}</span>
              </div>
            )}
            
            {/* Action buttons - visible on hover, only for managers or task owners */}
            {(canManageTasks || task.assigneeId === userId) && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(task);
                  }}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                  title="Edit"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                {canManageTasks && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(task);
                    }}
                    className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-600"
                    title="Delete"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Column Component
function KanbanColumn({ column, tasks, activeId, onEdit, onDelete, onChangeCover, canManageTasks, userId }) {
  const taskIds = useMemo(() => tasks.map((task) => task.id), [tasks]);
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div className="flex-1 min-w-[280px] max-w-[350px]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded-full", column.color)} />
          <h3 className="font-semibold text-sm">{column.title}</h3>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
      </div>

      <div ref={setNodeRef} className="bg-muted/30 rounded-lg p-3 min-h-[500px]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isDragging={activeId === task.id}
              onEdit={onEdit}
              onDelete={onDelete}
              onChangeCover={onChangeCover}
              canManageTasks={canManageTasks}
              userId={userId}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No tasks</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Main Kanban Board Component
export default function KanbanBoard({ tasks: initialTasks, onTaskUpdate, canManageTasks = true, userId, userRole, projectMembers = [], projectManager = null }) {
  const [tasks, setTasks] = useState(initialTasks || []);
  const [activeId, setActiveId] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedTaskForCover, setSelectedTaskForCover] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped = {};
    COLUMNS.forEach((col) => {
      grouped[col.id] = tasks.filter((task) => task.status === col.id);
    });
    return grouped;
  }, [tasks]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeTask = tasks.find((t) => t.id === active.id);
    const overTask = tasks.find((t) => t.id === over.id);

    if (!activeTask) {
      setActiveId(null);
      return;
    }

    // Determine the new status
    let newStatus = activeTask.status;
    let newOrderIndex = activeTask.orderIndex || 0;

    if (overTask) {
      // Dropped on another task
      newStatus = overTask.status;
      const tasksInColumn = tasksByStatus[newStatus];
      const overIndex = tasksInColumn.findIndex((t) => t.id === over.id);
      newOrderIndex = overIndex;
    } else {
      // Dropped on a column (check if over.id is a column id)
      const column = COLUMNS.find((col) => col.id === over.id);
      if (column) {
        newStatus = column.id;
        newOrderIndex = tasksByStatus[newStatus].length;
      }
    }

    // Update locally first for immediate feedback
    const updatedTasks = tasks.map((task) => {
      if (task.id === active.id) {
        return { ...task, status: newStatus, orderIndex: newOrderIndex };
      }
      return task;
    });
    setTasks(updatedTasks);

    // Call API to update on server
    try {
      const response = await fetch("/api/tasks/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: active.id,
          newStatus,
          newOrderIndex,
          projectId: activeTask.projectId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
        if (onTaskUpdate) {
          onTaskUpdate(data.tasks);
        }
      } else {
        // Revert on error
        setTasks(tasks);
        console.error("Failed to reorder task");
      }
    } catch (error) {
      // Revert on error
      setTasks(tasks);
      console.error("Error reordering task:", error);
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  const handleEdit = (task) => {
    setSelectedTaskForEdit(task);
    setEditDialogOpen(true);
  };

  const handleTaskUpdated = (updatedTask) => {
    // Update task in local state
    const updatedTasks = tasks.map((t) =>
      t.id === updatedTask.id ? updatedTask : t
    );
    setTasks(updatedTasks);
    if (onTaskUpdate) {
      onTaskUpdate(updatedTasks);
    }
  };

  const handleDelete = async (task) => {
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) return;
    
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove task from local state
        const updatedTasks = tasks.filter((t) => t.id !== task.id);
        setTasks(updatedTasks);
        if (onTaskUpdate) {
          onTaskUpdate(updatedTasks);
        }
      } else {
        alert("Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Error deleting task");
    }
  };

  const handleChangeCover = (task) => {
    setSelectedTaskForCover(task);
    setUploadDialogOpen(true);
  };

  const handleCoverUpload = async (newCoverUrl) => {
    if (!selectedTaskForCover) return;
    
    try {
      // Update task cover
      const response = await fetch(`/api/tasks/${selectedTaskForCover.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coverUrl: newCoverUrl,
        }),
      });

      if (response.ok) {
        // Update local state
        const updatedTasks = tasks.map((t) =>
          t.id === selectedTaskForCover.id ? { ...t, coverUrl: newCoverUrl } : t
        );
        setTasks(updatedTasks);
        if (onTaskUpdate) {
          onTaskUpdate(updatedTasks);
        }
      } else {
        alert("Failed to update cover image");
      }
    } catch (error) {
      console.error("Error updating cover:", error);
      alert("Failed to update cover image");
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasksByStatus[column.id] || []}
            activeId={activeId}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onChangeCover={handleChangeCover}
            canManageTasks={canManageTasks}
            userId={userId}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
      </DragOverlay>

      {/* Upload Cover Dialog */}
      <UploadCoverDialog
        isOpen={uploadDialogOpen}
        onClose={() => {
          setUploadDialogOpen(false);
          setSelectedTaskForCover(null);
        }}
        onUpload={handleCoverUpload}
        currentCoverUrl={selectedTaskForCover?.coverUrl}
      />

      {/* Edit Task Dialog */}
      <EditTaskDialog
        isOpen={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedTaskForEdit(null);
        }}
        task={selectedTaskForEdit}
        onTaskUpdated={handleTaskUpdated}
        canManageTasks={canManageTasks}
        userId={userId}
        userRole={userRole}
        projectMembers={projectMembers}
        projectManager={projectManager}
      />
    </DndContext>
  );
}
