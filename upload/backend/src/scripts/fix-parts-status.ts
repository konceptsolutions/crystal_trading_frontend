import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPartsStatus() {
  console.log('🔍 Checking parts status...\n');

  try {
    const total = await prisma.part.count();
    const active = await prisma.part.count({ where: { status: 'A' } });
    const inactive = await prisma.part.count({ where: { status: 'N' } });
    const otherStatus = await prisma.part.count({ 
      where: { 
        status: { 
          notIn: ['A', 'N']
        } 
      } 
    });

    console.log('📊 Current Status:');
    console.log(`   Total parts: ${total}`);
    console.log(`   Active (A): ${active}`);
    console.log(`   Inactive (N): ${inactive}`);
    console.log(`   Other status: ${otherStatus}\n`);

    // Update all parts to Active status
    console.log('🔧 Updating all parts to Active status...');
    const result = await prisma.part.updateMany({
      where: {
        status: { not: 'A' }
      },
      data: {
        status: 'A'
      }
    });

    console.log(`✅ Updated ${result.count} parts to Active status\n`);

    // Verify
    const newActive = await prisma.part.count({ where: { status: 'A' } });
    console.log('📊 Updated Status:');
    console.log(`   Total parts: ${total}`);
    console.log(`   Active (A): ${newActive}`);
    console.log(`   ✅ All parts are now Active!`);

  } catch (error) {
    console.error('❌ Error fixing parts status:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
if (require.main === module) {
  fixPartsStatus()
    .then(() => {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

export { fixPartsStatus };

