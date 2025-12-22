import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    const kits = await prisma.kit.count();
    const suppliers = await prisma.supplier.count();
    const racks = await prisma.rack.count();
    const parts = await prisma.part.count();
    
    console.log('=== Backend Database Contents ===');
    console.log(`Kits: ${kits}`);
    console.log(`Suppliers: ${suppliers}`);
    console.log(`Racks: ${racks}`);
    console.log(`Parts: ${parts}`);
    
    // Sample data
    if (suppliers > 0) {
      const sampleSuppliers = await prisma.supplier.findMany({ take: 3 });
      console.log('\nSample Suppliers:');
      sampleSuppliers.forEach(s => console.log(`  - ${s.name} (${s.code})`));
    }
    
    if (kits > 0) {
      const sampleKits = await prisma.kit.findMany({ take: 3 });
      console.log('\nSample Kits:');
      sampleKits.forEach(k => console.log(`  - ${k.name} (${k.kitNo})`));
    }
    
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();

