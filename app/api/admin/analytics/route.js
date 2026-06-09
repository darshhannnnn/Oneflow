import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import cache, { withCache } from "@/lib/cache";

/**
 * GET /api/admin/analytics
 * Comprehensive analytics for admin dashboard
 * Optimized with aggregations, minimal queries, and caching
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
    const timeRange = searchParams.get('timeRange') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Use cache for analytics data (5 minute TTL)
    const cacheKey = `admin-analytics-${timeRange}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return NextResponse.json({ ...cachedData, cached: true });
    }

    // Parallel queries for performance
    const [
      userStats,
      projectStats,
      taskStats,
      financialStats,
      timesheetStats,
      expenseStats,
      documentStats,
      recentActivities,
      topProjects,
      userPerformance,
    ] = await Promise.all([
      // User Statistics
      prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
      }),

      // Project Statistics
      prisma.project.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: {
          totalRevenue: true,
          totalCost: true,
          budget: true,
        },
        _avg: {
          progressPct: true,
        },
      }),

      // Task Statistics
      prisma.task.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: {
          loggedHours: true,
          estimateHours: true,
        },
      }),

      // Financial Overview
      Promise.all([
        prisma.salesOrder.aggregate({
          _sum: { total: true },
          _count: { id: true },
          where: { createdAt: { gte: startDate } },
        }),
        prisma.purchaseOrder.aggregate({
          _sum: { total: true },
          _count: { id: true },
          where: { createdAt: { gte: startDate } },
        }),
        prisma.customerInvoice.aggregate({
          _sum: { total: true },
          _count: { id: true },
          where: { createdAt: { gte: startDate } },
        }),
        prisma.vendorBill.aggregate({
          _sum: { total: true },
          _count: { id: true },
          where: { createdAt: { gte: startDate } },
        }),
      ]),

      // Timesheet Statistics
      prisma.timesheet.aggregate({
        _sum: { hours: true, amount: true },
        _count: { id: true },
        where: { createdAt: { gte: startDate } },
      }),

      // Expense Statistics
      prisma.expense.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: { 
          createdAt: { gte: startDate },
        },
      }),

      // Document Status Distribution - with error handling
      Promise.all([
        prisma.salesOrder.groupBy({
          by: ['status'],
          _count: { id: true },
        }).catch(err => {
          console.warn('Error fetching sales order status distribution:', err.message);
          return [];
        }),
        prisma.purchaseOrder.groupBy({
          by: ['status'],
          _count: { id: true },
        }).catch(err => {
          console.warn('Error fetching purchase order status distribution:', err.message);
          return [];
        }),
      ]),

      // Recent Activities (last 20)
      prisma.project.findMany({
        take: 20,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          status: true,
          updatedAt: true,
          totalRevenue: true,
          totalCost: true,
        },
      }),

      // Top Projects by Revenue
      prisma.project.findMany({
        take: 10,
        orderBy: { totalRevenue: 'desc' },
        select: {
          id: true,
          name: true,
          status: true,
          totalRevenue: true,
          totalCost: true,
          progressPct: true,
          _count: {
            select: {
              tasks: true,
              members: true,
            },
          },
        },
      }),

      // User Performance Metrics
      prisma.user.findMany({
        where: {
          role: { in: ['PROJECT_MANAGER', 'TEAM_MEMBER'] },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          _count: {
            select: {
              assignedTasks: true,
              timesheets: true,
              expenses: true,
            },
          },
        },
        take: 50,
      }),
    ]);

    // Process financial stats
    const [salesOrderData, purchaseOrderData, invoiceData, vendorBillData] = financialStats;

    // Calculate derived metrics
    const totalUsers = userStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const totalProjects = projectStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const totalTasks = taskStats.reduce((sum, stat) => sum + stat._count.id, 0);
    
    const totalRevenue = projectStats.reduce((sum, stat) => sum + (Number(stat._sum.totalRevenue) || 0), 0);
    const totalCost = projectStats.reduce((sum, stat) => sum + (Number(stat._sum.totalCost) || 0), 0);
    const totalBudget = projectStats.reduce((sum, stat) => sum + (Number(stat._sum.budget) || 0), 0);
    const profit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : 0;

    const totalHoursLogged = taskStats.reduce((sum, stat) => sum + (Number(stat._sum.loggedHours) || 0), 0);
    const totalHoursEstimated = taskStats.reduce((sum, stat) => sum + (Number(stat._sum.estimateHours) || 0), 0);

    // Build comprehensive response
    const analytics = {
      overview: {
        totalUsers,
        totalProjects,
        totalTasks,
        totalRevenue,
        totalCost,
        totalBudget,
        profit,
        profitMargin,
        totalHoursLogged,
        totalHoursEstimated,
        utilizationRate: totalHoursEstimated > 0 
          ? ((totalHoursLogged / totalHoursEstimated) * 100).toFixed(2) 
          : 0,
      },

      userDistribution: userStats.map(stat => ({
        role: stat.role,
        count: stat._count.id,
        percentage: ((stat._count.id / totalUsers) * 100).toFixed(1),
      })),

      projectDistribution: projectStats.map(stat => ({
        status: stat.status,
        count: stat._count.id,
        percentage: ((stat._count.id / totalProjects) * 100).toFixed(1),
        totalRevenue: Number(stat._sum.totalRevenue) || 0,
        totalCost: Number(stat._sum.totalCost) || 0,
        avgProgress: Number(stat._avg.progressPct) || 0,
      })),

      taskDistribution: taskStats.map(stat => ({
        status: stat.status,
        count: stat._count.id,
        percentage: ((stat._count.id / totalTasks) * 100).toFixed(1),
        totalHours: Number(stat._sum.loggedHours) || 0,
      })),

      financialSummary: {
        salesOrders: {
          total: Number(salesOrderData._sum.total) || 0,
          count: salesOrderData._count.id,
        },
        purchaseOrders: {
          total: Number(purchaseOrderData._sum.total) || 0,
          count: purchaseOrderData._count.id,
        },
        invoices: {
          total: Number(invoiceData._sum.total) || 0,
          count: invoiceData._count.id,
        },
        vendorBills: {
          total: Number(vendorBillData._sum.total) || 0,
          count: vendorBillData._count.id,
        },
        netCashFlow: (Number(invoiceData._sum.total) || 0) - (Number(vendorBillData._sum.total) || 0),
      },

      timesheetSummary: {
        totalHours: Number(timesheetStats._sum.hours) || 0,
        totalAmount: Number(timesheetStats._sum.amount) || 0,
        count: timesheetStats._count.id,
        avgHourlyRate: timesheetStats._sum.hours > 0 
          ? (Number(timesheetStats._sum.amount) / Number(timesheetStats._sum.hours)).toFixed(2)
          : 0,
      },

      expenseSummary: {
        totalAmount: Number(expenseStats._sum.amount) || 0,
        count: expenseStats._count.id,
        avgExpense: expenseStats._count.id > 0
          ? (Number(expenseStats._sum.amount) / expenseStats._count.id).toFixed(2)
          : 0,
      },

      documentStatus: {
        salesOrders: documentStats[0],
        purchaseOrders: documentStats[1],
      },

      recentActivities: recentActivities.map(project => ({
        ...project,
        totalRevenue: Number(project.totalRevenue) || 0,
        totalCost: Number(project.totalCost) || 0,
        profit: (Number(project.totalRevenue) || 0) - (Number(project.totalCost) || 0),
      })),

      topProjects: topProjects.map(project => ({
        ...project,
        totalRevenue: Number(project.totalRevenue) || 0,
        totalCost: Number(project.totalCost) || 0,
        profit: (Number(project.totalRevenue) || 0) - (Number(project.totalCost) || 0),
        profitMargin: project.totalRevenue > 0 
          ? (((Number(project.totalRevenue) - Number(project.totalCost)) / Number(project.totalRevenue)) * 100).toFixed(2)
          : 0,
      })),

      userPerformance: userPerformance.map(user => ({
        ...user,
        productivity: user._count.assignedTasks > 0
          ? (user._count.timesheets / user._count.assignedTasks).toFixed(2)
          : 0,
      })),

      timeRange: parseInt(timeRange),
      generatedAt: new Date().toISOString(),
    };

    // Store in cache for 5 minutes
    cache.set(cacheKey, analytics, 300);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error.message },
      { status: 500 }
    );
  }
}
