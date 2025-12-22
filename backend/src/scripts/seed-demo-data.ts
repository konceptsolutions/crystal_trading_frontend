import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper function to generate random number
const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper function to generate random date
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

async function main() {
  console.log('🌱 Starting demo data seeding...\n');

  try {
    // 1. Create Categories
    console.log('📁 Creating categories...');
    const mainCategories = [
      { name: 'Engine Parts', type: 'main' },
      { name: 'Transmission Parts', type: 'main' },
      { name: 'Brake System', type: 'main' },
      { name: 'Suspension', type: 'main' },
      { name: 'Electrical', type: 'main' },
    ];

    const createdCategories: any[] = [];
    for (const cat of mainCategories) {
      // Check if category exists
      let category = await prisma.category.findFirst({
        where: { name: cat.name, type: cat.type },
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: cat.name,
            type: cat.type,
            description: `${cat.name} category for automotive parts`,
            status: 'A',
          },
        });
      }
      createdCategories.push(category);
    }

    // Create subcategories
    const subCategories = [
      { name: 'Pistons', parentId: createdCategories[0].id },
      { name: 'Cylinder Heads', parentId: createdCategories[0].id },
      { name: 'Gaskets', parentId: createdCategories[0].id },
      { name: 'Clutch Plates', parentId: createdCategories[1].id },
      { name: 'Brake Pads', parentId: createdCategories[2].id },
      { name: 'Brake Discs', parentId: createdCategories[2].id },
    ];

    for (const subCat of subCategories) {
      const existing = await prisma.category.findFirst({
        where: { name: subCat.name, parentId: subCat.parentId },
      });

      if (!existing) {
        await prisma.category.create({
          data: {
            name: subCat.name,
            type: 'sub',
            parentId: subCat.parentId,
            description: `${subCat.name} subcategory`,
            status: 'A',
          },
        });
      }
    }
    console.log('✓ Categories created\n');

    // 2. Create Brands
    console.log('🏷️  Creating brands...');
    const brands = [
      'Toyota Genuine',
      'Honda OEM',
      'Bosch',
      'Delphi',
      'Denso',
      'NGK',
      'Mann Filter',
      'Gates',
    ];

    const createdBrands: any[] = [];
    for (const brandName of brands) {
      const brand = await prisma.brand.upsert({
        where: { name: brandName },
        update: {},
        create: {
          name: brandName,
          status: 'A',
        },
      });
      createdBrands.push(brand);
    }
    console.log('✓ Brands created\n');

    // 3. Create Suppliers
    console.log('🏢 Creating suppliers...');
    const suppliers = [
      {
        code: 'SUP001',
        name: 'Auto Parts Distributors Ltd',
        email: 'contact@autopartsdist.com',
        phone: '+92-300-1234567',
        address: '123 Industrial Area',
        city: 'Karachi',
        state: 'Sindh',
        country: 'Pakistan',
        zipCode: '75000',
        contactPerson: 'Ahmed Khan',
        taxId: 'TAX-001-2024',
        paymentTerms: 'Net 30',
        notes: 'Primary supplier for engine parts',
      },
      {
        code: 'SUP002',
        name: 'Global Automotive Solutions',
        email: 'sales@globalauto.com',
        phone: '+92-321-9876543',
        address: '456 Commercial Street',
        city: 'Lahore',
        state: 'Punjab',
        country: 'Pakistan',
        zipCode: '54000',
        contactPerson: 'Sara Ali',
        taxId: 'TAX-002-2024',
        paymentTerms: 'Net 15',
        notes: 'Specializes in electrical components',
      },
      {
        code: 'SUP003',
        name: 'Premium Parts Co',
        email: 'info@premiumparts.pk',
        phone: '+92-333-5557777',
        address: '789 Trade Center',
        city: 'Islamabad',
        state: 'Punjab',
        country: 'Pakistan',
        zipCode: '44000',
        contactPerson: 'Usman Malik',
        taxId: 'TAX-003-2024',
        paymentTerms: 'Cash on Delivery',
        notes: 'Fast delivery, quality products',
      },
    ];

    const createdSuppliers: any[] = [];
    for (const supplier of suppliers) {
      const sup = await prisma.supplier.upsert({
        where: { code: supplier.code },
        update: {},
        create: supplier,
      });
      createdSuppliers.push(sup);
    }
    console.log('✓ Suppliers created\n');

    // 4. Create Customers
    console.log('👥 Creating customers...');
    const customers = [
      {
        name: 'ABC Motors',
        email: 'orders@abcmotors.com',
        phone: '+92-300-1112222',
        address: '100 Main Road',
        cnic: '42101-1234567-8',
        openingBalance: 50000,
        creditLimit: 200000,
      },
      {
        name: 'City Auto Service',
        email: 'info@cityauto.pk',
        phone: '+92-321-3334444',
        address: '200 Service Lane',
        cnic: '42101-2345678-9',
        openingBalance: 25000,
        creditLimit: 100000,
      },
      {
        name: 'Express Car Care',
        email: 'contact@expresscare.com',
        phone: '+92-333-7778888',
        address: '300 Highway Road',
        cnic: '42101-3456789-0',
        openingBalance: 0,
        creditLimit: 150000,
      },
    ];

    const createdCustomers: any[] = [];
    for (const customer of customers) {
      let cust = await prisma.customer.findFirst({
        where: { name: customer.name },
      });

      if (!cust) {
        cust = await prisma.customer.create({
          data: {
            ...customer,
            status: 'A',
          },
        });
      }
      createdCustomers.push(cust);
    }
    console.log('✓ Customers created\n');

    // 5. Create Stores, Racks, Shelves
    console.log('🏪 Creating stores and storage...');
    let storeType = await prisma.storeType.findFirst({
      where: { name: 'Main Warehouse' },
    });

    if (!storeType) {
      storeType = await prisma.storeType.create({
        data: { name: 'Main Warehouse' },
      });
    }

    let store = await prisma.store.findFirst({
      where: { name: 'Main Store' },
    });

    if (!store) {
      store = await prisma.store.create({
        data: {
          name: 'Main Store',
          storeTypeId: storeType.id,
          description: 'Primary storage facility',
          status: 'A',
        },
      });
    }

    const racks: any[] = [];
    for (let i = 1; i <= 5; i++) {
      const rackNumber = `R${String(i).padStart(3, '0')}`;
      let rack = await prisma.rack.findFirst({
        where: { rackNumber, storeId: store.id },
      });

      if (!rack) {
        rack = await prisma.rack.create({
          data: {
            rackNumber,
            storeId: store.id,
            description: `Rack ${i} for parts storage`,
            status: 'A',
          },
        });
      }
      racks.push(rack);

      // Create shelves for each rack
      for (let j = 1; j <= 3; j++) {
        const shelfNumber = `S${String(j).padStart(2, '0')}`;
        const existingShelf = await prisma.shelf.findFirst({
          where: { shelfNumber, rackId: rack.id },
        });

        if (!existingShelf) {
          await prisma.shelf.create({
            data: {
              shelfNumber,
              rackId: rack.id,
              description: `Shelf ${j} in Rack ${i}`,
              status: 'A',
            },
          });
        }
      }
    }
    console.log('✓ Stores and storage created\n');

    // 6. Create 20 Parts with complete details
    console.log('🔧 Creating 20 parts/products...');
    const partsData = [
      {
        partNo: 'ENG-001',
        description: 'Engine Oil Filter - High Performance',
        brand: 'Mann Filter',
        mainCategory: 'Engine Parts',
        subCategory: 'Filters',
        application: 'All Toyota Models',
        hsCode: '8421.23.00',
        uom: 'PCS',
        weight: 0.5,
        reOrderLevel: 10,
        cost: 850,
        priceA: 1200,
        priceB: 1100,
        priceM: 1000,
        rackNo: 'R001',
        origin: 'Germany',
        grade: 'Premium',
        size: 'Standard',
        remarks: 'Genuine quality, long lasting',
      },
      {
        partNo: 'ENG-002',
        description: 'Spark Plug Set - Iridium',
        brand: 'NGK',
        mainCategory: 'Engine Parts',
        subCategory: 'Ignition',
        application: 'Honda Civic, Accord',
        hsCode: '8511.40.00',
        uom: 'SET',
        weight: 0.2,
        reOrderLevel: 15,
        cost: 2500,
        priceA: 3500,
        priceB: 3200,
        priceM: 3000,
        rackNo: 'R001',
        origin: 'Japan',
        grade: 'Premium',
        size: '14mm Thread',
        remarks: 'Iridium tip, 100k km warranty',
      },
      {
        partNo: 'ENG-003',
        description: 'Air Filter - Premium Quality',
        brand: 'Bosch',
        mainCategory: 'Engine Parts',
        subCategory: 'Filters',
        application: 'Universal Fit',
        hsCode: '8421.23.00',
        uom: 'PCS',
        weight: 0.3,
        reOrderLevel: 20,
        cost: 1200,
        priceA: 1800,
        priceB: 1650,
        priceM: 1500,
        rackNo: 'R001',
        origin: 'Germany',
        grade: 'Standard',
        size: 'Standard',
        remarks: 'High flow rate, washable',
      },
      {
        partNo: 'ENG-004',
        description: 'Timing Belt Kit - Complete',
        brand: 'Gates',
        mainCategory: 'Engine Parts',
        subCategory: 'Belts',
        application: 'Toyota Corolla 2000-2010',
        hsCode: '4010.39.00',
        uom: 'KIT',
        weight: 1.2,
        reOrderLevel: 5,
        cost: 4500,
        priceA: 6500,
        priceB: 6000,
        priceM: 5500,
        rackNo: 'R002',
        origin: 'USA',
        grade: 'Premium',
        size: '120 Teeth',
        remarks: 'Includes tensioner and idler',
      },
      {
        partNo: 'ENG-005',
        description: 'Radiator Cap - Pressure Release',
        brand: 'Toyota Genuine',
        mainCategory: 'Engine Parts',
        subCategory: 'Cooling',
        application: 'All Toyota Models',
        hsCode: '8414.90.00',
        uom: 'PCS',
        weight: 0.1,
        reOrderLevel: 25,
        cost: 450,
        priceA: 750,
        priceB: 650,
        priceM: 600,
        rackNo: 'R002',
        origin: 'Japan',
        grade: 'Genuine',
        size: 'Standard',
        remarks: 'OEM quality, exact fit',
      },
      {
        partNo: 'TRN-001',
        description: 'Clutch Disc - Heavy Duty',
        brand: 'Delphi',
        mainCategory: 'Transmission Parts',
        subCategory: 'Clutch',
        application: 'Manual Transmission',
        hsCode: '8708.99.00',
        uom: 'PCS',
        weight: 2.5,
        reOrderLevel: 8,
        cost: 8500,
        priceA: 12000,
        priceB: 11000,
        priceM: 10000,
        rackNo: 'R003',
        origin: 'UK',
        grade: 'Premium',
        size: '240mm',
        remarks: 'Ceramic material, long life',
      },
      {
        partNo: 'TRN-002',
        description: 'Transmission Fluid - ATF',
        brand: 'Toyota Genuine',
        mainCategory: 'Transmission Parts',
        subCategory: 'Fluids',
        application: 'Automatic Transmission',
        hsCode: '2710.19.00',
        uom: 'LTR',
        weight: 1.0,
        reOrderLevel: 30,
        cost: 1800,
        priceA: 2800,
        priceB: 2500,
        priceM: 2200,
        rackNo: 'R003',
        origin: 'Japan',
        grade: 'Genuine',
        size: '1 Liter',
        remarks: 'Dexron III compatible',
      },
      {
        partNo: 'BRK-001',
        description: 'Brake Pad Set - Front',
        brand: 'Bosch',
        mainCategory: 'Brake System',
        subCategory: 'Brake Pads',
        application: 'Sedan Models',
        hsCode: '8708.30.00',
        uom: 'SET',
        weight: 1.8,
        reOrderLevel: 12,
        cost: 3500,
        priceA: 5500,
        priceB: 5000,
        priceM: 4500,
        rackNo: 'R004',
        origin: 'Germany',
        grade: 'Premium',
        size: 'Standard',
        remarks: 'Low noise, low dust',
      },
      {
        partNo: 'BRK-002',
        description: 'Brake Disc - Ventilated',
        brand: 'Delphi',
        mainCategory: 'Brake System',
        subCategory: 'Brake Discs',
        application: 'Front Axle',
        hsCode: '8708.30.00',
        uom: 'PCS',
        weight: 8.5,
        reOrderLevel: 6,
        cost: 6500,
        priceA: 9500,
        priceB: 8500,
        priceM: 7500,
        rackNo: 'R004',
        origin: 'UK',
        grade: 'Premium',
        size: '280mm',
        remarks: 'Drilled and slotted, heat resistant',
      },
      {
        partNo: 'BRK-003',
        description: 'Brake Fluid - DOT 4',
        brand: 'Bosch',
        mainCategory: 'Brake System',
        subCategory: 'Fluids',
        application: 'All Vehicles',
        hsCode: '3819.00.00',
        uom: 'LTR',
        weight: 1.0,
        reOrderLevel: 20,
        cost: 1200,
        priceA: 2000,
        priceB: 1800,
        priceM: 1600,
        rackNo: 'R004',
        origin: 'Germany',
        grade: 'Standard',
        size: '1 Liter',
        remarks: 'High boiling point, prevents brake fade',
      },
      {
        partNo: 'SUS-001',
        description: 'Shock Absorber - Front',
        brand: 'Delphi',
        mainCategory: 'Suspension',
        subCategory: 'Shocks',
        application: 'Sedan Models',
        hsCode: '8708.80.00',
        uom: 'PCS',
        weight: 3.2,
        reOrderLevel: 8,
        cost: 5500,
        priceA: 8500,
        priceB: 7500,
        priceM: 6500,
        rackNo: 'R005',
        origin: 'UK',
        grade: 'Premium',
        size: 'Standard',
        remarks: 'Gas filled, adjustable damping',
      },
      {
        partNo: 'SUS-002',
        description: 'Coil Spring Set',
        brand: 'Delphi',
        mainCategory: 'Suspension',
        subCategory: 'Springs',
        application: 'Front Suspension',
        hsCode: '7320.20.00',
        uom: 'SET',
        weight: 5.5,
        reOrderLevel: 5,
        cost: 7500,
        priceA: 11000,
        priceB: 10000,
        priceM: 9000,
        rackNo: 'R005',
        origin: 'UK',
        grade: 'Premium',
        size: 'Standard',
        remarks: 'Heavy duty, corrosion resistant',
      },
      {
        partNo: 'ELC-001',
        description: 'Alternator - 90A',
        brand: 'Denso',
        mainCategory: 'Electrical',
        subCategory: 'Charging',
        application: 'Sedan Models',
        hsCode: '8511.40.00',
        uom: 'PCS',
        weight: 6.8,
        reOrderLevel: 4,
        cost: 15000,
        priceA: 22000,
        priceB: 20000,
        priceM: 18000,
        rackNo: 'R002',
        origin: 'Japan',
        grade: 'Genuine',
        size: '90 Ampere',
        remarks: 'OEM quality, reliable performance',
      },
      {
        partNo: 'ELC-002',
        description: 'Starter Motor - High Torque',
        brand: 'Denso',
        mainCategory: 'Electrical',
        subCategory: 'Starting',
        application: 'All Models',
        hsCode: '8511.40.00',
        uom: 'PCS',
        weight: 4.5,
        reOrderLevel: 4,
        cost: 12000,
        priceA: 18000,
        priceB: 16500,
        priceM: 15000,
        rackNo: 'R002',
        origin: 'Japan',
        grade: 'Genuine',
        size: 'Standard',
        remarks: 'Fast cranking, durable',
      },
      {
        partNo: 'ELC-003',
        description: 'Battery - 70Ah',
        brand: 'Bosch',
        mainCategory: 'Electrical',
        subCategory: 'Battery',
        application: 'Sedan/SUV',
        hsCode: '8507.20.00',
        uom: 'PCS',
        weight: 18.5,
        reOrderLevel: 6,
        cost: 18000,
        priceA: 28000,
        priceB: 25000,
        priceM: 22000,
        rackNo: 'R001',
        origin: 'Germany',
        grade: 'Premium',
        size: '70 Ah',
        remarks: 'Maintenance free, 2 year warranty',
      },
      {
        partNo: 'ENG-006',
        description: 'Fuel Filter - Inline',
        brand: 'Mann Filter',
        mainCategory: 'Engine Parts',
        subCategory: 'Filters',
        application: 'All Models',
        hsCode: '8421.23.00',
        uom: 'PCS',
        weight: 0.4,
        reOrderLevel: 15,
        cost: 950,
        priceA: 1500,
        priceB: 1350,
        priceM: 1200,
        rackNo: 'R001',
        origin: 'Germany',
        grade: 'Standard',
        size: 'Standard',
        remarks: 'High efficiency filtration',
      },
      {
        partNo: 'ENG-007',
        description: 'Water Pump - Complete',
        brand: 'Gates',
        mainCategory: 'Engine Parts',
        subCategory: 'Cooling',
        application: 'Toyota Corolla',
        hsCode: '8413.30.00',
        uom: 'PCS',
        weight: 2.8,
        reOrderLevel: 5,
        cost: 6500,
        priceA: 9500,
        priceB: 8500,
        priceM: 7500,
        rackNo: 'R002',
        origin: 'USA',
        grade: 'Premium',
        size: 'Standard',
        remarks: 'Includes gasket, long life',
      },
      {
        partNo: 'BRK-004',
        description: 'Brake Pad Set - Rear',
        brand: 'Bosch',
        mainCategory: 'Brake System',
        subCategory: 'Brake Pads',
        application: 'Sedan Models',
        hsCode: '8708.30.00',
        uom: 'SET',
        weight: 1.2,
        reOrderLevel: 12,
        cost: 2800,
        priceA: 4500,
        priceB: 4000,
        priceM: 3500,
        rackNo: 'R004',
        origin: 'Germany',
        grade: 'Premium',
        size: 'Standard',
        remarks: 'Ceramic compound, quiet operation',
      },
      {
        partNo: 'TRN-003',
        description: 'CV Joint Boot Kit',
        brand: 'Delphi',
        mainCategory: 'Transmission Parts',
        subCategory: 'CV Joints',
        application: 'Front Wheel Drive',
        hsCode: '8708.99.00',
        uom: 'KIT',
        weight: 0.8,
        reOrderLevel: 10,
        cost: 3200,
        priceA: 5000,
        priceB: 4500,
        priceM: 4000,
        rackNo: 'R003',
        origin: 'UK',
        grade: 'Standard',
        size: 'Standard',
        remarks: 'Includes clamps and grease',
      },
      {
        partNo: 'SUS-003',
        description: 'Stabilizer Link - Front',
        brand: 'Delphi',
        mainCategory: 'Suspension',
        subCategory: 'Links',
        application: 'Front Suspension',
        hsCode: '8708.80.00',
        uom: 'PCS',
        weight: 0.6,
        reOrderLevel: 15,
        cost: 1800,
        priceA: 3000,
        priceB: 2700,
        priceM: 2400,
        rackNo: 'R005',
        origin: 'UK',
        grade: 'Standard',
        size: 'Standard',
        remarks: 'Heavy duty, rust resistant',
      },
    ];

    const createdParts: any[] = [];
    for (const partData of partsData) {
      const brand = createdBrands.find((b) => b.name === partData.brand) || createdBrands[0];
      const category = createdCategories.find((c) => c.name === partData.mainCategory) || createdCategories[0];

      const part = await prisma.part.create({
        data: {
          partNo: partData.partNo,
          description: partData.description,
          brand: brand.name,
          mainCategory: partData.mainCategory,
          subCategory: partData.subCategory,
          application: partData.application,
          hsCode: partData.hsCode,
          uom: partData.uom,
          weight: partData.weight,
          reOrderLevel: partData.reOrderLevel,
          cost: partData.cost,
          priceA: partData.priceA,
          priceB: partData.priceB,
          priceM: partData.priceM,
          rackNo: partData.rackNo,
          origin: partData.origin,
          grade: partData.grade,
          size: partData.size,
          remarks: partData.remarks,
          status: 'A',
        },
      });
      createdParts.push(part);

      // Create stock for each part
      const rack = racks[Math.floor(Math.random() * racks.length)];
      const shelf = await prisma.shelf.findFirst({
        where: { rackId: rack.id },
      });

      if (shelf) {
        const existingStock = await prisma.stock.findUnique({
          where: { partId: part.id },
        });

        if (!existingStock) {
          await prisma.stock.create({
            data: {
              partId: part.id,
              quantity: random(20, 100),
              location: `${rack.rackNumber}-${shelf.shelfNumber}`,
              racks: rack.rackNumber,
              shelf: shelf.shelfNumber,
              store: store.name,
            },
          });
        }
      }
    }
    console.log('✓ 20 Parts created with stock\n');

    // 7. Create Kits
    console.log('📦 Creating kits...');
    const kits = [
      {
        kitNo: 'KIT-001',
        name: 'Complete Brake Service Kit',
        description: 'Includes front and rear brake pads, brake fluid, and brake cleaner',
        totalCost: 8500,
        price: 12000,
      },
      {
        kitNo: 'KIT-002',
        name: 'Engine Service Kit',
        description: 'Oil filter, air filter, fuel filter, and spark plugs',
        totalCost: 5500,
        price: 8000,
      },
      {
        kitNo: 'KIT-003',
        name: 'Suspension Overhaul Kit',
        description: 'Front and rear shock absorbers with coil springs',
        totalCost: 18000,
        price: 25000,
      },
    ];

    const createdKits: any[] = [];
    for (const kitData of kits) {
      const kit = await prisma.kit.create({
        data: {
          kitNo: kitData.kitNo,
          name: kitData.name,
          description: kitData.description,
          totalCost: kitData.totalCost,
          price: kitData.price,
          status: 'A',
        },
      });
      createdKits.push(kit);

      // Add parts to kit
      if (kitData.kitNo === 'KIT-001') {
        // Brake kit
        const brakePadFront = createdParts.find((p) => p.partNo === 'BRK-001');
        const brakePadRear = createdParts.find((p) => p.partNo === 'BRK-004');
        const brakeFluid = createdParts.find((p) => p.partNo === 'BRK-003');
        if (brakePadFront) {
          await prisma.kitItem.create({ data: { kitId: kit.id, partId: brakePadFront.id, quantity: 1 } });
        }
        if (brakePadRear) {
          await prisma.kitItem.create({ data: { kitId: kit.id, partId: brakePadRear.id, quantity: 1 } });
        }
        if (brakeFluid) {
          await prisma.kitItem.create({ data: { kitId: kit.id, partId: brakeFluid.id, quantity: 2 } });
        }
      } else if (kitData.kitNo === 'KIT-002') {
        // Engine service kit
        const oilFilter = createdParts.find((p) => p.partNo === 'ENG-001');
        const airFilter = createdParts.find((p) => p.partNo === 'ENG-003');
        const fuelFilter = createdParts.find((p) => p.partNo === 'ENG-006');
        const sparkPlug = createdParts.find((p) => p.partNo === 'ENG-002');
        if (oilFilter) {
          await prisma.kitItem.create({ data: { kitId: kit.id, partId: oilFilter.id, quantity: 1 } });
        }
        if (airFilter) {
          await prisma.kitItem.create({ data: { kitId: kit.id, partId: airFilter.id, quantity: 1 } });
        }
        if (fuelFilter) {
          await prisma.kitItem.create({ data: { kitId: kit.id, partId: fuelFilter.id, quantity: 1 } });
        }
        if (sparkPlug) {
          await prisma.kitItem.create({ data: { kitId: kit.id, partId: sparkPlug.id, quantity: 1 } });
        }
      } else if (kitData.kitNo === 'KIT-003') {
        // Suspension kit
        const frontShock = createdParts.find((p) => p.partNo === 'SUS-001');
        const coilSpring = createdParts.find((p) => p.partNo === 'SUS-002');
        if (frontShock) {
          await prisma.kitItem.create({ data: { kitId: kit.id, partId: frontShock.id, quantity: 2 } });
        }
        if (coilSpring) {
          await prisma.kitItem.create({ data: { kitId: kit.id, partId: coilSpring.id, quantity: 1 } });
        }
      }
    }
    console.log('✓ Kits created\n');

    // 8. Create Purchase Orders
    console.log('📋 Creating purchase orders...');
    const today = new Date();
    const purchaseOrders = [
      {
        poNo: 'PO-2024-001',
        type: 'purchase',
        supplierId: createdSuppliers[0].id,
        supplierName: createdSuppliers[0].name,
        supplierEmail: createdSuppliers[0].email,
        supplierPhone: createdSuppliers[0].phone,
        supplierAddress: createdSuppliers[0].address,
        orderDate: randomDate(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), today),
        expectedDate: randomDate(today, new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000)),
        status: 'received',
        paymentMethod: 'bank_transfer',
        notes: 'Urgent order for high-demand items',
      },
      {
        poNo: 'PO-2024-002',
        type: 'purchase',
        supplierId: createdSuppliers[1].id,
        supplierName: createdSuppliers[1].name,
        supplierEmail: createdSuppliers[1].email,
        supplierPhone: createdSuppliers[1].phone,
        supplierAddress: createdSuppliers[1].address,
        orderDate: randomDate(new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000), today),
        expectedDate: randomDate(today, new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000)),
        status: 'approved',
        paymentMethod: 'credit_card',
        notes: 'Regular monthly order',
      },
      {
        poNo: 'PO-2024-003',
        type: 'direct',
        supplierName: 'Quick Parts Supplier',
        supplierEmail: 'quick@parts.com',
        supplierPhone: '+92-300-9998888',
        supplierAddress: '999 Fast Lane',
        orderDate: randomDate(new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000), today),
        expectedDate: randomDate(today, new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)),
        status: 'draft',
        paymentMethod: 'cash',
        notes: 'Direct order for special items',
      },
    ];

    const createdPOs: any[] = [];
    for (const poData of purchaseOrders) {
      // Select random parts for this PO
      const selectedParts = createdParts
        .sort(() => 0.5 - Math.random())
        .slice(0, random(3, 6));

      let subTotal = 0;
      const items: any[] = [];

      for (const part of selectedParts) {
        const quantity = random(5, 20);
        const unitPrice = part.cost || part.priceM || 1000;
        const totalPrice = quantity * unitPrice;
        subTotal += totalPrice;

        items.push({
          partId: part.id,
          partNo: part.partNo,
          description: part.description,
          quantity,
          unitPrice,
          totalPrice,
          uom: part.uom || 'PCS',
        });
      }

      const tax = subTotal * 0.15; // 15% tax
      const discount = subTotal * 0.05; // 5% discount
      const totalAmount = subTotal + tax - discount;

      const po = await prisma.purchaseOrder.create({
        data: {
          ...poData,
          subTotal,
          tax,
          discount,
          totalAmount,
          createdBy: 'demo-user',
        },
      });

      // Create PO items
      for (const item of items) {
        await prisma.purchaseOrderItem.create({
          data: {
            purchaseOrderId: po.id,
            ...item,
          },
        });
      }

      createdPOs.push(po);
    }
    console.log('✓ Purchase orders created\n');

    // 9. Create Sales Invoices
    console.log('🧾 Creating sales invoices...');
    const salesInvoices = [
      {
        invoiceNo: 'INV-2024-001',
        customerId: createdCustomers[0].id,
        customerName: createdCustomers[0].name,
        customerEmail: createdCustomers[0].email,
        customerPhone: createdCustomers[0].phone,
        customerAddress: createdCustomers[0].address,
        invoiceDate: randomDate(new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000), today),
        dueDate: randomDate(today, new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)),
        status: 'paid',
        notes: 'Regular customer order',
      },
      {
        invoiceNo: 'INV-2024-002',
        customerId: createdCustomers[1].id,
        customerName: createdCustomers[1].name,
        customerEmail: createdCustomers[1].email,
        customerPhone: createdCustomers[1].phone,
        customerAddress: createdCustomers[1].address,
        invoiceDate: randomDate(new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000), today),
        dueDate: randomDate(today, new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000)),
        status: 'partial',
        notes: 'Partial payment received',
      },
    ];

    for (const invData of salesInvoices) {
      const selectedParts = createdParts
        .sort(() => 0.5 - Math.random())
        .slice(0, random(2, 5));

      let subTotal = 0;
      const items: any[] = [];

      for (const part of selectedParts) {
        const quantity = random(1, 10);
        const unitPrice = part.priceA || part.priceM || 1500;
        const totalPrice = quantity * unitPrice;
        subTotal += totalPrice;

        items.push({
          partId: part.id,
          partNo: part.partNo,
          description: part.description,
          quantity,
          unitPrice,
          totalPrice,
          uom: part.uom || 'PCS',
        });
      }

      const tax = subTotal * 0.15;
      const discount = subTotal * 0.03;
      const totalAmount = subTotal + tax - discount;
      const paidAmount = invData.status === 'paid' ? totalAmount : totalAmount * 0.5;
      const balanceAmount = totalAmount - paidAmount;

      const invoice = await prisma.salesInvoice.create({
        data: {
          ...invData,
          subTotal,
          tax,
          discount,
          totalAmount,
          paidAmount,
          balanceAmount,
          createdBy: 'demo-user',
        },
      });

      // Create invoice items
      for (const item of items) {
        await prisma.salesInvoiceItem.create({
          data: {
            salesInvoiceId: invoice.id,
            ...item,
          },
        });
      }
    }
    console.log('✓ Sales invoices created\n');

    // 10. Create Inventory Adjustments
    console.log('📊 Creating inventory adjustments...');
    const adjustment = await prisma.inventoryAdjustment.create({
      data: {
        adjustmentNo: 'ADJ-2024-001',
        date: randomDate(new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), today),
        notes: 'Year-end inventory count adjustment',
        createdBy: 'demo-user',
      },
    });

    // Add adjustment items for some parts
    const partsToAdjust = createdParts.slice(0, 5);
    let adjustmentTotal = 0;

    for (const part of partsToAdjust) {
      const stock = await prisma.stock.findUnique({ where: { partId: part.id } });
      const previousQty = stock?.quantity || 0;
      const adjustedQty = random(-5, 10);
      const newQty = previousQty + adjustedQty;

      await prisma.inventoryAdjustmentItem.create({
        data: {
          adjustmentId: adjustment.id,
          partId: part.id,
          partNo: part.partNo,
          description: part.description,
          previousQuantity: previousQty,
          adjustedQuantity: adjustedQty,
          newQuantity: newQty,
          reason: 'Physical count discrepancy',
        },
      });

      // Update stock
      if (stock) {
        await prisma.stock.update({
          where: { partId: part.id },
          data: { quantity: newQty },
        });
      }

      adjustmentTotal += Math.abs(adjustedQty) * (part.cost || 0);
    }

    await prisma.inventoryAdjustment.update({
      where: { id: adjustment.id },
      data: { total: adjustmentTotal },
    });
    console.log('✓ Inventory adjustments created\n');

    console.log('✅ Demo data seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - ${createdCategories.length} Categories`);
    console.log(`   - ${createdBrands.length} Brands`);
    console.log(`   - ${createdSuppliers.length} Suppliers`);
    console.log(`   - ${createdCustomers.length} Customers`);
    console.log(`   - ${createdParts.length} Parts with Stock`);
    console.log(`   - ${createdKits.length} Kits`);
    console.log(`   - ${createdPOs.length} Purchase Orders`);
    console.log(`   - ${salesInvoices.length} Sales Invoices`);
    console.log(`   - 1 Inventory Adjustment\n`);
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

