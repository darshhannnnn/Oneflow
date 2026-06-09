import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

/**
 * GET /api/tasks/[id]
 * Get a single task by ID
 */
export async function GET(req, context) {
  const authResult = await requirePermission(req, 'tasks', 'read');
  
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  
  const params = await context.params;
  const { id } = params;
  
  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
            managerId: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        attachments: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        timesheets: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            date: 'desc',
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
    
    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tasks/[id]
 * Update a task
 */
export async function PATCH(req, context) {
  const authResult = await requirePermission(req, 'tasks', 'update');
  
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  
  const { user } = authResult;
  const params = await context.params;
  const { id } = params;
  
  try {
    const body = await req.json();
    const {
      title,
      description,
      assigneeId,
      status,
      priority,
      deadline,
      estimateHours,
      loggedHours,
      orderIndex,
      coverUrl,
      images,
    } = body;
    
    // Get the task to check permissions
    const existingTask = await prisma.task.findUnique({
      where: { id },
      select: {
        assigneeId: true,
        projectId: true,
        project: {
          select: {
            managerId: true,
          },
        },
      },
    });
    
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    // Check if user has permission to update this task
    const isAdmin = user.role === 'ADMIN';
    const isProjectManager = user.role === 'PROJECT_MANAGER' && existingTask.project.managerId === user.id;
    const isTaskAssignee = existingTask.assigneeId === user.id;
    const isTeamMember = user.role === 'TEAM_MEMBER';
    
    // Team members can only update tasks assigned to them
    if (isTeamMember && !isTaskAssignee) {
      return NextResponse.json(
        { error: 'You can only update tasks assigned to you' },
        { status: 403 }
      );
    }
    
    // Prepare update data
    const updateData = {};
    
    // Team members can ONLY update status and loggedHours, nothing else
    if (isTeamMember) {
      // Check if trying to update restricted fields (must check if they exist in body)
      const restrictedFields = ['title', 'description', 'assigneeId', 'priority', 'deadline', 'estimateHours', 'coverUrl', 'images', 'orderIndex'];
      const hasRestrictedField = restrictedFields.some(field => body.hasOwnProperty(field));
      
      if (hasRestrictedField) {
        return NextResponse.json(
          { error: 'Team members can only update task status and logged hours' },
          { status: 403 }
        );
      }
      
      // Allow only status and loggedHours
      if (status !== undefined) updateData.status = status;
      if (loggedHours !== undefined) updateData.loggedHours = parseFloat(loggedHours);
    } else if (isAdmin || isProjectManager) {
      // Admins and project managers can update all fields
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
      if (status !== undefined) updateData.status = status;
      if (priority !== undefined) updateData.priority = priority;
      if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
      if (estimateHours !== undefined) updateData.estimateHours = estimateHours ? parseFloat(estimateHours) : null;
      if (loggedHours !== undefined) updateData.loggedHours = parseFloat(loggedHours);
      if (orderIndex !== undefined) updateData.orderIndex = parseInt(orderIndex);
      if (coverUrl !== undefined) updateData.coverUrl = coverUrl;
      if (images !== undefined) updateData.images = images;
    } else {
      return NextResponse.json(
        { error: 'Insufficient permissions to update this task' },
        { status: 403 }
      );
    }
    
    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
            timesheets: true,
          },
        },
      },
    });
    
    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/[id]
 * Delete a task
 */
export async function DELETE(req, context) {
  const authResult = await requirePermission(req, 'tasks', 'delete');
  
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  
  const params = await context.params;
  const { id } = params;
  
  try {
    await prisma.task.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
