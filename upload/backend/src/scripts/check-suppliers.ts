import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSuppliers() {
  try {
    const count = await prisma.supplier.count();
    console.log('Total suppliers in database:', count);
    
    const suppliers = await prisma.supplier.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
    
    console.log('\nSample suppliers:');
    suppliers.forEach(s => {
      console.log(`  - ${s.code}: ${s.name} (Status: ${s.status})`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuppliers();

