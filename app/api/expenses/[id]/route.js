import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

/**
 * GET /api/expenses/[id]
 * Get a single expense by ID
 */
export async function GET(req, context) {
  const authResult = await requirePermission(req, 'expenses', 'read');
  
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
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
            managerId: true,
          },
        },
      },
    });
    
    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }
    
    // Team members can only view their own expenses
    if (user.role === 'TEAM_MEMBER' && expense.createdById !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only view your own expenses' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expense' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/expenses/[id]
 * Update an expense
 */
export async function PATCH(req, context) {
  const authResult = await requirePermission(req, 'expenses', 'update');
  
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
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            managerId: true,
          },
        },
      },
    });
    
    if (!existingExpense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }
    
    const body = await req.json();
    const {
      description,
      amount,
      date,
      billable,
      receiptUrl,
      approved,
    } = body;
    
    // Team members can only update their own expenses and only if pending
    if (user.role === 'TEAM_MEMBER') {
      if (existingExpense.createdById !== user.id) {
        return NextResponse.json(
          { error: 'Forbidden - You can only update your own expenses' },
          { status: 403 }
        );
      }
      
      if (existingExpense.approved) {
        return NextResponse.json(
          { error: 'You can only update unapproved expenses' },
          { status: 403 }
        );
      }
      
      // Team members cannot approve expenses
      if (approved !== undefined) {
        return NextResponse.json(
          { error: 'You cannot approve expenses' },
          { status: 403 }
        );
      }
    }
    
    // Only project managers and admins can approve
    if (approved !== undefined && approved !== existingExpense.approved) {
      if (user.role === 'TEAM_MEMBER') {
        return NextResponse.json(
          { error: 'Only managers can approve expenses' },
          { status: 403 }
        );
      }
      
      // Project managers can only approve expenses for their projects
      if (user.role === 'PROJECT_MANAGER' && existingExpense.project?.managerId !== user.id) {
        return NextResponse.json(
          { error: 'You can only approve expenses for your projects' },
          { status: 403 }
        );
      }
    }
    
    // Validate amount if provided
    if (amount !== undefined && amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }
    
    // Prepare update data
    const updateData = {};
    if (description !== undefined) updateData.description = description;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (date !== undefined) updateData.date = new Date(date);
    if (billable !== undefined) updateData.billable = billable;
    if (receiptUrl !== undefined) updateData.receiptUrl = receiptUrl;
    if (approved !== undefined) updateData.approved = approved;
    
    const expense = await prisma.expense.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
    
    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { error: 'Failed to update expense' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/expenses/[id]
 * Delete an expense
 */
export async function DELETE(req, context) {
  const authResult = await requirePermission(req, 'expenses', 'delete');
  
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
    const expense = await prisma.expense.findUnique({
      where: { id },
    });
    
    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }
    
    // Team members can only delete their own pending expenses
    if (user.role === 'TEAM_MEMBER') {
      if (expense.createdById !== user.id) {
        return NextResponse.json(
          { error: 'Forbidden - You can only delete your own expenses' },
          { status: 403 }
        );
      }
      
      if (expense.approved) {
        return NextResponse.json(
          { error: 'You can only delete unapproved expenses' },
          { status: 403 }
        );
      }
    }
    
    await prisma.expense.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}
