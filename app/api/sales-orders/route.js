import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

/**
 * GET /api/sales-orders
 * Get all sales orders (filtered by project if specified)
 */
export async function GET(req) {
  const authResult = await requirePermission(req, 'salesOrders', 'read');
  
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    
    let whereClause = {};
    
    if (projectId && projectId !== 'all') {
      whereClause.projectId = projectId;
    }
    
    if (status && status !== 'all') {
      whereClause.status = status.toUpperCase();
    }
    
    const salesOrders = await prisma.salesOrder.findMany({
      where: whereClause,
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
            manager: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lines: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                salesPrice: true,
                taxPercent: true,
              },
            },
          },
        },
        _count: {
          select: {
            lines: true,
            invoices: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json(salesOrders);
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales orders' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sales-orders
 * Create a new sales order or sales order request
 */
export async function POST(req) {
  const authResult = await requirePermission(req, 'salesOrders', 'create');
  
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
      number,
      partnerId,
      projectId,
      date,
      validUntil,
      status,
      currency,
      note,
      paymentTerms,
      lines,
    } = body;
    
    // Validate required fields
    if (!number) {
      return NextResponse.json(
        { error: 'Sales order number is required' },
        { status: 400 }
      );
    }
    
    // For regular sales orders, partnerId is required
    // For requests (PENDING_APPROVAL), only projectId is required
    if (status !== 'PENDING_APPROVAL' && !partnerId) {
      return NextResponse.json(
        { error: 'Partner is required for sales orders' },
        { status: 400 }
      );
    }
    
    if (status === 'PENDING_APPROVAL' && !projectId) {
      return NextResponse.json(
        { error: 'Project is required for sales order requests' },
        { status: 400 }
      );
    }
    
    // Check if number already exists
    const existing = await prisma.salesOrder.findUnique({
      where: { number },
    });
    
    if (existing) {
      return NextResponse.json(
        { error: 'Sales order number already exists' },
        { status: 400 }
      );
    }
    
    // Calculate totals
    let subtotal = 0;
    let taxTotal = 0;
    
    if (lines && lines.length > 0) {
      lines.forEach(line => {
        const lineAmount = parseFloat(line.amount) || 0;
        subtotal += lineAmount;
        
        if (line.taxPercent) {
          taxTotal += (lineAmount * parseFloat(line.taxPercent)) / 100;
        }
      });
    }
    
    const total = subtotal + taxTotal;
    
    // Build sales order data
    const salesOrderData = {
      number,
      partnerId: partnerId || null,
      projectId: projectId || null,
      date: date ? new Date(date) : new Date(),
      validUntil: validUntil ? new Date(validUntil) : null,
      status: status || 'DRAFT',
      currency: currency || 'INR',
      note: note || null,
      paymentTerms: paymentTerms || null,
      subtotal,
      taxTotal,
      total,
    };
    
    // If creating a request, add approval workflow fields
    if (status === 'PENDING_APPROVAL') {
      salesOrderData.requestedById = user.id;
      salesOrderData.requestedAt = new Date();
    }

    // Create sales order with lines
    const salesOrder = await prisma.salesOrder.create({
      data: {
        ...salesOrderData,
        lines: lines && lines.length > 0 ? {
          create: lines.map(line => ({
            productId: line.productId || null,
            description: line.description,
            quantity: parseFloat(line.quantity) || 1,
            unit: line.unit,
            unitPrice: parseFloat(line.unitPrice),
            taxPercent: line.taxPercent ? parseFloat(line.taxPercent) : null,
            amount: parseFloat(line.amount),
          })),
        } : undefined,
      },
      include: {
        partner: true,
        project: true,
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lines: {
          include: {
            product: true,
          },
        },
      },
    });
    
    return NextResponse.json(salesOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating sales order:', error);
    return NextResponse.json(
      { error: 'Failed to create sales order' },
      { status: 500 }
    );
  }
}


/**
 * PATCH /api/sales-orders
 * Update sales order status (approve/reject) or basic fields
 */
export async function PATCH(req) {
  const authResult = await requirePermission(req, 'salesOrders', 'update');

  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const body = await req.json();
    const { id, status, note } = body;

    if (!id) {
      return NextResponse.json({ error: 'Sales order id required' }, { status: 400 });
    }

    // Only allow status updates to known states: CONFIRMED (approve) or CANCELLED (reject)
    const allowedStatuses = ['CONFIRMED', 'CANCELLED', 'DRAFT', 'SENT'];

    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updated = await prisma.salesOrder.update({
      where: { id },
      data: {
        status: status || undefined,
        note: note !== undefined ? note : undefined,
      },
      include: {
        partner: true,
        project: true,
        lines: {
          include: { product: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating sales order:', error);
    return NextResponse.json({ error: 'Failed to update sales order' }, { status: 500 });
  }
}
