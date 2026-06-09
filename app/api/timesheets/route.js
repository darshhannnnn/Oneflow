import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

/**
 * GET /api/timesheets
 * Get timesheets (filtered by user or task)
 */
export async function GET(req) {
  const authResult = await requirePermission(req, 'timesheets', 'read');
  
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  
  const { user } = authResult;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const taskId = searchParams.get('taskId');
  const projectId = searchParams.get('projectId');
  
  try {
    let whereClause = {};
    
    // Team members can only see their own timesheets
    if (user.role === 'TEAM_MEMBER') {
      whereClause.userId = user.id;
    } else if (userId) {
      whereClause.userId = userId;
    }
    
    if (taskId) {
      whereClause.taskId = taskId;
    }
    
    if (projectId) {
      whereClause.task = {
        projectId: projectId,
      };
    }
    
    const timesheets = await prisma.timesheet.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
    
    return NextResponse.json(timesheets);
  } catch (error) {
    console.error('Error fetching timesheets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timesheets' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/timesheets
 * Create a new timesheet entry
 */
export async function POST(req) {
  const authResult = await requirePermission(req, 'timesheets', 'create');
  
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  
  const { user } = authResult;
  
  try {
    const body = await req.json();
    const {
      taskId,
      date,
      hours,
      billable,
    } = body;
    
    console.log('Timesheet create - billable value:', billable, 'type:', typeof billable);
    
    // Validate required fields
    if (!taskId || !date || !hours) {
      return NextResponse.json(
        { error: 'Task, date, and hours are required' },
        { status: 400 }
      );
    }
    
    // Validate hours
    if (hours <= 0 || hours > 24) {
      return NextResponse.json(
        { error: 'Hours must be between 0 and 24' },
        { status: 400 }
      );
    }
    
    // Check if task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            members: {
              where: { userId: user.id, isActive: true },
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
    
    // Team members can only log hours on tasks they're assigned to or projects they're members of
    if (user.role === 'TEAM_MEMBER') {
      const isMember = task.project.members.length > 0;
      const isAssignee = task.assigneeId === user.id;
      
      if (!isMember && !isAssignee) {
        return NextResponse.json(
          { error: 'You can only log hours on tasks you are assigned to or projects you are a member of' },
          { status: 403 }
        );
      }
    }
    
    // Convert billable to boolean properly
    let isBillableValue = true; // Default to billable
    if (billable !== undefined && billable !== null) {
      // Handle string "false" or "true"
      if (typeof billable === 'string') {
        isBillableValue = billable.toLowerCase() === 'true';
      } else {
        isBillableValue = Boolean(billable);
      }
    }
    
    console.log('Final isBillable value:', isBillableValue);
    
    const timesheet = await prisma.timesheet.create({
      data: {
        userId: user.id,
        taskId,
        date: new Date(date),
        hours: parseFloat(hours),
        isBillable: isBillableValue,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
    
    // Update task logged hours
    await prisma.task.update({
      where: { id: taskId },
      data: {
        loggedHours: {
          increment: parseFloat(hours),
        },
      },
    });
    
    return NextResponse.json(timesheet, { status: 201 });
  } catch (error) {
    console.error('Error creating timesheet:', error);
    return NextResponse.json(
      { error: 'Failed to create timesheet' },
      { status: 500 }
    );
  }
}
