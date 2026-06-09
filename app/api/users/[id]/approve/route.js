import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

/**
 * POST /api/users/[id]/approve
 * Approve a user and allow them to access the system
 */
export async function POST(req, context) {
  const authResult = await requirePermission(req, 'users', 'update');
  
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const params = await context.params;
    
    // Update user to approved status
    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: authResult.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isApproved: true,
        approvedAt: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'User approved successfully',
      user 
    });
  } catch (error) {
    console.error('Error approving user:', error);
    return NextResponse.json(
      { error: 'Failed to approve user' },
      { status: 500 }
    );
  }
}
