import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        hourlyRate: true,
        avatarUrl: true,
        image: true,
        isApproved: true,
        approvedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name, role, hourlyRate, avatarUrl } = await req.json();

    // Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!role || !["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "SALES", "FINANCE"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Check if user exists and get current data
    const existingUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        role: true, 
        isApproved: true,
        password: true // Check if this is a credentials-based user
      }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData = {
      name: name.trim(),
      role,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
      avatarUrl: avatarUrl && avatarUrl.trim() !== "" ? avatarUrl.trim() : null,
    };

    // If this is a new OAuth user setting their role for the first time
    // (role was null and isApproved is false), keep isApproved as false
    // ALL roles require admin approval for OAuth users
    if (!existingUser.role && !existingUser.isApproved && !existingUser.password) {
      // OAuth user setting role for first time - requires admin approval
      // Keep isApproved as false for all roles
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        hourlyRate: true,
        avatarUrl: true,
        image: true,
        isApproved: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Profile updated successfully",
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
