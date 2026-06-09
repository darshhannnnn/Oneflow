import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * POST /api/seed/vendors
 * Seed mock vendors for testing
 */
export async function POST(req) {
  try {
    const mockVendors = [
      {
        name: "Professional Photography Services",
        type: "VENDOR",
        contactName: "John Photographer",
        email: "john@photostudio.com",
        phone: "+91 98765 43210",
        address: "123 Camera Street, Mumbai"
      },
      {
        name: "Elite Catering Solutions",
        type: "VENDOR",
        contactName: "Sarah Chef",
        email: "sarah@elitecatering.com",
        phone: "+91 98765 43211",
        address: "456 Food Plaza, Delhi"
      },
      {
        name: "Premium Sound & Lighting",
        type: "VENDOR",
        contactName: "Mike Audio",
        email: "mike@soundpro.com",
        phone: "+91 98765 43212",
        address: "789 Tech Park, Bangalore"
      },
      {
        name: "Luxury Venue Rentals",
        type: "VENDOR",
        contactName: "Emma Venues",
        email: "emma@luxuryvenues.com",
        phone: "+91 98765 43213",
        address: "321 Grand Avenue, Pune"
      },
      {
        name: "Creative Decorators",
        type: "VENDOR",
        contactName: "David Decor",
        email: "david@creativedeco.com",
        phone: "+91 98765 43214",
        address: "654 Design Street, Hyderabad"
      },
      {
        name: "Transport & Logistics Co",
        type: "VENDOR",
        contactName: "Lisa Transport",
        email: "lisa@transportco.com",
        phone: "+91 98765 43215",
        address: "987 Highway Road, Chennai"
      }
    ];

    const createdVendors = [];
    
    for (const vendor of mockVendors) {
      // Check if vendor already exists
      const existing = await prisma.partner.findFirst({
        where: { name: vendor.name }
      });
      
      if (!existing) {
        const created = await prisma.partner.create({
          data: vendor
        });
        createdVendors.push(created);
      }
    }

    return NextResponse.json({
      message: `Created ${createdVendors.length} mock vendors`,
      vendors: createdVendors
    }, { status: 201 });
  } catch (error) {
    console.error('Error seeding vendors:', error);
    return NextResponse.json(
      { error: 'Failed to seed vendors', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/seed/vendors
 * Get seeding status
 */
export async function GET() {
  try {
    const vendorCount = await prisma.partner.count({
      where: { type: "VENDOR" }
    });
    
    return NextResponse.json({
      message: "Vendor seed endpoint",
      currentVendorCount: vendorCount,
      note: "POST to this endpoint to seed mock vendors"
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check vendors' },
      { status: 500 }
    );
  }
}
