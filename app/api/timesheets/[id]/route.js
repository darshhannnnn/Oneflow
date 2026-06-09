import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

/**
 * GET /api/timesheets/[id]
 * Get a single timesheet by ID
 */
export async function GET(req, context) {
  const authResult = await requirePermission(req, 'timesheets', 'read');
  
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
    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
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
    
    if (!timesheet) {
      return NextResponse.json(
        { error: 'Timesheet not found' },
        { status: 404 }
      );
    }
    
    // Team members can only view their own timesheets
    if (user.role === 'TEAM_MEMBER' && timesheet.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only view your own timesheets' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(timesheet);
  } catch (error) {
    console.error('Error fetching timesheet:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timesheet' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/timesheets/[id]
 * Update a timesheet
 */
export async function PATCH(req, context) {
  const authResult = await requirePermission(req, 'timesheets', 'update');
  
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
    // Check if timesheet exists
    const existingTimesheet = await prisma.timesheet.findUnique({
      where: { id },
    });
    
    if (!existingTimesheet) {
      return NextResponse.json(
        { error: 'Timesheet not found' },
        { status: 404 }
      );
    }
    
    // Team members can only update their own timesheets
    if (user.role === 'TEAM_MEMBER' && existingTimesheet.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only update your own timesheets' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const {
      date,
      hours,
      billable,
    } = body;
    
    // Validate hours if provided
    if (hours !== undefined && (hours <= 0 || hours > 24)) {
      return NextResponse.json(
        { error: 'Hours must be between 0 and 24' },
        { status: 400 }
      );
    }
    
    // Prepare update data
    const updateData = {};
    if (date !== undefined) updateData.date = new Date(date);
    if (hours !== undefined) updateData.hours = parseFloat(hours);
    if (billable !== undefined) updateData.isBillable = Boolean(billable);
    
    // If hours changed, update task logged hours
    if (hours !== undefined && hours !== existingTimesheet.hours) {
      const hoursDiff = parseFloat(hours) - parseFloat(existingTimesheet.hours);
      await prisma.task.update({
        where: { id: existingTimesheet.taskId },
        data: {
          loggedHours: {
            increment: hoursDiff,
          },
        },
      });
    }
    
    const timesheet = await prisma.timesheet.update({
      where: { id },
      data: updateData,
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
    
    return NextResponse.json(timesheet);
  } catch (error) {
    console.error('Error updating timesheet:', error);
    return NextResponse.json(
      { error: 'Failed to update timesheet' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/timesheets/[id]
 * Delete a timesheet
 */
export async function DELETE(req, context) {
  const authResult = await requirePermission(req, 'timesheets', 'delete');
  
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
    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
    });
    
    if (!timesheet) {
      return NextResponse.json(
        { error: 'Timesheet not found' },
        { status: 404 }
      );
    }
    
    // Team members can only delete their own timesheets
    if (user.role === 'TEAM_MEMBER' && timesheet.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only delete your own timesheets' },
        { status: 403 }
      );
    }
    
    // Update task logged hours
    await prisma.task.update({
      where: { id: timesheet.taskId },
      data: {
        loggedHours: {
          decrement: parseFloat(timesheet.hours),
        },
      },
    });
    
    await prisma.timesheet.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: 'Timesheet deleted successfully' });
  } catch (error) {
    console.error('Error deleting timesheet:', error);
    return NextResponse.json(
      { error: 'Failed to delete timesheet' },
      { status: 500 }
    );
  }
}
