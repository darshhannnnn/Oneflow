import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only PROJECT_MANAGER and ADMIN can approve/reject
    if (!["PROJECT_MANAGER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Only project managers and admins can approve sales orders" },
        { status: 403 }
      );
    }

    // Await params in Next.js 15+
    const { id } = await params;
    const body = await req.json();
    const { action, note } = body;
    
    console.log("Approve request - ID:", id, "Action:", action, "User:", session.user.email);

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Use 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Get the sales order
    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        project: true,
        requestedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Check if the sales order exists and is pending
    if (!salesOrder) {
      return NextResponse.json(
        { error: "Sales order not found" },
        { status: 404 }
      );
    }

    // Any PROJECT_MANAGER or ADMIN can approve/reject
    // Removed the check for project ownership to allow any manager to approve

    if (salesOrder.status !== "PENDING_APPROVAL") {
      return NextResponse.json(
        { error: "This sales order is not pending approval" },
        { status: 400 }
      );
    }

    // Update sales order based on action
    const newStatus = action === "approve" ? "APPROVED" : "REJECTED";
    
    const updatedSalesOrder = await prisma.salesOrder.update({
      where: { id },
      data: {
        status: newStatus,
        approvedById: session.user.id,
        approvedAt: new Date(),
        approvalNote: note || (action === "approve" ? "Approved" : "Rejected"),
      },
      include: {
        project: true,
        requestedBy: {
          select: { id: true, name: true, email: true }
        },
        approvedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json(updatedSalesOrder);
  } catch (error) {
    console.error("Error approving/rejecting sales order:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      code: error.code
    });
    return NextResponse.json(
      { error: "Failed to process sales order approval", details: error.message },
      { status: 500 }
    );
  }
}
