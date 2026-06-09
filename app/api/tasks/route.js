import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

/**
 * GET /api/tasks
 * Get all tasks (filtered by project or user)
 */
export async function GET(req) {
  const authResult = await requirePermission(req, 'tasks', 'read');
  
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  
  const { user } = authResult;
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const myTasks = searchParams.get('myTasks') === 'true';
  
  try {
    let whereClause = {};
    
    if (projectId) {
      whereClause.projectId = projectId;
    }
    
    // Filter based on role if no specific project
    if (!projectId && user.role === 'TEAM_MEMBER') {
      if (myTasks) {
        // Show only assigned tasks
        whereClause.assigneeId = user.id;
      } else {
        // Show tasks from projects they're members of OR tasks assigned to them
        const userProjects = await prisma.project.findMany({
          where: {
            members: {
              some: {
                userId: user.id,
                isActive: true,
              },
            },
          },
          select: { id: true },
        });
        
        const projectIds = userProjects.map(p => p.id);
        
        // Use OR condition: either in their projects OR assigned to them
        if (projectIds.length > 0) {
          whereClause.OR = [
            { projectId: { in: projectIds } },
            { assigneeId: user.id },
          ];
        } else {
          // If no projects, just show tasks assigned to them
          whereClause.assigneeId = user.id;
        }
      }
    } else if (myTasks) {
      // For other roles, myTasks means assigned to them
      whereClause.assigneeId = user.id;
    }
    
    // For PROJECT_MANAGER: only show tasks from projects they manage or are members of
    if (!projectId && user.role === 'PROJECT_MANAGER') {
      // Get all projects where user is manager or active member
      const userProjects = await prisma.project.findMany({
        where: {
          OR: [
            { managerId: user.id },
            {
              members: {
                some: {
                  userId: user.id,
                  isActive: true,
                },
              },
            },
          ],
        },
        select: { id: true },
      });
      
      const projectIds = userProjects.map(p => p.id);
      
      if (projectIds.length > 0) {
        whereClause.projectId = { in: projectIds };
      } else {
        // If no projects found, return empty array
        return NextResponse.json([]);
      }
    }
    
    const tasks = await prisma.task.findMany({
      where: whereClause,
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
      orderBy: [
        { status: 'asc' },
        { orderIndex: 'asc' },
        { createdAt: 'desc' },
      ],
    });
    
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks
 * Create a new task
 */
export async function POST(req) {
  const authResult = await requirePermission(req, 'tasks', 'create');
  
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  
  try {
    const body = await req.json();
    const {
      projectId,
      title,
      description,
      assigneeId,
      status,
      priority,
      deadline,
      estimateHours,
      coverUrl,
      images,
    } = body;
    
    // Validate required fields
    if (!projectId || !title) {
      return NextResponse.json(
        { error: 'Project ID and title are required' },
        { status: 400 }
      );
    }
    
    // Get the max orderIndex for this project and status
    const maxOrderTask = await prisma.task.findFirst({
      where: {
        projectId,
        status: status || 'NEW',
      },
      orderBy: {
        orderIndex: 'desc',
      },
      select: {
        orderIndex: true,
      },
    });
    
    const orderIndex = maxOrderTask ? (maxOrderTask.orderIndex || 0) + 1 : 0;
    
    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        description,
        assigneeId,
        status: status || 'NEW',
        priority: priority || 'MEDIUM',
        deadline: deadline ? new Date(deadline) : null,
        estimateHours: estimateHours ? parseFloat(estimateHours) : null,
        coverUrl,
        images: images || [],
        orderIndex,
      },
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
    
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
