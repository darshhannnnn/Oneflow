import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Get all records from a table
export async function GET(req, context) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const params = await context.params;
    const { table } = params;

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
      "Partner",
      "Product",
    ];

    if (!allowedTables.includes(table)) {
      return NextResponse.json({ error: "Invalid table name" }, { status: 400 });
    }

    // Get table model
    const model = prisma[table.charAt(0).toLowerCase() + table.slice(1)];

    if (!model) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    // Fetch records
    const records = await model.findMany({
      take: 100, // Limit to 100 records for performance
      orderBy: { createdAt: "desc" },
    });

    // Get column names from first record
    const columns = records.length > 0 ? Object.keys(records[0]) : [];

    return NextResponse.json({ records, columns });
  } catch (error) {
    console.error("Database GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch records" },
      { status: 500 }
    );
  }
}

// Create a new record
export async function POST(req, context) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const params = await context.params;
    const { table } = params;
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
      "Partner",
      "Product",
    ];

    if (!allowedTables.includes(table)) {
      return NextResponse.json({ error: "Invalid table name" }, { status: 400 });
    }

    // Get table model
    const model = prisma[table.charAt(0).toLowerCase() + table.slice(1)];

    if (!model) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    // Clean data - remove empty strings and convert types
    const cleanData = {};
    for (const [key, value] of Object.entries(body)) {
      if (value !== "" && value !== null && value !== undefined) {
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

    // Create record
    const record = await model.create({
      data: cleanData,
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error("Database POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create record" },
      { status: 500 }
    );
  }
}
