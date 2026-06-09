import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";

/**
 * GET /api/admin/verify
 * Debug endpoint to verify admin access and permissions
 */
export async function GET(req) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({
        error: 'No session found',
        authenticated: false,
        message: 'Please login first',
      }, { status: 401 });
    }

    const user = session.user;
    const userRole = user.role;

    // Check if user has a role
    if (!userRole) {
      return NextResponse.json({
        error: 'No role assigned',
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: null,
        },
        message: 'User has no role assigned. Please set role to ADMIN in database.',
        sqlCommand: `UPDATE "User" SET role = 'ADMIN' WHERE email = '${user.email}';`,
      }, { status: 403 });
    }

    // Check if role is ADMIN
    const isAdmin = userRole === 'ADMIN';

    // Get permissions for user's role
    const rolePermissions = PERMISSIONS[userRole] || {};

    // Check specific permissions
    const hasAnalyticsPermission = rolePermissions.analytics?.includes('read') || false;
    const hasDatabasePermission = rolePermissions.database?.includes('read') || false;

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: userRole,
      },
      roleCheck: {
        isAdmin,
        hasAnalyticsPermission,
        hasDatabasePermission,
      },
      permissions: rolePermissions,
      message: isAdmin 
        ? 'User has ADMIN role and all permissions' 
        : `User has ${userRole} role with limited permissions`,
      nextSteps: !isAdmin ? [
        'Logout from the application',
        `Run in database: UPDATE "User" SET role = 'ADMIN' WHERE email = '${user.email}';`,
        'Login again',
        'Refresh the dashboard',
      ] : [
        'All permissions verified',
        'You should be able to access admin features',
        'If still getting 403, try logging out and back in',
      ],
    });
  } catch (error) {
    console.error('Error in verify endpoint:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}
