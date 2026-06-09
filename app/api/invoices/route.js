import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

// Dynamic import for nodemailer to avoid ES module issues
let sendInvoiceEmail;
async function getSendInvoiceEmail() {
  if (!sendInvoiceEmail) {
    const emailModule = await import("@/lib/email");
    sendInvoiceEmail = emailModule.sendInvoiceEmail;
  }
  return sendInvoiceEmail;
}

/**
 * GET /api/invoices
 * Get all customer invoices
 */
export async function GET(req) {
  try {
    const authResult = await requirePermission(req, 'invoices', 'read');
    
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    
    const { user } = authResult;
    
    const invoices = await prisma.customerInvoice.findMany({
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
          },
        },
        salesOrder: {
          select: {
            id: true,
            number: true,
            total: true,
          },
        },
        lines: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        _count: {
          select: {
            lines: true,
            payments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invoices
 * Create a new customer invoice
 */
export async function POST(req) {
  try {
    const authResult = await requirePermission(req, 'invoices', 'create');
    
    if (authResult.error) {
      console.error("Permission denied:", authResult);
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    
    const { user } = authResult;
    
    const body = await req.json();
    console.log("Received invoice data:", body);
    
    const {
      number,
      partnerId,
      projectId,
      salesOrderId,
      date,
      dueDate,
      status,
      currency,
      note,
      lines,
      subtotal,
      taxTotal,
      total,
      customerName,
      customerEmail,
      sendEmail,
    } = body;
    
    // Validate required fields
    if (!number) {
      return NextResponse.json(
        { error: 'Invoice number is required' },
        { status: 400 }
      );
    }
    
    if (!lines || lines.length === 0) {
      return NextResponse.json(
        { error: 'At least one invoice line is required' },
        { status: 400 }
      );
    }
    
    // Check if number already exists
    const existing = await prisma.customerInvoice.findUnique({
      where: { number },
    });
    
    if (existing) {
      return NextResponse.json(
        { error: 'Invoice number already exists' },
        { status: 400 }
      );
    }
    
    console.log("Creating invoice...");
    
    // Build the data object with proper Prisma relations
    const invoiceData = {
      number,
      date: date ? new Date(date) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      status: status || 'DRAFT',
      currency: currency || 'INR',
      subtotal: parseFloat(subtotal) || 0,
      taxTotal: parseFloat(taxTotal) || 0,
      total: parseFloat(total) || 0,
      lines: {
        create: lines.map(line => ({
          description: line.description,
          quantity: parseFloat(line.quantity) || 1,
          unit: line.unit || 'Unit',
          unitPrice: parseFloat(line.unitPrice),
          taxPercent: line.taxPercent ? parseFloat(line.taxPercent) : null,
          amount: parseFloat(line.amount),
          ...(line.productId && {
            product: {
              connect: { id: line.productId }
            }
          })
        })),
      },
    };
    
    // Add optional relations only if they exist
    if (partnerId) {
      invoiceData.partner = { connect: { id: partnerId } };
    }
    if (projectId) {
      invoiceData.project = { connect: { id: projectId } };
    }
    if (salesOrderId) {
      invoiceData.salesOrder = { connect: { id: salesOrderId } };
    }
    
    // Create invoice with lines
    const invoice = await prisma.customerInvoice.create({
      data: invoiceData,
      include: {
        partner: true,
        project: true,
        salesOrder: true,
        lines: {
          include: {
            product: true,
          },
        },
      },
    });
    
    console.log("Invoice created successfully:", invoice.id);
    
    // Send email to customer if requested
    if (sendEmail && customerEmail) {
      try {
        console.log("\n=== SENDING INVOICE EMAIL ===");
        console.log("From: sales@oneflow.com");
        console.log("To:", customerEmail);
        console.log("Customer Name:", customerName);
        
        const sendEmailFunc = await getSendInvoiceEmail();
        const emailResult = await sendEmailFunc({
          customerName,
          customerEmail,
          invoiceNumber: invoice.number,
          invoiceDate: invoice.date,
          dueDate: invoice.dueDate,
          lines: invoice.lines,
          subtotal: invoice.subtotal,
          taxTotal: invoice.taxTotal,
          total: invoice.total,
          currency: invoice.currency,
        });
        
        if (emailResult.success) {
          console.log("✓ Email sent successfully to:", customerEmail);
          console.log("Message ID:", emailResult.messageId);
        } else {
          console.error("✗ Failed to send email:", emailResult.error);
        }
        
        console.log("=== END EMAIL ===\n");
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Don't fail the invoice creation if email fails
      }
    }
    
    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to create invoice', message: error.message, details: error.toString() },
      { status: 500 }
    );
  }
}
