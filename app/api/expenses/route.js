import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

/**
 * GET /api/expenses
 * Get expenses (filtered by user or project)
 */
export async function GET(req) {
  const authResult = await requirePermission(req, 'expenses', 'read');
  
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  
  const { user } = authResult;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const projectId = searchParams.get('projectId');
  const approved = searchParams.get('approved');
  
  try {
    let whereClause = {};
    
    // Team members can only see their own expenses
    if (user.role === 'TEAM_MEMBER') {
      whereClause.createdById = user.id;
    } else if (userId) {
      whereClause.createdById = userId;
    }
    
    if (projectId) {
      whereClause.projectId = projectId;
    }
    
    if (approved !== null && approved !== undefined) {
      whereClause.approved = approved === 'true';
    }
    
    const expenses = await prisma.expense.findMany({
      where: whereClause,
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
      orderBy: {
        date: 'desc',
      },
    });
    
    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/expenses
 * Create a new expense
 */
export async function POST(req) {
  const authResult = await requirePermission(req, 'expenses', 'create');
  
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
      projectId,
      description,
      amount,
      date,
      category,
      billable,
      receiptUrl,
    } = body;
    
    // Validate required fields
    if (!projectId || !description || !amount || !date) {
      return NextResponse.json(
        { error: 'Project, description, amount, and date are required' },
        { status: 400 }
      );
    }
    
    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }
    
    // Check if project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId: user.id, isActive: true },
        },
      },
    });
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Team members can only create expenses for projects they're members of
    if (user.role === 'TEAM_MEMBER' && project.members.length === 0) {
      return NextResponse.json(
        { error: 'You can only create expenses for projects you are a member of' },
        { status: 403 }
      );
    }
    
    const expense = await prisma.expense.create({
      data: {
        projectId,
        description,
        amount: parseFloat(amount),
        date: new Date(date),
        billable: billable !== undefined ? billable : false,
        receiptUrl,
        approved: false,
        createdById: user.id,
      },
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
    
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}
