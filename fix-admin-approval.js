// =====================================================
// FIX ADMIN USER APPROVAL
// =====================================================
// This script approves all admin users so they can login

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdminApproval() {
  console.log('\n==========================================');
  console.log('  Fix Admin User Approval');
  console.log('==========================================\n');

  try {
    // Get all admin users
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        isApproved: true,
      },
    });

    console.log(`Found ${adminUsers.length} admin user(s)\n`);

    if (adminUsers.length === 0) {
      console.log('✗ No admin users found!\n');
      console.log('Please create an admin user first.\n');
      return;
    }

    // Show admin users
    console.log('Admin users:');
    adminUsers.forEach((user, index) => {
      const status = user.isApproved ? '✓ Approved' : '✗ Not Approved';
      console.log(`${index + 1}. ${user.email} (${user.name || 'No name'}) - ${status}`);
    });

    const unapprovedAdmins = adminUsers.filter(u => !u.isApproved);

    if (unapprovedAdmins.length === 0) {
      console.log('\n✓ All admin users are already approved!\n');
      return;
    }

    console.log(`\nApproving ${unapprovedAdmins.length} admin user(s)...\n`);

    // Approve all admin users
    const result = await prisma.user.updateMany({
      where: { 
        role: 'ADMIN',
        isApproved: false 
      },
      data: {
        isApproved: true,
        approvedAt: new Date(),
      },
    });

    console.log('==========================================');
    console.log(`✓ SUCCESS! Approved ${result.count} admin user(s)`);
    console.log('==========================================\n');

    console.log('Next steps:');
    console.log('1. Admin users can now login');
    console.log('2. Logout and login again if already logged in');
    console.log('3. You should now have full access\n');

  } catch (error) {
    console.error('\n✗ Error fixing admin approval:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixAdminApproval();
