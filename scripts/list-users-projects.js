/**
 * Script to list all users and projects
 * Usage: node scripts/list-users-projects.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsersAndProjects() {
  try {
    console.log('\n📋 USERS:\n');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (users.length === 0) {
      console.log('No users found.');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
        console.log(`   Role: ${user.role}`);
        console.log(`   ID: ${user.id}`);
        console.log('');
      });
    }

    console.log('\n📁 PROJECTS:\n');
    const projects = await prisma.project.findMany({
      include: {
        manager: {
          select: {
            name: true,
            email: true,
          },
        },
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            assigneeId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (projects.length === 0) {
      console.log('No projects found.');
    } else {
      projects.forEach((project, index) => {
        console.log(`${index + 1}. ${project.name}`);
        console.log(`   Status: ${project.status}`);
        console.log(`   Manager: ${project.manager?.name || 'None'}`);
        console.log(`   Members: ${project.members.length}`);
        if (project.members.length > 0) {
          project.members.forEach(member => {
            console.log(`     - ${member.user.name} (${member.user.email})`);
          });
        }
        console.log(`   Tasks: ${project.tasks.length}`);
        if (project.tasks.length > 0) {
          project.tasks.forEach(task => {
            console.log(`     - ${task.title}`);
          });
        }
        console.log(`   ID: ${project.id}`);
        console.log('');
      });
    }

    console.log('\n✅ Done!\n');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsersAndProjects();
