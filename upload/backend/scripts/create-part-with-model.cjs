const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const ts = Date.now();
  const partNo = `TEST-PART-${ts}`;

  try {
    const part = await prisma.part.create({
      data: {
        partNo,
        masterPartNo: `MASTER-${ts}`,
        status: 'A',
      },
    });

    await prisma.stock.upsert({
      where: { partId: part.id },
      update: {},
      create: { partId: part.id, quantity: 0 },
    });

    const model = await prisma.partModel.create({
      data: {
        partId: part.id,
        modelNo: `MODEL-${ts}`,
        qtyUsed: 1,
        tab: 'P1',
      },
    });

    console.log('created part:', { id: part.id, partNo: part.partNo });
    console.log('created model:', { id: model.id, modelNo: model.modelNo, partId: model.partId });

    const createManyResult = await prisma.partModel.createMany({
      data: [
        { partId: part.id, modelNo: `MODEL-MANY-1-${ts}`, qtyUsed: 2, tab: 'P1' },
        { partId: part.id, modelNo: `MODEL-MANY-2-${ts}`, qtyUsed: 3, tab: 'P2' },
      ],
    });
    console.log('createMany result:', createManyResult);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('create-part-with-model error:', e);
  process.exit(1);
});


