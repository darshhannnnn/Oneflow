import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Update a record
export async function PATCH(req, context) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const params = await context.params;
    const { table, id } = params;
    const body = await req.json();

    // Validate table name
    const allowedTables = [
      "User",
      "Project",
      "Task",
      "Timesheet",
      "Expense",
      "SalesOrder",
      "CustomerInvoice",
      "PurchaseOrder",
      "VendorBill",
      "Partner",
      "Product",
      "Payment",
    ];

    if (!allowedTables.includes(table)) {
      return NextResponse.json({ error: "Invalid table name" }, { status: 400 });
    }

    // Get table model
    const model = prisma[table.charAt(0).toLowerCase() + table.slice(1)];

    if (!model) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    // Clean data - remove id, createdAt, updatedAt and empty strings
    const cleanData = {};
    for (const [key, value] of Object.entries(body)) {
      if (
        key !== "id" &&
        key !== "createdAt" &&
        key !== "updatedAt" &&
        value !== "" &&
        value !== null &&
        value !== undefined
      ) {
        // Try to parse numbers
        if (!isNaN(value) && value !== "") {
          cleanData[key] = parseFloat(value);
        } else if (value === "true" || value === "false") {
          cleanData[key] = value === "true";
        } else {
          cleanData[key] = value;
        }
      }
    }

    // Update record
    const record = await model.update({
      where: { id },
      data: cleanData,
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error("Database PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update record" },
      { status: 500 }
    );
  }
}

// Delete a record
export async function DELETE(req, context) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const params = await context.params;
    const { table, id } = params;

    console.log(`DELETE request - Table: ${table}, ID: ${id}`);

    // Validate table name
    const allowedTables = [
      "User",
      "Project",
      "Task",
      "Timesheet",
      "Expense",
      "SalesOrder",
      "CustomerInvoice",
      "PurchaseOrder",
      "VendorBill",
      "Partner",
      "Product",
      "Payment",
    ];

    if (!allowedTables.includes(table)) {
      return NextResponse.json({ error: "Invalid table name" }, { status: 400 });
    }

    // Get table model
    const modelName = table.charAt(0).toLowerCase() + table.slice(1);
    const model = prisma[modelName];

    console.log(`Model name: ${modelName}, Model exists: ${!!model}`);

    if (!model) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    // Check if record exists before attempting delete
    const existingRecord = await model.findUnique({
      where: { id },
    });

    console.log(`Record found: ${!!existingRecord}`);

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Record not found. It may have been already deleted." },
        { status: 404 }
      );
    }

    // Delete record
    await model.delete({
      where: { id },
    });

    console.log(`Record deleted successfully - ID: ${id}`);

    return NextResponse.json({ message: "Record deleted successfully" });
  } catch (error) {
    console.error("Database DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete record" },
      { status: 500 }
    );
  }
}
