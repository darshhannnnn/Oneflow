// =====================================================
// APPROVE ALL EXISTING USERS
// =====================================================
// Run this script to approve all existing users after
// implementing the approval system

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function approveExistingUsers() {
  console.log('\n==========================================');
  console.log('  Approve Existing Users');
  console.log('==========================================\n');

  try {
    // Get all unapproved users
    const unapprovedUsers = await prisma.user.findMany({
      where: { isApproved: false },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    console.log(`Found ${unapprovedUsers.length} unapproved users\n`);

    if (unapprovedUsers.length === 0) {
      console.log('✓ All users are already approved!\n');
      return;
    }

    // Show users to be approved
    console.log('Users to be approved:');
    unapprovedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.name || 'No name'}) - Role: ${user.role || 'No role'}`);
    });

    console.log('\nApproving all users...\n');

    // Approve all users
    const result = await prisma.user.updateMany({
      where: { isApproved: false },
      data: {
        isApproved: true,
        approvedAt: new Date(),
      },
    });

    console.log('==========================================');
    console.log(`✓ SUCCESS! Approved ${result.count} users`);
    console.log('==========================================\n');

    console.log('Next steps:');
    console.log('1. Users can now login and access the system');
    console.log('2. Make sure to assign roles to users without roles');
    console.log('3. Users may need to logout and login again\n');

  } catch (error) {
    console.error('\n✗ Error approving users:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
approveExistingUsers();
