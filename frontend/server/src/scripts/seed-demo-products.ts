import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const demoProducts = [
  {
    partNo: 'ENG-001-2024',
    masterPartNo: 'MP-ENG-001',
    brand: 'Toyota',
    description: 'Engine Oil Filter - Premium Quality',
    mainCategory: 'Engine Parts',
    subCategory: 'Filters',
    application: 'Toyota Camry 2020-2024',
    hsCode: '8421.23.00',
    uom: 'PCS',
    weight: 0.85,
    reOrderLevel: 50,
    cost: 12.50,
    priceA: 18.75,
    priceB: 16.25,
    priceM: 15.00,
    rackNo: 'A-12-05',
    origin: 'Japan',
    grade: 'A',
    status: 'A',
    smc: 'SMC-ENG-001',
    size: 'Standard',
    remarks: 'High quality OEM replacement filter. Compatible with multiple Toyota models.',
    models: [
      { modelNo: 'CAMRY-2020', qtyUsed: 1, tab: 'P1' },
      { modelNo: 'CAMRY-2021', qtyUsed: 1, tab: 'P1' },
      { modelNo: 'CAMRY-2022', qtyUsed: 1, tab: 'P1' },
      { modelNo: 'COROLLA-2020', qtyUsed: 1, tab: 'P2' },
    ],
    stock: { quantity: 125, location: 'Warehouse A' },
  },
  {
    partNo: 'BRAKE-002-2024',
    masterPartNo: 'MP-BRK-002',
    brand: 'Brembo',
    description: 'Front Brake Pad Set - Ceramic',
    mainCategory: 'Brake System',
    subCategory: 'Brake Pads',
    application: 'Honda Accord 2018-2023',
    hsCode: '8708.30.00',
    uom: 'SET',
    weight: 2.5,
    reOrderLevel: 30,
    cost: 45.00,
    priceA: 68.50,
    priceB: 59.75,
    priceM: 55.00,
    rackNo: 'B-08-12',
    origin: 'Italy',
    grade: 'A',
    status: 'A',
    smc: 'SMC-BRK-002',
    size: 'Front Set',
    remarks: 'Premium ceramic brake pads with low noise and dust. Excellent stopping power.',
    models: [
      { modelNo: 'ACCORD-2018', qtyUsed: 1, tab: 'P1' },
      { modelNo: 'ACCORD-2019', qtyUsed: 1, tab: 'P1' },
      { modelNo: 'ACCORD-2020', qtyUsed: 1, tab: 'P1' },
      { modelNo: 'CIVIC-2019', qtyUsed: 1, tab: 'P2' },
    ],
    stock: { quantity: 78, location: 'Warehouse B' },
  },
  {
    partNo: 'BATT-003-2024',
    masterPartNo: 'MP-BAT-003',
    brand: 'Exide',
    description: 'Car Battery 12V 60Ah - Maintenance Free',
    mainCategory: 'Electrical',
    subCategory: 'Batteries',
    application: 'Universal - Most Sedans',
    hsCode: '8507.20.00',
    uom: 'PCS',
    weight: 18.5,
    reOrderLevel: 20,
    cost: 85.00,
    priceA: 125.00,
    priceB: 110.00,
    priceM: 105.00,
    rackNo: 'C-15-03',
    origin: 'India',
    grade: 'B',
    status: 'A',
    smc: 'SMC-BAT-003',
    size: 'Group 24',
    remarks: 'Maintenance-free battery with 3-year warranty. High CCA rating for reliable starts.',
    models: [
      { modelNo: 'UNIVERSAL-24', qtyUsed: 1, tab: 'P1' },
      { modelNo: 'SEDAN-STD', qtyUsed: 1, tab: 'P1' },
    ],
    stock: { quantity: 42, location: 'Warehouse C' },
  },
  {
    partNo: 'TIRE-004-2024',
    masterPartNo: 'MP-TIR-004',
    brand: 'Michelin',
    description: 'All-Season Tire 205/55R16 - 91H',
    mainCategory: 'Tires & Wheels',
    subCategory: 'Tires',
    application: 'Sedan - Standard Size',
    hsCode: '4011.10.00',
    uom: 'PCS',
    weight: 9.2,
    reOrderLevel: 40,
    cost: 95.00,
    priceA: 145.00,
    priceB: 130.00,
    priceM: 120.00,
    rackNo: 'D-22-08',
    origin: 'France',
    grade: 'A',
    status: 'A',
    smc: 'SMC-TIR-004',
    size: '205/55R16',
    remarks: 'Premium all-season tire with excellent wet and dry traction. 60,000-mile warranty.',
    models: [
      { modelNo: 'SEDAN-205-55', qtyUsed: 4, tab: 'P1' },
      { modelNo: 'COMPACT-205-55', qtyUsed: 4, tab: 'P1' },
    ],
    stock: { quantity: 156, location: 'Warehouse D' },
  },
  {
    partNo: 'AIR-005-2024',
    masterPartNo: 'MP-AIR-005',
    brand: 'Mann Filter',
    description: 'Cabin Air Filter - Activated Carbon',
    mainCategory: 'HVAC',
    subCategory: 'Air Filters',
    application: 'Nissan Altima 2019-2024',
    hsCode: '8421.23.00',
    uom: 'PCS',
    weight: 0.35,
    reOrderLevel: 25,
    cost: 18.00,
    priceA: 28.50,
    priceB: 24.75,
    priceM: 22.00,
    rackNo: 'A-10-15',
    origin: 'Germany',
    grade: 'A',
    status: 'A',
    smc: 'SMC-AIR-005',
    size: 'Standard',
    remarks: 'Activated carbon filter removes odors, pollen, and pollutants. Easy installation.',
    models: [
      { modelNo: 'ALTIMA-2019', qtyUsed: 1, tab: 'P1' },
      { modelNo: 'ALTIMA-2020', qtyUsed: 1, tab: 'P1' },
      { modelNo: 'ALTIMA-2021', qtyUsed: 1, tab: 'P1' },
      { modelNo: 'SENTRA-2020', qtyUsed: 1, tab: 'P2' },
    ],
    stock: { quantity: 89, location: 'Warehouse A' },
  },
];

