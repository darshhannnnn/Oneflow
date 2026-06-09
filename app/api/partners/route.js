import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

/**
 * GET /api/partners
 * Get all partners
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
    const type = searchParams.get('type'); // CUSTOMER, VENDOR, BOTH
    
    let whereClause = {};
    
    if (type && type !== 'all') {
      whereClause.type = type.toUpperCase();
    }
    
    const partners = await prisma.partner.findMany({
      where: whereClause,
      orderBy: {
        name: 'asc',
      },
    });
    
    return NextResponse.json(partners);
  } catch (error) {
    console.error('Error fetching partners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch partners' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/partners
 * Create a new partner
 */
export async function POST(req) {
  const authResult = await requirePermission(req, 'salesOrders', 'create');
  
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  
  try {
    const body = await req.json();
    const {
      name,
      type,
      contactName,
      email,
      phone,
      address,
    } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Partner name is required' },
        { status: 400 }
      );
    }
    
    const partner = await prisma.partner.create({
      data: {
        name,
        type: type || 'CUSTOMER',
        contactName,
        email,
        phone,
        address,
      },
    });
    
    return NextResponse.json(partner, { status: 201 });
  } catch (error) {
    console.error('Error creating partner:', error);
    return NextResponse.json(
      { error: 'Failed to create partner' },
      { status: 500 }
    );
  }
}
