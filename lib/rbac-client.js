/**
 * Client-side Role-Based Access Control utilities
 * Based on the OneFlow problem statement requirements
 */

/**
 * Check if user has permission to perform an action
 * @param {Object} user - User object with role property
 * @param {string} resource - Resource type (projects, tasks, expenses, etc.)
 * @param {string} action - Action type (create, read, update, delete, approve)
 * @returns {boolean} - Whether user has permission
 */
export function hasPermission(user, resource, action) {
  if (!user || !user.role) return false;

  const { role } = user;

  // Admin has all permissions
  if (role === "ADMIN") return true;

  // Define permissions based on problem statement
  const permissions = {
    ADMIN: {
      projects: ["create", "read", "update", "delete"],
      tasks: ["create", "read", "update", "delete"],
      timesheets: ["create", "read", "update", "delete"],
      expenses: ["create", "read", "update", "delete", "approve"],
      salesOrders: ["create", "read", "update", "delete"],
      purchaseOrders: ["create", "read", "update", "delete"],
      customerInvoices: ["create", "read", "update", "delete"],
      vendorBills: ["create", "read", "update", "delete"],
      users: ["create", "read", "update", "delete"],
      analytics: ["read"],
    },
    PROJECT_MANAGER: {
      projects: ["create", "read", "update", "delete"], // For their projects
      tasks: ["create", "read", "update", "delete"], // For their projects
      timesheets: ["read"], // Can view team timesheets
      expenses: ["read", "approve"], // Can approve expenses
      salesOrders: ["create", "read", "update"], // Can manage for their projects
      purchaseOrders: ["create", "read", "update"], // Can manage for their projects
      customerInvoices: ["create", "read"], // Can trigger invoices
      vendorBills: ["read"],
      users: ["read"], // Can view users to assign
      analytics: ["read"], // Can view project analytics
    },
    TEAM_MEMBER: {
      projects: ["read"], // Can view assigned projects
      tasks: ["read", "update"], // Can view and update their tasks
      timesheets: ["create", "read", "update", "delete"], // Can manage their timesheets
      expenses: ["create", "read", "update", "delete"], // Can manage their expenses (pending only)
      salesOrders: ["read"], // Can view related to their projects
      purchaseOrders: ["read"],
      customerInvoices: ["read"],
      vendorBills: ["read"],
      users: ["read"], // Can view team members
      analytics: ["read"], // Can view their own analytics
    },
    SALES: {
      projects: ["read"], // Can view projects
      tasks: ["read"], // Can view tasks
      timesheets: ["read"],
      expenses: ["read"],
      salesOrders: ["create", "read", "update", "delete"], // Primary responsibility
      purchaseOrders: ["read"],
      customerInvoices: ["create", "read", "update"], // Can create invoices
      vendorBills: ["read"],
      users: ["read"],
      analytics: ["read"], // Sales analytics
    },
    FINANCE: {
      projects: ["read"],
      tasks: ["read"],
      timesheets: ["read"],
      expenses: ["read", "approve"], // Can approve expenses
      salesOrders: ["read", "update"], // Can update financial details
      purchaseOrders: ["create", "read", "update", "delete"], // Primary responsibility
      customerInvoices: ["create", "read", "update", "delete"], // Primary responsibility
      vendorBills: ["create", "read", "update", "delete"], // Primary responsibility
      users: ["read"],
      analytics: ["read"], // Financial analytics
    },
  };

  const rolePermissions = permissions[role];
  if (!rolePermissions) return false;

  const resourcePermissions = rolePermissions[resource];
  if (!resourcePermissions) return false;

  return resourcePermissions.includes(action);
}

/**
 * Check if user can access a specific page
 * @param {Object} user - User object with role property
 * @param {string} page - Page identifier
 * @returns {boolean} - Whether user can access the page
 */
export function canAccessPage(user, page) {
  if (!user || !user.role) return false;

  const { role } = user;

  // Admin can access everything
  if (role === "ADMIN") return true;

  const pageAccess = {
    dashboard: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "SALES", "FINANCE"],
    projects: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "SALES", "FINANCE"],
    "projects/new": ["ADMIN", "PROJECT_MANAGER"],
    tasks: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"],
    timesheets: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"],
    expenses: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "FINANCE"],
    analytics: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "SALES", "FINANCE"],
    users: ["ADMIN"],
    salesOrders: ["ADMIN", "PROJECT_MANAGER", "SALES"],
    purchaseOrders: ["ADMIN", "PROJECT_MANAGER", "FINANCE"],
    customerInvoices: ["ADMIN", "PROJECT_MANAGER", "SALES", "FINANCE"],
    vendorBills: ["ADMIN", "PROJECT_MANAGER", "FINANCE"],
  };

  const allowedRoles = pageAccess[page];
  if (!allowedRoles) return false;

  return allowedRoles.includes(role);
}

