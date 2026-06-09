import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

/**
 * POST /api/tasks/reorder
 * Reorder tasks when dragging between columns or within a column
 */
export async function POST(req) {
  const authResult = await requirePermission(req, 'tasks', 'update');
  
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  
  try {
    const body = await req.json();
    const { taskId, newStatus, newOrderIndex, projectId } = body;
    
    if (!taskId || !newStatus || newOrderIndex === undefined) {
      return NextResponse.json(
        { error: 'Task ID, new status, and new order index are required' },
        { status: 400 }
      );
    }
    
    // Get the task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { status: true, orderIndex: true, projectId: true },
    });
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    const oldStatus = task.status;
    const oldOrderIndex = task.orderIndex || 0;
    
    // If moving to a different status column
    if (oldStatus !== newStatus) {
      // Update order indices in the old column (shift down)
      await prisma.task.updateMany({
        where: {
          projectId: task.projectId,
          status: oldStatus,
          orderIndex: {
            gt: oldOrderIndex,
          },
        },
        data: {
          orderIndex: {
            decrement: 1,
          },
        },
      });
      
      // Update order indices in the new column (shift up to make space)
      await prisma.task.updateMany({
        where: {
          projectId: task.projectId,
          status: newStatus,
          orderIndex: {
            gte: newOrderIndex,
          },
        },
        data: {
          orderIndex: {
            increment: 1,
          },
        },
      });
      
      // Update the task itself
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: newStatus,
          orderIndex: newOrderIndex,
        },
      });
    } else {
      // Moving within the same column
      if (newOrderIndex > oldOrderIndex) {
        // Moving down: decrement indices between old and new position
        await prisma.task.updateMany({
          where: {
            projectId: task.projectId,
            status: oldStatus,
            orderIndex: {
              gt: oldOrderIndex,
              lte: newOrderIndex,
            },
          },
          data: {
            orderIndex: {
              decrement: 1,
            },
          },
        });
      } else if (newOrderIndex < oldOrderIndex) {
        // Moving up: increment indices between new and old position
        await prisma.task.updateMany({
          where: {
            projectId: task.projectId,
            status: oldStatus,
            orderIndex: {
              gte: newOrderIndex,
              lt: oldOrderIndex,
            },
          },
          data: {
            orderIndex: {
              increment: 1,
            },
          },
        });
      }
      
      // Update the task itself
      await prisma.task.update({
        where: { id: taskId },
        data: {
          orderIndex: newOrderIndex,
        },
      });
    }
    
    // Fetch updated tasks for the project
    const updatedTasks = await prisma.task.findMany({
      where: {
        projectId: task.projectId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { orderIndex: 'asc' },
      ],
    });
    
    return NextResponse.json({ tasks: updatedTasks });
  } catch (error) {
    console.error('Error reordering tasks:', error);
    return NextResponse.json(
      { error: 'Failed to reorder tasks' },
      { status: 500 }
    );
  }
}
