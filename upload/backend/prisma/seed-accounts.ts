import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Accounts Management System...');

  // Create COA Groups (using findFirstOrCreate pattern)
  const assetsGroup = await prisma.coaGroup.findFirst({
    where: { code: '1000' },
  }) || await prisma.coaGroup.create({
    data: {
      name: 'Assets',
      code: '1000',
      parent: 'Assets',
      isActive: true,
    },
  });

  const liabilitiesGroup = await prisma.coaGroup.findFirst({
    where: { code: '2000' },
  }) || await prisma.coaGroup.create({
    data: {
      name: 'Liabilities',
      code: '2000',
      parent: 'Liabilities',
      isActive: true,
    },
  });

  const capitalGroup = await prisma.coaGroup.findFirst({
    where: { code: '3000' },
  }) || await prisma.coaGroup.create({
    data: {
      name: 'Capital',
      code: '3000',
      parent: 'Capital',
      isActive: true,
    },
  });

  const revenuesGroup = await prisma.coaGroup.findFirst({
    where: { code: '4000' },
  }) || await prisma.coaGroup.create({
    data: {
      name: 'Revenues',
      code: '4000',
      parent: 'Revenues',
      isActive: true,
    },
  });

  const expensesGroup = await prisma.coaGroup.findFirst({
    where: { code: '5000' },
  }) || await prisma.coaGroup.create({
    data: {
      name: 'Expenses',
      code: '5000',
      parent: 'Expenses',
      isActive: true,
    },
  });

  const costGroup = await prisma.coaGroup.findFirst({
    where: { code: '6000' },
  }) || await prisma.coaGroup.create({
    data: {
      name: 'Cost',
      code: '6000',
      parent: 'Cost',
      isActive: true,
    },
  });

  console.log('✅ COA Groups created');

  // Create COA Sub-Groups for Assets
  const cashSubGroup = await prisma.coaSubGroup.findFirst({
    where: { code: '1001', coaGroupId: assetsGroup.id },
  }) || await prisma.coaSubGroup.create({
    data: {
      coaGroupId: assetsGroup.id,
      name: 'Cash',
      code: '1001',
      type: 'cash',
      isActive: true,
    },
  });

  const bankSubGroup = await prisma.coaSubGroup.findFirst({
    where: { code: '1002', coaGroupId: assetsGroup.id },
  }) || await prisma.coaSubGroup.create({
    data: {
      coaGroupId: assetsGroup.id,
      name: 'Bank',
      code: '1002',
      type: 'bank',
      isActive: true,
    },
  });

  const inventorySubGroup = await prisma.coaSubGroup.findFirst({
    where: { code: '1003', coaGroupId: assetsGroup.id },
  }) || await prisma.coaSubGroup.create({
    data: {
      coaGroupId: assetsGroup.id,
      name: 'Inventory',
      code: '1003',
      type: 'inventory',
      isActive: true,
    },
  });

  // Create COA Sub-Groups for Liabilities
  const accountsPayableSubGroup = await prisma.coaSubGroup.findFirst({
    where: { code: '2001', coaGroupId: liabilitiesGroup.id },
  }) || await prisma.coaSubGroup.create({
    data: {
      coaGroupId: liabilitiesGroup.id,
      name: 'Accounts Payable',
      code: '2001',
      isActive: true,
    },
  });

  // Create COA Sub-Groups for Capital
  const capitalSubGroup = await prisma.coaSubGroup.findFirst({
    where: { code: '3001', coaGroupId: capitalGroup.id },
  }) || await prisma.coaSubGroup.create({
    data: {
      coaGroupId: capitalGroup.id,
      name: 'Capital',
      code: '3001',
      isActive: true,
    },
  });

  // Create COA Sub-Groups for Revenues
  const salesSubGroup = await prisma.coaSubGroup.findFirst({
    where: { code: '4001', coaGroupId: revenuesGroup.id },
  }) || await prisma.coaSubGroup.create({
    data: {
      coaGroupId: revenuesGroup.id,
      name: 'Sales',
      code: '4001',
      isActive: true,
    },
  });

  // Create COA Sub-Groups for Expenses
  const operatingExpensesSubGroup = await prisma.coaSubGroup.findFirst({
    where: { code: '5001', coaGroupId: expensesGroup.id },
  }) || await prisma.coaSubGroup.create({
    data: {
      coaGroupId: expensesGroup.id,
      name: 'Operating Expenses',
      code: '5001',
      isActive: true,
    },
  });

  // Create COA Sub-Groups for Cost
  const costOfGoodsSoldSubGroup = await prisma.coaSubGroup.findFirst({
    where: { code: '6001', coaGroupId: costGroup.id },
  }) || await prisma.coaSubGroup.create({
    data: {
      coaGroupId: costGroup.id,
      name: 'Cost of Goods Sold',
      code: '6001',
      isActive: true,
    },
  });

  console.log('✅ COA Sub-Groups created');

  // Create default accounts
  const mainCashAccount = await prisma.coaAccount.findFirst({
    where: { code: '1001-001' },
  }) || await prisma.coaAccount.create({
    data: {
      name: 'Main Cash Account',
      code: '1001-001',
      coaGroupId: assetsGroup.id,
      coaSubGroupId: cashSubGroup.id,
      isActive: true,
      isDefault: true,
    },
  });

  const mainBankAccount = await prisma.coaAccount.findFirst({
    where: { code: '1002-001' },
  }) || await prisma.coaAccount.create({
    data: {
      name: 'Main Bank Account',
      code: '1002-001',
      coaGroupId: assetsGroup.id,
      coaSubGroupId: bankSubGroup.id,
      isActive: true,
      isDefault: true,
    },
  });

  const inventoryAccount = await prisma.coaAccount.findFirst({
    where: { code: '1003-001' },
  }) || await prisma.coaAccount.create({
    data: {
      name: 'Inventory Account',
      code: '1003-001',
      coaGroupId: assetsGroup.id,
      coaSubGroupId: inventorySubGroup.id,
      isActive: true,
    },
  });

  const salesAccount = await prisma.coaAccount.findFirst({
    where: { code: '4001-001' },
  }) || await prisma.coaAccount.create({
    data: {
      name: 'Sales Revenue',
      code: '4001-001',
      coaGroupId: revenuesGroup.id,
      coaSubGroupId: salesSubGroup.id,
      isActive: true,
    },
  });

  console.log('✅ Default COA Accounts created');

  // Create Voucher Types
  const voucherTypes = [
    { name: 'Receipt Voucher', code: 'RV' },
    { name: 'Payment Voucher', code: 'PV' },
    { name: 'Purchase Voucher', code: 'PV' },
    { name: 'Sales Voucher', code: 'SV' },
    { name: 'Contra Voucher', code: 'CV' },
    { name: 'Journal Voucher', code: 'JV' },
    { name: 'Extended Journal Voucher', code: 'EJV' },
  ];

  for (const voucherType of voucherTypes) {
    await prisma.voucherType.findFirst({
      where: { code: voucherType.code },
    }) || await prisma.voucherType.create({
      data: {
        name: voucherType.name,
        code: voucherType.code,
      },
    });
  }

  console.log('✅ Voucher Types created');
  console.log('🎉 Accounts Management System seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

