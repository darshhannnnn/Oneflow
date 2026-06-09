import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { invalidateCache } from "@/lib/cache";

/**
 * POST /api/admin/bulk
 * Perform bulk operations on database records
 */
export async function POST(req) {
  const authResult = await requirePermission(req, 'analytics', 'read');
  
  if (authResult.error || authResult.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { operation, table, ids, data } = body;

    if (!operation || !table) {
      return NextResponse.json(
        { error: 'Operation and table are required' },
        { status: 400 }
      );
    }

    let result;

    switch (operation) {
      case 'delete':
        result = await bulkDelete(table, ids);
        break;
      
      case 'update':
        result = await bulkUpdate(table, ids, data);
        break;
      
      case 'export':
        result = await bulkExport(table, ids);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        );
    }

    // Invalidate relevant caches
    invalidateCache(`admin-analytics-.*`);
    invalidateCache(`${table}-.*`);

    return NextResponse.json({
      success: true,
      operation,
      table,
      result,
    });
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation', details: error.message },
      { status: 500 }
    );
  }
}

async function bulkDelete(table, ids) {
  if (!ids || ids.length === 0) {
    throw new Error('No IDs provided for deletion');
  }

  const modelMap = {
    users: prisma.user,
    projects: prisma.project,
    tasks: prisma.task,
    timesheets: prisma.timesheet,
    expenses: prisma.expense,
    salesOrders: prisma.salesOrder,
    purchaseOrders: prisma.purchaseOrder,
    invoices: prisma.customerInvoice,
    vendorBills: prisma.vendorBill,
    partners: prisma.partner,
    products: prisma.product,
    payments: prisma.payment,
  };

  const model = modelMap[table];
  if (!model) {
    throw new Error(`Invalid table: ${table}`);
  }

  const result = await model.deleteMany({
    where: {
      id: {
        in: ids,
      },
    },
  });

  return {
    deleted: result.count,
    ids,
  };
}

async function bulkUpdate(table, ids, updateData) {
  if (!ids || ids.length === 0) {
    throw new Error('No IDs provided for update');
  }

  if (!updateData || Object.keys(updateData).length === 0) {
    throw new Error('No update data provided');
  }

  const modelMap = {
    users: prisma.user,
    projects: prisma.project,
    tasks: prisma.task,
    timesheets: prisma.timesheet,
    expenses: prisma.expense,
    salesOrders: prisma.salesOrder,
    purchaseOrders: prisma.purchaseOrder,
    invoices: prisma.customerInvoice,
    vendorBills: prisma.vendorBill,
    partners: prisma.partner,
    products: prisma.product,
    payments: prisma.payment,
  };

  const model = modelMap[table];
  if (!model) {
    throw new Error(`Invalid table: ${table}`);
  }

  const result = await model.updateMany({
    where: {
      id: {
        in: ids,
      },
    },
    data: updateData,
  });

  return {
    updated: result.count,
    ids,
    data: updateData,
  };
}

async function bulkExport(table, ids) {
  const modelMap = {
    users: prisma.user,
    projects: prisma.project,
    tasks: prisma.task,
    timesheets: prisma.timesheet,
    expenses: prisma.expense,
    salesOrders: prisma.salesOrder,
    purchaseOrders: prisma.purchaseOrder,
    invoices: prisma.customerInvoice,
    vendorBills: prisma.vendorBill,
    partners: prisma.partner,
    products: prisma.product,
    payments: prisma.payment,
  };

  const model = modelMap[table];
  if (!model) {
    throw new Error(`Invalid table: ${table}`);
  }

  const whereClause = ids && ids.length > 0 
    ? { id: { in: ids } }
    : {};

  const records = await model.findMany({
    where: whereClause,
    take: 10000, // Limit for safety
  });

  return {
    count: records.length,
    records,
  };
}

/**
 * GET /api/admin/bulk
 * Get bulk operation status or history
 */
export async function GET(req) {
  const authResult = await requirePermission(req, 'analytics', 'read');
  
  if (authResult.error || authResult.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    message: 'Bulk operations endpoint',
    availableOperations: ['delete', 'update', 'export'],
    availableTables: [
      'users', 'projects', 'tasks', 'timesheets', 'expenses',
      'salesOrders', 'purchaseOrders', 'invoices', 'vendorBills',
      'partners', 'products', 'payments',
    ],
  });
}
