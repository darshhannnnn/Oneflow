import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

/**
 * GET /api/projects
 * Get all projects (filtered by role)
 */
export async function GET(req) {
  const authResult = await requirePermission(req, 'projects', 'read');
  
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  
  const { user } = authResult;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit')) || 50; // Default limit
  const page = parseInt(searchParams.get('page')) || 1;
  const skip = (page - 1) * limit;
  
  try {
    let whereClause = {};
    
    // Filter based on role
    if (user.role === 'PROJECT_MANAGER') {
      // Project managers see projects they manage OR are active members of
      whereClause.OR = [
        { managerId: user.id },
        {
          members: {
            some: {
              userId: user.id,
              isActive: true,
            },
          },
        },
      ];
    } else if (user.role === 'TEAM_MEMBER') {
      // Team members see projects they're members of OR have tasks assigned in
      whereClause.OR = [
        {
          members: {
            some: {
              userId: user.id,
              isActive: true,
            },
          },
        },
        {
          tasks: {
            some: {
              assigneeId: user.id,
            },
          },
        },
      ];
    }
    // ADMIN, SALES, FINANCE see all projects
    
    // Add status filter if provided
    if (status && status !== 'all') {
      whereClause.status = status.toUpperCase();
    }
    
    const projects = await prisma.project.findMany({
      where: whereClause,
      take: limit,
      skip: skip,
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
            priority: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            salesOrders: true,
            customerInvoices: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    
    // Calculate project statistics
    const projectsWithStats = projects.map(project => {
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter(t => t.status === 'DONE').length;
      const inProgressTasks = project.tasks.filter(t => t.status === 'IN_PROGRESS').length;
      const blockedTasks = project.tasks.filter(t => t.status === 'BLOCKED').length;
      
      return {
        ...project,
        stats: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          blockedTasks,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        },
      };
    });
    
    return NextResponse.json(projectsWithStats);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(req) {
  const authResult = await requirePermission(req, 'projects', 'create');
  
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
      name,
      code,
      description,
      managerId,
      status,
      startDate,
      endDate,
      budget,
      memberIds,
    } = body;
    
    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }
    
    // Set manager: if not provided, use current user (for PROJECT_MANAGER role)
    const projectManagerId = managerId || (user.role === 'PROJECT_MANAGER' ? user.id : null);
    
    // Create project with members
    const project = await prisma.project.create({
      data: {
        name,
        code,
        description,
        managerId: projectManagerId,
        status: status || 'PLANNED',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: budget ? parseFloat(budget) : null,
        members: memberIds && memberIds.length > 0 ? {
          create: memberIds.map(userId => ({
            userId,
            isActive: true,
          })),
        } : undefined,
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
    
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