/**
 * Get user's capabilities for display purposes
 * @param {Object} user - User object with role property
 * @returns {Object} - Object with capability flags
 */
export function getUserCapabilities(user) {
  if (!user || !user.role) {
    return {
      canCreateProjects: false,
      canManageTasks: false,
      canApproveExpenses: false,
      canManageFinancials: false,
      canManageUsers: false,
      canViewAllProjects: false,
      canViewAllTasks: false,
    };
  }

  const { role } = user;

  return {
    canCreateProjects: ["ADMIN", "PROJECT_MANAGER"].includes(role),
    canManageTasks: ["ADMIN", "PROJECT_MANAGER"].includes(role),
    canApproveExpenses: ["ADMIN", "PROJECT_MANAGER", "FINANCE"].includes(role),
    canManageFinancials: ["ADMIN", "SALES", "FINANCE"].includes(role),
    canManageUsers: role === "ADMIN",
    canViewAllProjects: ["ADMIN", "PROJECT_MANAGER", "SALES", "FINANCE"].includes(role),
    canViewAllTasks: ["ADMIN", "PROJECT_MANAGER"].includes(role),
    canCreateSalesOrders: ["ADMIN", "PROJECT_MANAGER", "SALES"].includes(role),
    canCreatePurchaseOrders: ["ADMIN", "PROJECT_MANAGER", "FINANCE"].includes(role),
    canCreateInvoices: ["ADMIN", "PROJECT_MANAGER", "SALES", "FINANCE"].includes(role),
    canManageVendorBills: ["ADMIN", "FINANCE"].includes(role),
  };
}

/**
 * Get filtered navigation items based on user role
 * @param {Object} user - User object with role property
 * @returns {Array} - Array of navigation items user can access
 */
export function getNavigationItems(user) {
  if (!user || !user.role) return [];

  const allItems = [
    { id: "dashboard", label: "Dashboard", href: "/dashboard", roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "SALES", "FINANCE"] },
    { id: "projects", label: "Projects", href: "/dashboard/projects", roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "SALES", "FINANCE"] },
    { id: "tasks", label: "Tasks", href: "/dashboard/tasks", roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"] },
    { id: "timesheets", label: "Timesheets", href: "/dashboard/timesheets", roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"] },
    { id: "expenses", label: "Expenses", href: "/dashboard/expenses", roles: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "FINANCE"] },
    { id: "analytics", label: "Analytics", href: "/dashboard/analytics", roles: ["ADMIN", "PROJECT_MANAGER", "SALES", "FINANCE"] },
    { id: "sales-orders", label: "Sales Orders", href: "/dashboard/sales-orders", roles: ["ADMIN", "PROJECT_MANAGER", "SALES"] },
    { id: "purchase-orders", label: "Purchase Orders", href: "/dashboard/purchase-orders", roles: ["ADMIN", "PROJECT_MANAGER", "FINANCE"] },
    { id: "invoices", label: "Invoices", href: "/dashboard/invoices", roles: ["ADMIN", "PROJECT_MANAGER", "SALES", "FINANCE"] },
    { id: "vendor-bills", label: "Vendor Bills", href: "/dashboard/vendor-bills", roles: ["ADMIN", "FINANCE"] },
    { id: "users", label: "Users", href: "/dashboard/users", roles: ["ADMIN"] },
  ];

  return allItems.filter(item => item.roles.includes(user.role));
}

/**
 * Role display names
 */
export const ROLE_LABELS = {
  ADMIN: "Administrator",
  PROJECT_MANAGER: "Project Manager",
  TEAM_MEMBER: "Team Member",
  SALES: "Sales",
  FINANCE: "Finance",
};

/**
 * Get role label
 * @param {string} role - Role identifier
 * @returns {string} - Human-readable role label
 */
export function getRoleLabel(role) {
  return ROLE_LABELS[role] || role;
}