async function seedDemoProducts() {
  try {
    console.log('🌱 Starting to seed demo products...\n');

    // Check if products already exist
    const existingCount = await prisma.part.count();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing products in database.`);
      console.log('   Skipping seed to avoid duplicates.\n');
      console.log('   To re-seed, please delete existing products first.');
      return;
    }

    for (const product of demoProducts) {
      const { models, stock, ...partData } = product;

      // Create the part
      const part = await prisma.part.create({
        data: partData,
      });

      console.log(`✅ Created part: ${part.partNo} - ${part.description}`);

      // Create models
      if (models && models.length > 0) {
        for (const model of models) {
          await prisma.partModel.create({
            data: {
              partId: part.id,
              modelNo: model.modelNo,
              qtyUsed: model.qtyUsed,
              tab: model.tab,
            },
          });
        }
        console.log(`   └─ Added ${models.length} model(s)`);
      }

      // Create stock
      if (stock) {
        await prisma.stock.create({
          data: {
            partId: part.id,
            quantity: stock.quantity,
            location: stock.location,
          },
        });
        console.log(`   └─ Stock: ${stock.quantity} units at ${stock.location}`);
      }

      console.log('');
    }

    console.log('✨ Successfully seeded 5 demo products with complete details!');
    console.log('\n📋 Summary:');
    console.log(`   - Total Products: ${demoProducts.length}`);
    console.log(`   - Total Models: ${demoProducts.reduce((sum, p) => sum + (p.models?.length || 0), 0)}`);
    console.log(`   - Total Stock Items: ${demoProducts.length}`);
  } catch (error) {
    console.error('❌ Error seeding demo products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedDemoProducts()
  .then(() => {
    console.log('\n✅ Seed completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  });

