import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

/**
 * GET /api/admin/database
 * Get database statistics and health information
 */
export async function GET(req) {
  const authResult = await requirePermission(req, 'analytics', 'read');
  
  if (authResult.error || authResult.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const table = searchParams.get('table');

    // If specific table requested, return detailed info
    if (table) {
      return await getTableDetails(table);
    }

    // Get counts for all tables in parallel
    const [
      usersCount,
      projectsCount,
      tasksCount,
      timesheetsCount,
      expensesCount,
      salesOrdersCount,
      purchaseOrdersCount,
      invoicesCount,
      vendorBillsCount,
      partnersCount,
      productsCount,
      paymentsCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.task.count(),
      prisma.timesheet.count(),
      prisma.expense.count(),
      prisma.salesOrder.count(),
      prisma.purchaseOrder.count(),
      prisma.customerInvoice.count(),
      prisma.vendorBill.count(),
      prisma.partner.count(),
      prisma.product.count(),
      prisma.payment.count(),
    ]);

    const tables = [
      { name: 'users', count: usersCount, description: 'System users with roles' },
      { name: 'projects', count: projectsCount, description: 'Project management records' },
      { name: 'tasks', count: tasksCount, description: 'Task assignments and tracking' },
      { name: 'timesheets', count: timesheetsCount, description: 'Time logging entries' },
      { name: 'expenses', count: expensesCount, description: 'Expense records' },
      { name: 'salesOrders', count: salesOrdersCount, description: 'Sales order documents' },
      { name: 'purchaseOrders', count: purchaseOrdersCount, description: 'Purchase order documents' },
      { name: 'invoices', count: invoicesCount, description: 'Customer invoices' },
      { name: 'vendorBills', count: vendorBillsCount, description: 'Vendor bill records' },
      { name: 'partners', count: partnersCount, description: 'Customers and vendors' },
      { name: 'products', count: productsCount, description: 'Product catalog' },
      { name: 'payments', count: paymentsCount, description: 'Payment transactions' },
    ];

    const totalRecords = tables.reduce((sum, table) => sum + table.count, 0);

    return NextResponse.json({
      tables,
      totalRecords,
      databaseHealth: 'healthy',
      lastChecked: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching database info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database information', details: error.message },
      { status: 500 }
    );
  }
}

async function getTableDetails(tableName) {
  try {
    let data, count;
    const limit = 100; // Limit for performance

    switch (tableName) {
      case 'users':
        [data, count] = await Promise.all([
          prisma.user.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              createdAt: true,
              _count: {
                select: {
                  assignedTasks: true,
                  timesheets: true,
                  expenses: true,
                },
              },
            },
          }),
          prisma.user.count(),
        ]);
        break;

      case 'projects':
        [data, count] = await Promise.all([
          prisma.project.findMany({
            take: limit,
            orderBy: { updatedAt: 'desc' },
            include: {
              _count: {
                select: {
                  tasks: true,
                  members: true,
                  salesOrders: true,
                  customerInvoices: true,
                },
              },
            },
          }),
          prisma.project.count(),
        ]);
        break;

      case 'tasks':
        [data, count] = await Promise.all([
          prisma.task.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              project: {
                select: { id: true, name: true },
              },
              assignee: {
                select: { id: true, name: true, email: true },
              },
              _count: {
                select: {
                  comments: true,
                  timesheets: true,
                },
              },
            },
          }),
          prisma.task.count(),
        ]);
        break;

      case 'timesheets':
        [data, count] = await Promise.all([
          prisma.timesheet.findMany({
            take: limit,
            orderBy: { date: 'desc' },
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
              task: {
                select: { id: true, title: true },
              },
            },
          }),
          prisma.timesheet.count(),
        ]);
        break;

      case 'expenses':
        [data, count] = await Promise.all([
          prisma.expense.findMany({
            take: limit,
            orderBy: { date: 'desc' },
            include: {
              project: {
                select: { id: true, name: true },
              },
              createdBy: {
                select: { id: true, name: true, email: true },
              },
              partner: {
                select: { id: true, name: true },
              },
            },
          }),
          prisma.expense.count(),
        ]);
        break;

      case 'salesOrders':
        [data, count] = await Promise.all([
          prisma.salesOrder.findMany({
            take: limit,
            orderBy: { date: 'desc' },
            include: {
              partner: {
                select: { id: true, name: true },
              },
              project: {
                select: { id: true, name: true },
              },
              _count: {
                select: {
                  lines: true,
                  invoices: true,
                },
              },
            },
          }),
          prisma.salesOrder.count(),
        ]);
        break;

      case 'purchaseOrders':
        [data, count] = await Promise.all([
          prisma.purchaseOrder.findMany({
            take: limit,
            orderBy: { date: 'desc' },
            include: {
              partner: {
                select: { id: true, name: true },
              },
              project: {
                select: { id: true, name: true },
              },
              _count: {
                select: {
                  lines: true,
                  vendorBills: true,
                },
              },
            },
          }),
          prisma.purchaseOrder.count(),
        ]);
        break;

      case 'invoices':
        [data, count] = await Promise.all([
          prisma.customerInvoice.findMany({
            take: limit,
            orderBy: { date: 'desc' },
            include: {
              partner: {
                select: { id: true, name: true },
              },
              project: {
                select: { id: true, name: true },
              },
              _count: {
                select: {
                  lines: true,
                  payments: true,
                },
              },
            },
          }),
          prisma.customerInvoice.count(),
        ]);
        break;

      case 'vendorBills':
        [data, count] = await Promise.all([
          prisma.vendorBill.findMany({
            take: limit,
            orderBy: { date: 'desc' },
            include: {
              partner: {
                select: { id: true, name: true },
              },
              project: {
                select: { id: true, name: true },
              },
              _count: {
                select: {
                  lines: true,
                  payments: true,
                },
              },
            },
          }),
          prisma.vendorBill.count(),
        ]);
        break;

      case 'partners':
        [data, count] = await Promise.all([
          prisma.partner.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              _count: {
                select: {
                  salesOrders: true,
                  purchaseOrders: true,
                  customerInvoices: true,
                  vendorBills: true,
                },
              },
            },
          }),
          prisma.partner.count(),
        ]);
        break;

      case 'products':
        [data, count] = await Promise.all([
          prisma.product.findMany({
            take: limit,
            orderBy: { name: 'asc' },
            include: {
              _count: {
                select: {
                  salesLines: true,
                  purchaseLines: true,
                },
              },
            },
          }),
          prisma.product.count(),
        ]);
        break;

      case 'payments':
        [data, count] = await Promise.all([
          prisma.payment.findMany({
            take: limit,
            orderBy: { date: 'desc' },
            include: {
              partner: {
                select: { id: true, name: true },
              },
              invoice: {
                select: { id: true, number: true },
              },
              vendorBill: {
                select: { id: true, number: true },
              },
            },
          }),
          prisma.payment.count(),
        ]);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid table name' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      table: tableName,
      count,
      data,
      limit,
      hasMore: count > limit,
    });
  } catch (error) {
    console.error(`Error fetching ${tableName} details:`, error);
    return NextResponse.json(
      { error: `Failed to fetch ${tableName} details`, details: error.message },
      { status: 500 }
    );
  }
}
