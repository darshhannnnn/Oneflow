import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";

/**
 * GET /api/tasks/[id]/comments
 * Get comments for a task (filtered by role)
 */
export async function GET(req, context) {
  const authResult = await requireAuth(req);
  
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  
  const { user } = authResult;
  const params = await context.params;
  const { id: taskId } = params;
  
  try {
    // Fetch the task with project info
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            managerId: true,
            members: {
              where: { isActive: true },
              select: { userId: true },
            },
          },
        },
      },
    });
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    // Check if user has access to this task
    const isProjectManager = task.project.managerId === user.id;
    const isProjectMember = task.project.members.some(m => m.userId === user.id);
    const isTaskAssignee = task.assigneeId === user.id;
    const isAdmin = user.role === 'ADMIN';
    
    if (!isAdmin && !isProjectManager && !isProjectMember && !isTaskAssignee) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this task' },
        { status: 403 }
      );
    }
    
    // Fetch comments with filtering
    let whereClause = { taskId };
    
    // TEAM_MEMBER: Can only see own comments + manager's comments
    if (user.role === 'TEAM_MEMBER') {
      whereClause.OR = [
        { authorId: user.id }, // Own comments
        { authorId: task.project.managerId }, // Manager's comments
      ];
    }
    // PROJECT_MANAGER, ADMIN: Can see all comments
    
    const comments = await prisma.taskComment.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks/[id]/comments
 * Add a comment to a task
 */
export async function POST(req, context) {
  const authResult = await requireAuth(req);
  
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  
  const { user } = authResult;
  const params = await context.params;
  const { id: taskId } = params;
  
  try {
    const body = await req.json();
    const { content } = body;
    
    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }
    
    // Fetch the task to verify access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            managerId: true,
            members: {
              where: { isActive: true },
              select: { userId: true },
            },
          },
        },
      },
    });
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    // Check if user has access to this task
    const isProjectManager = task.project.managerId === user.id;
    const isProjectMember = task.project.members.some(m => m.userId === user.id);
    const isTaskAssignee = task.assigneeId === user.id;
    const isAdmin = user.role === 'ADMIN';
    
    if (!isAdmin && !isProjectManager && !isProjectMember && !isTaskAssignee) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this task' },
        { status: 403 }
      );
    }
    
    // Create the comment
    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        authorId: user.id,
        content: content.trim(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });
    
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/[id]/comments/[commentId]
 * Delete a comment (only own comments)
 */
export async function DELETE(req, context) {
  const authResult = await requireAuth(req);
  
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  
  const { user } = authResult;
  const params = await context.params;
  const { searchParams } = new URL(req.url);
  const commentId = searchParams.get('commentId');
  
  if (!commentId) {
    return NextResponse.json(
      { error: 'Comment ID is required' },
      { status: 400 }
    );
  }
  
  try {
    // Fetch the comment
    const comment = await prisma.taskComment.findUnique({
      where: { id: commentId },
      include: {
        task: {
          include: {
            project: {
              select: {
                managerId: true,
              },
            },
          },
        },
      },
    });
    
    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }
    
    // Only the author, project manager, or admin can delete a comment
    const isAuthor = comment.authorId === user.id;
    const isProjectManager = comment.task.project.managerId === user.id;
    const isAdmin = user.role === 'ADMIN';
    
    if (!isAuthor && !isProjectManager && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - You can only delete your own comments' },
        { status: 403 }
      );
    }
    
    // Delete the comment
    await prisma.taskComment.delete({
      where: { id: commentId },
    });
    
    return NextResponse.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
