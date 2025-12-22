import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRacks() {
  try {
    const racks = await prisma.rack.findMany({
      include: {
        store: {
          include: {
            storeType: true,
          },
        },
        _count: {
          select: { shelves: true },
        },
      },
      take: 5,
    });
    
    console.log(`Found ${racks.length} racks in backend database:`);
    racks.forEach(r => {
      console.log(`  - ${r.rackNumber} (Store: ${r.store?.name || 'N/A'}, Status: ${r.status})`);
    });
  } catch (error: any) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkRacks();

