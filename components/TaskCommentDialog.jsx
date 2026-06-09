"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Send,
  MessageSquare,
  Clock,
  User,
  AlertCircle,
  Trash2,
  Shield,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TaskCommentDialog({ isOpen, onClose, task, userId, userRole }) {
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && task) {
      fetchComments();
    }
  }, [isOpen, task]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tasks/${task.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      } else {
        console.error("Failed to fetch comments");
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      
      const response = await fetch(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (response.ok) {
        const comment = await response.json();
        setComments((prev) => [comment, ...prev]);
        setNewComment("");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      setError("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${task.id}/comments?commentId=${commentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment");
    }
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
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const isTeamMember = userRole === "TEAM_MEMBER";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl">{task?.title}</DialogTitle>
              <DialogDescription className="mt-2">
                {isTeamMember ? (
                  <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <Eye className="h-4 w-4" />
                    You can add comments visible to your manager
                  </span>
                ) : (
                  "View and manage task comments"
                )}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <MessageSquare className="h-3 w-3" />
                {comments.length} {comments.length === 1 ? "comment" : "comments"}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Task Details Summary */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Task Details (Read-Only)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="outline" className="ml-2">{task?.status}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Priority:</span>
                <Badge variant="outline" className="ml-2">{task?.priority}</Badge>
              </div>
            </div>
            {task?.assignee && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Assigned to:</span>
                <span className="font-medium">{task.assignee.name}</span>
              </div>
            )}
            {task?.description && (
              <div className="pt-2 border-t border-border/40">
                <p className="text-muted-foreground">{task.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Add Comment Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Textarea
              placeholder={
                isTeamMember
                  ? "Add a comment for your manager about this task..."
                  : "Add a comment..."
              }
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value);
                setError("");
              }}
              className="min-h-[100px] resize-none"
              disabled={submitting}
            />
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {isTeamMember && (
                <>
                  <Shield className="h-3 w-3" />
                  Only you and your manager can see your comments
                </>
              )}
            </p>
            <Button type="submit" disabled={submitting || !newComment.trim()} className="gap-2">
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Add Comment
            </Button>
          </div>
        </form>

        <Separator />

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Comments ({comments.length})
          </h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No comments yet</p>
              <p className="text-sm text-muted-foreground/70">
                Be the first to add a comment
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => {
                const isOwnComment = comment.authorId === userId;
                const isManager = comment.author.role === "PROJECT_MANAGER" || comment.author.role === "ADMIN";
                
                return (
                  <Card
                    key={comment.id}
                    className={cn(
                      "border-border/40",
                      isOwnComment && "bg-primary/5 border-primary/20"
                    )}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.author.avatarUrl} alt={comment.author.name} />
                          <AvatarFallback className="text-xs">
                            {getInitials(comment.author.name)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">
                                {comment.author.name}
                              </span>
                              {isManager && (
                                <Badge variant="secondary" className="text-xs gap-1">
                                  <Shield className="h-3 w-3" />
                                  Manager
                                </Badge>
                              )}
                              {isOwnComment && (
                                <Badge variant="outline" className="text-xs">
                                  You
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(comment.createdAt)}
                              </span>
                              {isOwnComment && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleDeleteComment(comment.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
