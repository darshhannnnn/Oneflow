import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission, canManageProject } from "@/lib/rbac";

/**
 * GET /api/projects/[id]
 * Get a single project by ID
 */
export async function GET(req, context) {
  const authResult = await requirePermission(req, 'projects', 'read');
  
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
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
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
                role: true,
              },
            },
          },
        },
        tasks: {
          include: {
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
          orderBy: {
            orderIndex: 'asc',
          },
        },
        salesOrders: {
          include: {
            partner: true,
          },
        },
        purchaseOrders: {
          include: {
            partner: true,
          },
        },
        customerInvoices: {
          include: {
            partner: true,
          },
        },
        vendorBills: {
          include: {
            partner: true,
          },
        },
        expenses: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Check access permissions
    // Project managers may view projects they manage; additionally allow
    // access if they are an active member of the project. Team members
    // can view projects only if they are assigned to them.
    if (user.role === 'PROJECT_MANAGER') {
      const isManager = project.managerId === user.id;
      const isMember = project.members.some(m => m.userId === user.id && m.isActive);
      if (!isManager && !isMember) {
        return NextResponse.json(
          { error: 'Forbidden - You can only view projects you manage or are assigned to' },
          { status: 403 }
        );
      }
    }

    if (user.role === 'TEAM_MEMBER') {
      const isMember = project.members.some(m => m.userId === user.id && m.isActive);
      if (!isMember) {
        return NextResponse.json(
          { error: 'Forbidden - You can only view projects you are assigned to' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/projects/[id]
 * Update a project
 */
export async function PATCH(req, context) {
  const authResult = await requirePermission(req, 'projects', 'update');
  
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
    // Check if user can manage this project
    if (user.role === 'PROJECT_MANAGER') {
      const canManage = await canManageProject(user.id, id, prisma);
      if (!canManage) {
        return NextResponse.json(
          { error: 'Forbidden - You can only update projects you manage' },
          { status: 403 }
        );
      }
    }
    
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
      totalRevenue,
      totalCost,
      progressPct,
      memberIds,
    } = body;
    
    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (managerId !== undefined) updateData.managerId = managerId;
    if (status !== undefined) updateData.status = status;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (budget !== undefined) updateData.budget = budget ? parseFloat(budget) : null;
    if (totalRevenue !== undefined) updateData.totalRevenue = parseFloat(totalRevenue);
    if (totalCost !== undefined) updateData.totalCost = parseFloat(totalCost);
    if (progressPct !== undefined) updateData.progressPct = parseInt(progressPct);
    
    // Handle member updates separately
    if (memberIds !== undefined) {
      // Get current members
      const currentMembers = await prisma.projectMember.findMany({
        where: { projectId: id },
        select: { userId: true },
      });
      
      const currentMemberIds = currentMembers.map(m => m.userId);
      const newMemberIds = memberIds || [];
      
      // Find members to add and remove
      const toAdd = newMemberIds.filter(userId => !currentMemberIds.includes(userId));
      const toRemove = currentMemberIds.filter(userId => !newMemberIds.includes(userId));
      
      // Add new members
      if (toAdd.length > 0) {
        await prisma.projectMember.createMany({
          data: toAdd.map(userId => ({
            projectId: id,
            userId,
            isActive: true,
          })),
          skipDuplicates: true,
        });
      }
      
      // Remove members
      if (toRemove.length > 0) {
        await prisma.projectMember.deleteMany({
          where: {
            projectId: id,
            userId: { in: toRemove },
          },
        });
      }
    }
    
    // Update project
    const project = await prisma.project.update({
      where: { id },
      data: updateData,
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
      },
    });
    
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete a project
 */
export async function DELETE(req, context) {
  const authResult = await requirePermission(req, 'projects', 'delete');
  
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
    // Check if user can manage this project
    if (user.role === 'PROJECT_MANAGER') {
      const canManage = await canManageProject(user.id, id, prisma);
      if (!canManage) {
        return NextResponse.json(
          { error: 'Forbidden - You can only delete projects you manage' },
          { status: 403 }
        );
      }
    }
    
    await prisma.project.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
