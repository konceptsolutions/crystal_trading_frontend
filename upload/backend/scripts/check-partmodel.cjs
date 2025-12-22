const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const count = await prisma.partModel.count();
    console.log('partModel count:', count);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('check-partmodel error:', e);
  process.exit(1);
});


