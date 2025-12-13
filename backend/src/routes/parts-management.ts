import express, { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// 1. Get Inventory Items with Filtering and Pagination
router.get('/getItemsInventory', async (req: AuthRequest, res: Response) => {
  try {
    const {
      records = '10',
      pageNo = '1',
      colName = 'id',
      sort = 'desc',
      item_id,
      store_id,
      store_type_id,
      category_id,
      sub_category_id,
      part_model_id
    } = req.query;

    const limit = parseInt(records as string);
    const page = parseInt(pageNo as string);
    const offset = (page - 1) * limit;

    // Build filters
    const where: any = {};
    
    if (item_id) where.itemId = item_id;
    if (store_id) where.storeId = store_id;
    
    if (store_type_id) {
      where.store = {
        storeTypeId: store_type_id
      };
    }

    // For category, sub-category, and part model filtering, we need to join through the relationships
    if (category_id || sub_category_id || part_model_id) {
      where.item = {
        ...(where.item || {}),
        ...(category_id && {
          machinePartOemPart: {
            machinePart: {
              // Assuming categories are linked somehow - adjust as needed
            }
          }
        }),
        ...(part_model_id && {
          machineModelId: part_model_id
        })
      };
    }

    // Get total count
    const total = await prisma.itemInventory.count({
      where
    });

    // Get paginated data with full joins
    const itemsInventory = await prisma.itemInventory.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: {
        [colName as string]: sort as 'asc' | 'desc'
      },
      include: {
        item: {
          include: {
            machinePartOemPart: {
              include: {
                oemPartNumber: true,
                machinePart: {
                  include: {
                    unit: true
                  }
                }
              }
            },
            brand: true,
            machineModel: true
          }
        },
        store: {
          include: {
            storeType: true
          }
        },
        rack: true,
        shelf: true
      }
    });

    // Format response to match expected structure
    const formattedData = itemsInventory.map((inv) => ({
      id: inv.id,
      quantity: inv.quantity,
      item: {
        id: inv.item.id,
        machine_part_oem_part: {
          oem_part_number: {
            number1: inv.item.machinePartOemPart.oemPartNumber.number1,
            number2: inv.item.machinePartOemPart.oemPartNumber.number2
          },
          machine_part: {
            name: inv.item.machinePartOemPart.machinePart.name,
            unit: {
              name: inv.item.machinePartOemPart.machinePart.unit.name
            }
          }
        },
        brand: {
          name: inv.item.brand.name
        },
        machine_model: {
          name: inv.item.machineModel.name
        }
      },
      store: {
        name: inv.store.name,
        store_type: {
          name: inv.store.storeType.name
        }
      },
      racks: {
        rack_number: inv.rack.rackNumber
      },
      shelves: {
        shelf_number: inv.shelf.shelfNumber
      }
    }));

    const response = {
      itemsInventory: {
        data: formattedData,
        from: offset + 1,
        to: Math.min(offset + limit, total),
        total,
        current_page: page,
        per_page: limit
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
});

// 2. Get Categories Dropdown
router.get('/getCategoriesDropDown', async (req: AuthRequest, res: Response) => {
  try {
    const { store_id } = req.query;

    const categories = await prisma.category.findMany({
      where: {
        status: 'A',
        parentId: null // Only root categories
      },
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// 3. Get Sub-Categories by Category
router.get('/getSubCategoriesByCategory', async (req: AuthRequest, res: Response) => {
  try {
    const { category_id } = req.query;

    if (!category_id) {
      return res.status(400).json({ error: 'category_id is required' });
    }

    const subcategories = await prisma.category.findMany({
      where: {
        parentId: category_id as string,
        status: 'A'
      },
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({ subcategories });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({ error: 'Failed to fetch subcategories' });
  }
});

// 4. Get Items Dropdown
router.get('/getItemOemDropDown', async (req: AuthRequest, res: Response) => {
  try {
    const { category_id, sub_category_id, type_id = '1' } = req.query;

    const items = await prisma.item.findMany({
      where: {
        status: 'A',
        typeId: parseInt(type_id as string)
      },
      select: {
        id: true,
        machinePartOemPart: {
          select: {
            machinePart: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedItems = items.map(item => ({
      id: item.id,
      name: item.machinePartOemPart.machinePart.name
    }));

    res.json({ data: formattedItems });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// 5. Get Machine Parts Models Dropdown
router.get('/getMachinePartsModelsDropDown', async (req: AuthRequest, res: Response) => {
  try {
    const { machine_part_id } = req.query;

    if (!machine_part_id) {
      return res.status(400).json({ error: 'machine_part_id is required' });
    }

    // Find models through the relationship: MachinePart -> MachinePartOemPart -> Item -> MachineModel
    const models = await prisma.machineModel.findMany({
      where: {
        items: {
          some: {
            machinePartOemPart: {
              machinePartId: machine_part_id as string
            }
          }
        }
      },
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      },
      distinct: ['id'] // Ensure unique models
    });

    res.json({ machinepartmodel: models });
  } catch (error) {
    console.error('Error fetching machine part models:', error);
    res.status(500).json({ error: 'Failed to fetch machine part models' });
  }
});

// 6. Get Store Types Dropdown
router.get('/getStoreTypeDropDown', async (req: AuthRequest, res: Response) => {
  try {
    const storeTypes = await prisma.storeType.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({ storeType: storeTypes });
  } catch (error) {
    console.error('Error fetching store types:', error);
    res.status(500).json({ error: 'Failed to fetch store types' });
  }
});

// 7. Get Stores Dropdown
router.get('/getStoredropdown', async (req: AuthRequest, res: Response) => {
  try {
    const { store_type_id } = req.query;

    const where: any = {
      status: 'A'
    };

    if (store_type_id) {
      where.storeTypeId = store_type_id as string;
    }

    const stores = await prisma.store.findMany({
      where,
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({ store: stores });
  } catch (error) {
    console.error('Error fetching stores:', error);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

// 8. Get Racks Dropdown
router.get('/getRackDropDown', async (req: AuthRequest, res: Response) => {
  try {
    const { store_id } = req.query;

    const where: any = {
      status: 'A'
    };

    if (store_id) {
      where.storeId = store_id as string;
    }

    const racks = await prisma.rack.findMany({
      where,
      select: {
        id: true,
        rackNumber: true,
        storeId: true
      },
      orderBy: {
        rackNumber: 'asc'
      }
    });

    const formattedRacks = racks.map(rack => ({
      id: rack.id,
      rack_number: rack.rackNumber,
      store_id: rack.storeId
    }));

    res.json({ racks: formattedRacks });
  } catch (error) {
    console.error('Error fetching racks:', error);
    res.status(500).json({ error: 'Failed to fetch racks' });
  }
});

// 9. Get Shelves Dropdown
router.get('/getShelvesDropdown', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.query; // rack id

    const where: any = {
      status: 'A'
    };

    if (id) {
      where.rackId = id as string;
    }

    const shelves = await prisma.shelf.findMany({
      where,
      select: {
        id: true,
        shelfNumber: true,
        rackId: true
      },
      orderBy: {
        shelfNumber: 'asc'
      }
    });

    const formattedShelves = shelves.map(shelf => ({
      id: shelf.id,
      shelf_number: shelf.shelfNumber,
      rack_id: shelf.rackId
    }));

    res.json({ shelves: formattedShelves });
  } catch (error) {
    console.error('Error fetching shelves:', error);
    res.status(500).json({ error: 'Failed to fetch shelves' });
  }
});

// 10. Edit Item Inventory - Get item details for editing
router.get('/editItemInventory', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }

    const inventoryItems = await prisma.itemInventory.findMany({
      where: {
        itemId: id as string
      },
      include: {
        item: {
          select: {
            id: true
          }
        },
        store: {
          select: {
            id: true
          }
        },
        rack: {
          select: {
            id: true,
            rackNumber: true
          }
        },
        shelf: {
          select: {
            id: true,
            shelfNumber: true
          }
        }
      }
    });

    // Group by store and format for editing
    const editData = inventoryItems.map(inv => ({
      id: inv.id,
      item: {
        id: inv.item.id
      },
      store: {
        id: inv.store.id
      },
      store_id: inv.storeId,
      racks: {
        id: inv.rack.id,
        rack_number: inv.rack.rackNumber
      },
      shelves: {
        id: inv.shelf.id,
        shelf_number: inv.shelf.shelfNumber
      },
      childArray: [{
        rackShelf: [{
          rack_id: inv.rackId,
          shelf_id: inv.shelfId,
          quantity: inv.quantity
        }]
      }]
    }));

    res.json({ editItemInventory: editData });
  } catch (error) {
    console.error('Error fetching item inventory for editing:', error);
    res.status(500).json({ error: 'Failed to fetch item inventory' });
  }
});

// 11. Update Item Inventory
router.post('/updateItemInventory', async (req: AuthRequest, res: Response) => {
  try {
    const { id, item_id, store_id, rack_id, racks, shelves, purchase_order_id } = req.body;

    // Update the inventory record
    await prisma.itemInventory.update({
      where: {
        id: id
      },
      data: {
        rackId: rack_id,
        shelfId: shelves.id
      }
    });

    res.json({
      status: 'ok',
      message: 'Inventory updated successfully'
    });
  } catch (error) {
    console.error('Error updating item inventory:', error);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

// 12. View Kits - Get kit recipe and inventory details
router.get('/viewKits', async (req: AuthRequest, res: Response) => {
  try {
    const { id, store_id } = req.query;

    if (!id || !store_id) {
      return res.status(400).json({ error: 'id and store_id are required' });
    }

    // Get kit item details
    const kitItem = await prisma.item.findUnique({
      where: {
        id: id as string,
        typeId: 2 // kits
      },
      include: {
        machinePartOemPart: {
          include: {
            machinePart: {
              include: {
                unit: true
              }
            }
          }
        },
        kitItems: {
          include: {
            childItem: {
              include: {
                machinePartOemPart: {
                  include: {
                    machinePart: true
                  }
                },
                inventories: {
                  where: {
                    storeId: store_id as string
                  }
                }
              }
            }
          }
        },
        inventories: {
          where: {
            storeId: store_id as string
          }
        }
      }
    });

    if (!kitItem) {
      return res.status(404).json({ error: 'Kit not found' });
    }

    // Get existing kit quantity
    const existingKitQuantity = kitItem.inventories.reduce((sum, inv) => sum + inv.quantity, 0);

    // Format kit recipe with existing quantities
    const kitRecipe = {
      machine_part_oem_part: {
        machine_part: {
          name: kitItem.machinePartOemPart.machinePart.name,
          kitchild: kitItem.kitItems.map(kitChild => {
            const existingQuantity = kitChild.childItem.inventories.reduce((sum, inv) => sum + inv.quantity, 0);
            
            return {
              id: kitChild.id,
              quantity: kitChild.quantity,
              item: {
                machine_part_oem_part: {
                  machine_part: {
                    name: kitChild.childItem.machinePartOemPart.machinePart.name
                  }
                }
              },
              existing_item_inventory: {
                existing_quantity: existingQuantity
              }
            };
          })
        }
      },
      existing_set_inventory: {
        existing_set_quantity: existingKitQuantity
      }
    };

    res.json({ kitRecipe });
  } catch (error) {
    console.error('Error fetching kit details:', error);
    res.status(500).json({ error: 'Failed to fetch kit details' });
  }
});

// 13. Make Kit - Create kits from individual parts
router.post('/makeKit', async (req: AuthRequest, res: Response) => {
  try {
    const { in_flow, kit_id, store_id, out_flow } = req.body;

    if (!in_flow || !kit_id || !store_id) {
      return res.status(400).json({ error: 'in_flow, kit_id, and store_id are required' });
    }

    // Start transaction
    await prisma.$transaction(async (tx) => {
      // Get kit recipe
      const kitItem = await tx.item.findUnique({
        where: { id: kit_id },
        include: {
          kitItems: {
            include: {
              childItem: {
                include: {
                  inventories: {
                    where: { storeId: store_id }
                  },
                  machinePartOemPart: {
                    include: {
                      machinePart: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!kitItem) {
        throw new Error('Kit not found');
      }

      // Validate sufficient parts available
      for (const kitChild of kitItem.kitItems) {
        const requiredQuantity = kitChild.quantity * in_flow;
        const availableQuantity = kitChild.childItem.inventories.reduce((sum, inv) => sum + inv.quantity, 0);
        
        if (availableQuantity < requiredQuantity) {
          throw new Error(`Insufficient quantity for ${kitChild.childItem.machinePartOemPart.machinePart.name}`);
        }
      }

      // Reduce individual part quantities
      for (const kitChild of kitItem.kitItems) {
        const requiredQuantity = kitChild.quantity * in_flow;
        
        // Find inventory records for this part in the store
        const inventories = kitChild.childItem.inventories;
        let remainingToReduce = requiredQuantity;
        
        for (const inventory of inventories) {
          if (remainingToReduce <= 0) break;
          
          const reduceAmount = Math.min(inventory.quantity, remainingToReduce);
          
          await tx.itemInventory.update({
            where: { id: inventory.id },
            data: {
              quantity: inventory.quantity - reduceAmount
            }
          });
          
          remainingToReduce -= reduceAmount;
        }
      }

      // Increase kit quantity
      const existingKitInventory = await tx.itemInventory.findFirst({
        where: {
          itemId: kit_id,
          storeId: store_id
        }
      });

      if (existingKitInventory) {
        await tx.itemInventory.update({
          where: { id: existingKitInventory.id },
          data: {
            quantity: existingKitInventory.quantity + in_flow
          }
        });
      } else {
        // Create new inventory record for kit - we need to find a default rack/shelf
        const defaultRack = await tx.rack.findFirst({
          where: { storeId: store_id },
          include: { shelves: true }
        });

        if (!defaultRack || !defaultRack.shelves.length) {
          throw new Error('No default rack/shelf found for the store');
        }

        await tx.itemInventory.create({
          data: {
            itemId: kit_id,
            storeId: store_id,
            rackId: defaultRack.id,
            shelfId: defaultRack.shelves[0].id,
            quantity: in_flow
          }
        });
      }

      // Log inventory flow
      await tx.inventoryFlow.create({
        data: {
          itemId: kit_id,
          storeId: store_id,
          inFlow: in_flow,
          outFlow: 0,
          reason: 'make_kit'
        }
      });
    });

    res.json({
      status: 'ok',
      message: 'Kit created successfully'
    });
  } catch (error) {
    console.error('Error making kit:', error);
    res.status(500).json({ error: 'Failed to create kit: ' + (error as Error).message });
  }
});

// 14. Break Kit - Break kits back into individual parts
router.post('/breakKit', async (req: AuthRequest, res: Response) => {
  try {
    const { out_flow, kit_id, store_id, in_flow } = req.body;

    if (!out_flow || !kit_id || !store_id) {
      return res.status(400).json({ error: 'out_flow, kit_id, and store_id are required' });
    }

    // Start transaction
    await prisma.$transaction(async (tx) => {
      // Get kit inventory
      const kitInventories = await tx.itemInventory.findMany({
        where: {
          itemId: kit_id,
          storeId: store_id
        }
      });

      const totalKitQuantity = kitInventories.reduce((sum, inv) => sum + inv.quantity, 0);
      
      if (totalKitQuantity < out_flow) {
        throw new Error('Insufficient kit quantity available');
      }

      // Get kit recipe
      const kitItem = await tx.item.findUnique({
        where: { id: kit_id },
        include: {
          kitItems: {
            include: {
              childItem: {
                include: {
                  inventories: {
                    where: { storeId: store_id }
                  }
                }
              }
            }
          }
        }
      });

      if (!kitItem) {
        throw new Error('Kit not found');
      }

      // Reduce kit quantity
      let remainingToReduce = out_flow;
      for (const kitInventory of kitInventories) {
        if (remainingToReduce <= 0) break;
        
        const reduceAmount = Math.min(kitInventory.quantity, remainingToReduce);
        
        await tx.itemInventory.update({
          where: { id: kitInventory.id },
          data: {
            quantity: kitInventory.quantity - reduceAmount
          }
        });
        
        remainingToReduce -= reduceAmount;
      }

      // Increase individual part quantities
      for (const kitChild of kitItem.kitItems) {
        const returnQuantity = kitChild.quantity * out_flow;
        
        // Get all existing inventories for this part in this store
        const existingInventories = kitChild.childItem.inventories || [];
        
        if (existingInventories.length > 0) {
          // If there are multiple inventory locations, distribute the quantity proportionally
          // based on current quantities to maintain balance across locations
          if (existingInventories.length > 1) {
            const totalExistingQuantity = existingInventories.reduce((sum, inv) => sum + inv.quantity, 0);
            
            // Distribute proportionally: each location gets quantity based on its current share
            let remainingQuantity = returnQuantity;
            for (let i = 0; i < existingInventories.length - 1; i++) {
              const inventory = existingInventories[i];
              const proportion = totalExistingQuantity > 0 
                ? inventory.quantity / totalExistingQuantity 
                : 1 / existingInventories.length;
              const allocatedQuantity = Math.floor(returnQuantity * proportion);
              
              await tx.itemInventory.update({
                where: { id: inventory.id },
                data: {
                  quantity: inventory.quantity + allocatedQuantity
                }
              });
              
              remainingQuantity -= allocatedQuantity;
            }
            
            // Add any remainder to the last inventory location
            if (remainingQuantity > 0) {
              const lastInventory = existingInventories[existingInventories.length - 1];
              await tx.itemInventory.update({
                where: { id: lastInventory.id },
                data: {
                  quantity: lastInventory.quantity + remainingQuantity
                }
              });
            }
          } else {
            // Single inventory location - add all quantity to it
            await tx.itemInventory.update({
              where: { id: existingInventories[0].id },
              data: {
                quantity: existingInventories[0].quantity + returnQuantity
              }
            });
          }
        } else {
          // Create new inventory record - need default rack/shelf
          const defaultRack = await tx.rack.findFirst({
            where: { storeId: store_id },
            include: { shelves: true }
          });

          if (!defaultRack || !defaultRack.shelves.length) {
            throw new Error('No default rack/shelf found for the store');
          }

          await tx.itemInventory.create({
            data: {
              itemId: kitChild.childItemId,
              storeId: store_id,
              rackId: defaultRack.id,
              shelfId: defaultRack.shelves[0].id,
              quantity: returnQuantity
            }
          });
        }
      }

      // Log inventory flow
      await tx.inventoryFlow.create({
        data: {
          itemId: kit_id,
          storeId: store_id,
          inFlow: 0,
          outFlow: out_flow,
          reason: 'break_kit'
        }
      });
    });

    res.json({
      status: 'ok',
      message: 'Kit broken successfully'
    });
  } catch (error) {
    console.error('Error breaking kit:', error);
    res.status(500).json({ error: 'Failed to break kit: ' + (error as Error).message });
  }
});

export default router;