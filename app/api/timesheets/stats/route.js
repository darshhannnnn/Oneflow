import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const userRole = session.user.role;

  try {
    let timesheets;

    // Admin can see all timesheets
    if (userRole === 'ADMIN') {
      timesheets = await prisma.timesheet.findMany({
        select: {
          hours: true,
          isBillable: true,
        },
      });
    } else {
      // For other users, get timesheets from their projects or their own timesheets
      const userProjects = await prisma.project.findMany({
        where: {
          OR: [
            { managerId: userId },
            { members: { some: { userId: userId, isActive: true } } },
          ],
        },
        select: {
          id: true,
        },
      });

      const projectIds = userProjects.map(p => p.id);

      timesheets = await prisma.timesheet.findMany({
        where: {
          OR: [
            { userId: userId }, // User's own timesheets
            {
              task: {
                projectId: {
                  in: projectIds,
                },
              },
            },
          ],
        },
        select: {
          hours: true,
          isBillable: true,
        },
      });
    }

    const totalHours = timesheets.reduce((acc, ts) => acc + parseFloat(ts.hours), 0);
    const billableHours = timesheets
      .filter(ts => ts.isBillable)
      .reduce((acc, ts) => acc + parseFloat(ts.hours), 0);
    const nonBillableHours = totalHours - billableHours;

    return NextResponse.json({
      totalHours: totalHours.toFixed(2),
      billableHours: billableHours.toFixed(2),
      nonBillableHours: nonBillableHours.toFixed(2),
    });
  } catch (error) {
    console.error('Error fetching timesheet stats:', error);
    return NextResponse.json({ error: 'Failed to fetch timesheet stats' }, { status: 500 });
  }
}
