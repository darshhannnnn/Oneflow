import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(req) {
  try {
    const { email, password, name, role } = await req.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // All users require admin approval regardless of role
    const isAutoApproved = false;

    // Create user with default role
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role: role || "TEAM_MEMBER", // Default role
        isApproved: isAutoApproved, // All users need approval
        approvedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isApproved: true,
        createdAt: true,
      }
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user,
        needsApproval: true, // Always needs approval
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
