import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

/**
 * Role-Based Access Control (RBAC) utilities
 */

// Define permissions for each role
export const PERMISSIONS = {
  ADMIN: {
    projects: ['create', 'read', 'update', 'delete'],
    tasks: ['create', 'read', 'update', 'delete'],
    timesheets: ['create', 'read', 'update', 'delete'],
    expenses: ['create', 'read', 'update', 'delete', 'approve'],
    users: ['create', 'read', 'update', 'delete'],
    financials: ['create', 'read', 'update', 'delete'],
    salesOrders: ['create', 'read', 'update', 'delete'],
    purchaseOrders: ['create', 'read', 'update', 'delete'],
    invoices: ['create', 'read', 'update', 'delete'],
    analytics: ['read'],
    database: ['read', 'update', 'delete'],
  },
  PROJECT_MANAGER: {
    projects: ['create', 'read', 'update', 'delete'],
    tasks: ['create', 'read', 'update', 'delete'],
    timesheets: ['read'],
    expenses: ['read', 'approve'],
    users: ['read'],
    financials: ['create', 'read', 'update'],
    salesOrders: ['read', 'update'],
    purchaseOrders: ['read','create'],
    invoices: ['create', 'read', 'update'],
    analytics: ['read'],
  },
  TEAM_MEMBER: {
    projects: ['read'],
    tasks: ['read', 'update'],
    timesheets: ['create', 'read', 'update', 'delete'],
    expenses: ['create', 'read', 'update', 'delete'],
    users: ['read'],
    financials: ['read'],
    invoices: ['read'],
  },
  SALES: {
    projects: ['read'],
    tasks: ['read'],
    timesheets: ['read'],
    expenses: ['read'],
    users: ['read'],
    financials: ['create', 'read', 'update'],
    salesOrders: ['create', 'read', 'update', 'delete'],
    purchaseOrders: ['read','update'],
    invoices: ['create', 'read', 'update', 'delete'],
    analytics: ['read'],
  },
  FINANCE: {
    projects: ['read'],
    tasks: ['read'],
    timesheets: ['read'],
    expenses: ['read', 'approve'],
    users: ['read'],
    financials: ['create', 'read', 'update', 'delete'],
    salesOrders: ['read'],
    purchaseOrders: ['create', 'read', 'update', 'delete'],
    invoices: ['create', 'read', 'update', 'delete'],
    analytics: ['read'],
  },
};

/**
 * Check if a user has permission to perform an action
 */
export function hasPermission(role, resource, action) {
  const rolePermissions = PERMISSIONS[role];
  if (!rolePermissions) return false;
  
  const resourcePermissions = rolePermissions[resource];
  if (!resourcePermissions) return false;
  
  return resourcePermissions.includes(action);
}

/**
 * Middleware to check authentication
 */
export async function requireAuth(req) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return {
      error: 'Unauthorized',
      status: 401,
    };
  }
  
  return { user: session.user };
}

/**
 * Middleware to check role-based permissions
 */
export async function requirePermission(req, resource, action) {
  const authResult = await requireAuth(req);
  
  if (authResult.error) {
    return authResult;
  }
  
  const { user } = authResult;
  
  if (!hasPermission(user.role, resource, action)) {
    return {
      error: 'Forbidden - Insufficient permissions',
      status: 403,
    };
  }
  
  return { user };
}

/**
 * Check if user is project manager or admin
 */
export function isProjectManagerOrAdmin(role) {
  return role === 'ADMIN' || role === 'PROJECT_MANAGER';
}

/**
 * Check if user can manage specific project
 */
export async function canManageProject(userId, projectId, prisma) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { managerId: true },
  });
  
  return project && project.managerId === userId;
}

/**
 * UI Permission helpers
 */
export const UI_PERMISSIONS = {
  canCreateProject: (role) => hasPermission(role, 'projects', 'create'),
  canEditProject: (role) => hasPermission(role, 'projects', 'update'),
  canDeleteProject: (role) => hasPermission(role, 'projects', 'delete'),
  
  canCreateTask: (role) => hasPermission(role, 'tasks', 'create'),
  canEditTask: (role) => hasPermission(role, 'tasks', 'update'),
  canDeleteTask: (role) => hasPermission(role, 'tasks', 'delete'),
  
  canManageTasks: (role) => hasPermission(role, 'tasks', 'create') && hasPermission(role, 'tasks', 'delete'),
  
  canViewBudget: (role) => hasPermission(role, 'financials', 'read'),
  canEditBudget: (role) => hasPermission(role, 'financials', 'update'),
  
  canManageSalesOrders: (role) => hasPermission(role, 'salesOrders', 'read'),
  canCreateSalesOrders: (role) => hasPermission(role, 'salesOrders', 'create'),
  
  canManagePurchaseOrders: (role) => hasPermission(role, 'purchaseOrders', 'read'),
  canCreatePurchaseOrders: (role) => hasPermission(role, 'purchaseOrders', 'create'),
  
  isTeamMember: (role) => role === 'TEAM_MEMBER',
  isProjectManager: (role) => role === 'PROJECT_MANAGER',
  isAdmin: (role) => role === 'ADMIN',
  isSales: (role) => role === 'SALES',
  isFinance: (role) => role === 'FINANCE',
};
