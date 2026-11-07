"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  DeviceCategory,
  DeviceStatus,
  TransactionType,
  FinancialCategory,
} from "@prisma/client";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Invariant protection for execution outside Next request context
  }
}

// -------------------------------------------------------------
// ROUTER & GATEWAY (POP) ACTIONS
// -------------------------------------------------------------
export async function getRouterDevices() {
  return await prisma.routerDevice.findMany({
    include: {
      oltDevices: {
        include: {
          odpNodes: true,
        },
      },
      ispProviders: true,
      devices: true,
    },
    orderBy: [{ isCoreGateway: "desc" }, { name: "asc" }],
  });
}

export async function createRouterDevice(data: {
  name: string;
  brandModel: string;
  ipAddress?: string;
  siteLocation: string;
  isCoreGateway?: boolean;
  apiPort?: number;
  notes?: string;
  inventoryDeviceId?: string;
}) {
  const router = await prisma.$transaction(async (tx) => {
    const createdRouter = await tx.routerDevice.create({
      data: {
        name: data.name.trim(),
        brandModel: data.brandModel.trim(),
        ipAddress: data.ipAddress ? data.ipAddress.trim() : null,
        siteLocation: data.siteLocation.trim(),
        isCoreGateway: Boolean(data.isCoreGateway),
        apiPort: Number(data.apiPort || 8728),
        notes: data.notes ? data.notes.trim() : null,
      },
    });

    if (data.inventoryDeviceId) {
      await tx.inventoryDevice.update({
        where: { id: data.inventoryDeviceId },
        data: {
          status: DeviceStatus.DEPLOYED_INFRA,
          routerDeviceId: createdRouter.id,
        },
      });
    }

    return createdRouter;
  });

  safeRevalidate("/infrastructure");
  safeRevalidate("/topology");
  return router;
}

export async function updateRouterDevice(
  id: string,
  data: {
    name?: string;
    brandModel?: string;
    ipAddress?: string;
    siteLocation?: string;
    isCoreGateway?: boolean;
    apiPort?: number;
    notes?: string;
  }
) {
  const router = await prisma.routerDevice.update({
    where: { id },
    data: {
      ...data,
      name: data.name ? data.name.trim() : undefined,
      brandModel: data.brandModel ? data.brandModel.trim() : undefined,
      ipAddress: data.ipAddress !== undefined ? (data.ipAddress ? data.ipAddress.trim() : null) : undefined,
      siteLocation: data.siteLocation ? data.siteLocation.trim() : undefined,
      notes: data.notes !== undefined ? (data.notes ? data.notes.trim() : null) : undefined,
    },
  });

  safeRevalidate("/infrastructure");
  safeRevalidate("/topology");
  return router;
}

export async function deleteRouterDevice(id: string) {
  await prisma.$transaction(async (tx) => {
    // Release any linked inventory devices back to stock
    await tx.inventoryDevice.updateMany({
      where: { routerDeviceId: id },
      data: {
        status: DeviceStatus.IN_STOCK,
        routerDeviceId: null,
      },
    });

    // Unlink connected OLTs
    await tx.oltDevice.updateMany({
      where: { routerId: id },
      data: { routerId: null },
    });

    // Unlink connected ISPs
    await tx.ispProvider.updateMany({
      where: { routerId: id },
      data: { routerId: null },
    });

    await tx.routerDevice.delete({ where: { id } });
  });

  safeRevalidate("/infrastructure");
  safeRevalidate("/topology");
}

// -------------------------------------------------------------
// ISP PROVIDER ACTIONS
// -------------------------------------------------------------
export async function getIspProviders() {
  return await prisma.ispProvider.findMany({
    include: {
      router: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function createIspProvider(data: {
  name: string;
  bandwidthMbps: number;
  serviceType?: string;
  circuitId?: string;
  routerId?: string;
  monthlyCost?: number;
  contactPhone?: string;
  status?: string;
  notes?: string;
}) {
  const isp = await prisma.ispProvider.create({
    data: {
      name: data.name.trim(),
      bandwidthMbps: Number(data.bandwidthMbps || 100),
      serviceType: data.serviceType || "DEDICATED",
      circuitId: data.circuitId ? data.circuitId.trim() : null,
      routerId: data.routerId || null,
      monthlyCost: Number(data.monthlyCost || 0),
      contactPhone: data.contactPhone ? data.contactPhone.trim() : null,
      status: data.status || "ACTIVE",
      notes: data.notes ? data.notes.trim() : null,
    },
  });

  safeRevalidate("/infrastructure");
  safeRevalidate("/topology");
  return isp;
}

export async function updateIspProvider(
  id: string,
  data: {
    name?: string;
    bandwidthMbps?: number;
    serviceType?: string;
    circuitId?: string | null;
    routerId?: string | null;
    monthlyCost?: number;
    contactPhone?: string | null;
    status?: string;
    notes?: string | null;
  }
) {
  const isp = await prisma.ispProvider.update({
    where: { id },
    data: {
      ...data,
      name: data.name ? data.name.trim() : undefined,
      circuitId: data.circuitId !== undefined ? (data.circuitId ? data.circuitId.trim() : null) : undefined,
      contactPhone: data.contactPhone !== undefined ? (data.contactPhone ? data.contactPhone.trim() : null) : undefined,
      notes: data.notes !== undefined ? (data.notes ? data.notes.trim() : null) : undefined,
    },
  });

  safeRevalidate("/infrastructure");
  safeRevalidate("/topology");
  return isp;
}

export async function deleteIspProvider(id: string) {
  await prisma.ispProvider.delete({
    where: { id },
  });

  safeRevalidate("/infrastructure");
  safeRevalidate("/topology");
}

// -------------------------------------------------------------
// OLT DEVICE ACTIONS
// -------------------------------------------------------------
export async function getOltDevices() {
  return await prisma.oltDevice.findMany({
    include: {
      odpNodes: true,
      devices: true,
      router: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function createOltDevice(data: {
  name: string;
  brandModel: string;
  localIp?: string;
  ponPortsCount: number;
  location: string;
  routerId?: string;
  notes?: string;
  inventoryDeviceId?: string;
}) {
  const olt = await prisma.$transaction(async (tx) => {
    const createdOlt = await tx.oltDevice.create({
      data: {
        name: data.name,
        brandModel: data.brandModel,
        localIp: data.localIp || null,
        ponPortsCount: Number(data.ponPortsCount),
        location: data.location,
        routerId: data.routerId || null,
        notes: data.notes || null,
      },
    });

    if (data.inventoryDeviceId) {
      await tx.inventoryDevice.update({
        where: { id: data.inventoryDeviceId },
        data: {
          status: DeviceStatus.DEPLOYED_INFRA,
          oltDeviceId: createdOlt.id,
        },
      });
    }

    return createdOlt;
  });

  safeRevalidate("/infrastructure");
  safeRevalidate("/topology");
  return olt;
}

export async function updateOltDevice(
  id: string,
  data: {
    name?: string;
    brandModel?: string;
    localIp?: string;
    ponPortsCount?: number;
    location?: string;
    routerId?: string | null;
    notes?: string;
  }
) {
  const olt = await prisma.oltDevice.update({
    where: { id },
    data,
  });
  safeRevalidate("/infrastructure");
  safeRevalidate("/topology");
  return olt;
}

export async function deleteOltDevice(id: string) {
  await prisma.$transaction(async (tx) => {
    // Release any linked inventory devices back to stock
    await tx.inventoryDevice.updateMany({
      where: { oltDeviceId: id },
      data: {
        status: DeviceStatus.IN_STOCK,
        oltDeviceId: null,
      },
    });

    // Unlink connected ODPs
    await tx.odpNode.updateMany({
      where: { oltId: id },
      data: { oltId: null },
    });

    await tx.oltDevice.delete({ where: { id } });
  });

  safeRevalidate("/infrastructure");
  safeRevalidate("/topology");
}

// -------------------------------------------------------------
// ODP NODE ACTIONS (with Port Occupancy Analysis)
// -------------------------------------------------------------
export async function getOdpNodes() {
  const odps = await prisma.odpNode.findMany({
    include: {
      olt: true,
      devices: true,
      homeCustomers: {
        select: {
          id: true,
          name: true,
          phone: true,
          odpPort: true,
          signalDbm: true,
          status: true,
          packageName: true,
        },
      },
      hotspotPartners: {
        select: {
          id: true,
          name: true,
          ownerName: true,
          phone: true,
          odpPort: true,
        },
      },
    },
    orderBy: { code: "asc" },
  });

  // Calculate detailed port map for each ODP
  return odps.map((odp) => {
    const portMap = [];
    const capacity = odp.splitterCapacity || 8;

    for (let p = 1; p <= capacity; p++) {
      const customer = odp.homeCustomers.find((c) => c.odpPort === p);
      const partner = odp.hotspotPartners.find((hp) => hp.odpPort === p);

      if (customer) {
        portMap.push({
          portNumber: p,
          isOccupied: true,
          type: "CUSTOMER" as const,
          occupantName: customer.name,
          occupantId: customer.id,
          packageName: customer.packageName,
          status: customer.status,
          signalDbm: customer.signalDbm,
        });
      } else if (partner) {
        portMap.push({
          portNumber: p,
          isOccupied: true,
          type: "HOTSPOT" as const,
          occupantName: partner.name,
          occupantId: partner.id,
          packageName: "Titik Hotspot",
          status: "ACTIVE",
          signalDbm: null,
        });
      } else {
        portMap.push({
          portNumber: p,
          isOccupied: false,
          type: null,
          occupantName: null,
          occupantId: null,
          packageName: null,
          status: null,
          signalDbm: null,
        });
      }
    }

    const occupiedCount = portMap.filter((p) => p.isOccupied).length;
    const freeCount = capacity - occupiedCount;

    return {
      ...odp,
      portMap,
      occupiedCount,
      freeCount,
    };
  });
}

export async function createOdpNode(data: {
  code: string;
  oltId?: string;
  ponPortNumber?: number;
  splitterCapacity: number;
  coordinates?: string;
  opticalPowerDbm?: number;
  notes?: string;
  inventoryDeviceId?: string;
}) {
  const odp = await prisma.$transaction(async (tx) => {
    const createdOdp = await tx.odpNode.create({
      data: {
        code: data.code.trim().toUpperCase(),
        oltId: data.oltId || null,
        ponPortNumber: Number(data.ponPortNumber || 1),
        splitterCapacity: Number(data.splitterCapacity || 8),
        coordinates: data.coordinates || null,
        opticalPowerDbm: data.opticalPowerDbm ? Number(data.opticalPowerDbm) : null,
        notes: data.notes || null,
      },
    });

    if (data.inventoryDeviceId) {
      await tx.inventoryDevice.update({
        where: { id: data.inventoryDeviceId },
        data: {
          status: DeviceStatus.DEPLOYED_INFRA,
          odpNodeId: createdOdp.id,
        },
      });
    }

    return createdOdp;
  });

  safeRevalidate("/infrastructure");
  safeRevalidate("/topology");
  return odp;
}

export async function updateOdpNode(
  id: string,
  data: {
    code?: string;
    oltId?: string | null;
    ponPortNumber?: number;
    splitterCapacity?: number;
    coordinates?: string;
    opticalPowerDbm?: number | null;
    notes?: string;
  }
) {
  const odp = await prisma.odpNode.update({
    where: { id },
    data,
  });
  safeRevalidate("/infrastructure");
  safeRevalidate("/topology");
  return odp;
}

export async function deleteOdpNode(id: string) {
  await prisma.$transaction(async (tx) => {
    // Release any linked inventory devices back to stock
    await tx.inventoryDevice.updateMany({
      where: { odpNodeId: id },
      data: {
        status: DeviceStatus.IN_STOCK,
        odpNodeId: null,
      },
    });

    await tx.homeCustomer.updateMany({
      where: { odpId: id },
      data: { odpId: null, odpPort: null },
    });
    await tx.hotspotPartner.updateMany({
      where: { odpId: id },
      data: { odpId: null, odpPort: null },
    });
    await tx.odpNode.delete({ where: { id } });
  });

  safeRevalidate("/infrastructure");
  safeRevalidate("/customers");
  safeRevalidate("/hotspot");
  safeRevalidate("/topology");
}

// -------------------------------------------------------------
// INVENTORY DEVICE ACTIONS
// -------------------------------------------------------------
export async function getInventoryDevices() {
  return await prisma.inventoryDevice.findMany({
    include: {
      homeCustomer: true,
      hotspotPartner: true,
      oltDevice: true,
      odpNode: true,
      routerDevice: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createInventoryDevice(data: {
  category: DeviceCategory;
  customCategory?: string;
  brandModel: string;
  serialNumber: string;
  macAddress?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  status: DeviceStatus;
  homeCustomerId?: string;
  hotspotPartnerId?: string;
  notes?: string;
}) {
  const price = Number(data.purchasePrice || 0);
  const pDate = data.purchaseDate ? new Date(data.purchaseDate) : new Date();

  const device = await prisma.$transaction(async (tx) => {
    const created = await tx.inventoryDevice.create({
      data: {
        category: data.category,
        customCategory:
          data.category === DeviceCategory.OTHER && data.customCategory
            ? data.customCategory.trim()
            : null,
        brandModel: data.brandModel.trim(),
        serialNumber: data.serialNumber.trim().toUpperCase(),
        macAddress: data.macAddress ? data.macAddress.trim() : null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        purchasePrice: price,
        status: data.status,
        homeCustomerId: data.homeCustomerId || null,
        hotspotPartnerId: data.hotspotPartnerId || null,
        notes: data.notes || null,
      },
    });

    // Otomatis masukkan harga beli ke Pengeluaran Buku Kas Keuangan
    if (price > 0) {
      const categoryLabel =
        data.category === DeviceCategory.OTHER && data.customCategory
          ? data.customCategory.trim()
          : data.category;

      await tx.financialTransaction.create({
        data: {
          type: TransactionType.EXPENSE,
          category: FinancialCategory.HARDWARE_PURCHASE,
          amount: price,
          transactionDate: pDate,
          description: `Pembelian Perangkat ${categoryLabel}: ${data.brandModel.trim()} (SN: ${data.serialNumber.trim().toUpperCase()})`,
          referenceId: created.id,
        },
      });
    }

    return created;
  });

  safeRevalidate("/infrastructure");
  safeRevalidate("/customers");
  safeRevalidate("/hotspot");
  safeRevalidate("/finance");
  safeRevalidate("/dashboard");
  return device;
}

export async function updateInventoryDevice(
  id: string,
  data: {
    category?: DeviceCategory;
    customCategory?: string | null;
    brandModel?: string;
    serialNumber?: string;
    macAddress?: string;
    purchaseDate?: string | null;
    purchasePrice?: number;
    status?: DeviceStatus;
    homeCustomerId?: string | null;
    hotspotPartnerId?: string | null;
    notes?: string;
  }
) {
  const device = await prisma.$transaction(async (tx) => {
    const currentDevice = await tx.inventoryDevice.findUnique({
      where: { id },
    });
    if (!currentDevice) throw new Error("Perangkat tidak ditemukan");

    const newCategory = data.category ?? currentDevice.category;
    const newCustomCategory =
      data.customCategory !== undefined
        ? data.customCategory
        : currentDevice.customCategory;
    const newBrand = data.brandModel ?? currentDevice.brandModel;
    const newSN = data.serialNumber ?? currentDevice.serialNumber;
    const newPrice =
      data.purchasePrice !== undefined
        ? Number(data.purchasePrice || 0)
        : currentDevice.purchasePrice || 0;
    const newDate =
      data.purchaseDate !== undefined
        ? data.purchaseDate
          ? new Date(data.purchaseDate)
          : null
        : currentDevice.purchaseDate;

    const updated = await tx.inventoryDevice.update({
      where: { id },
      data: {
        category: data.category,
        customCategory:
          newCategory === DeviceCategory.OTHER
            ? newCustomCategory
              ? newCustomCategory.trim()
              : null
            : null,
        brandModel: data.brandModel ? data.brandModel.trim() : undefined,
        serialNumber: data.serialNumber
          ? data.serialNumber.trim().toUpperCase()
          : undefined,
        macAddress:
          data.macAddress !== undefined
            ? data.macAddress
              ? data.macAddress.trim()
              : null
            : undefined,
        purchaseDate:
          data.purchaseDate !== undefined
            ? data.purchaseDate
              ? new Date(data.purchaseDate)
              : null
            : undefined,
        purchasePrice:
          data.purchasePrice !== undefined
            ? Number(data.purchasePrice || 0)
            : undefined,
        status: data.status,
        homeCustomerId: data.homeCustomerId,
        hotspotPartnerId: data.hotspotPartnerId,
        notes: data.notes,
      },
    });

    // Sinkronisasi dengan catatan transaksi buku kas pengeluaran
    const existingTx = await tx.financialTransaction.findFirst({
      where: {
        referenceId: id,
        category: FinancialCategory.HARDWARE_PURCHASE,
      },
    });

    const categoryLabel =
      newCategory === DeviceCategory.OTHER && newCustomCategory
        ? newCustomCategory.trim()
        : newCategory;

    if (existingTx) {
      if (newPrice > 0) {
        await tx.financialTransaction.update({
          where: { id: existingTx.id },
          data: {
            amount: newPrice,
            transactionDate: newDate ?? existingTx.transactionDate,
            description: `Pembelian Perangkat ${categoryLabel}: ${newBrand.trim()} (SN: ${newSN.trim().toUpperCase()})`,
          },
        });
      } else {
        await tx.financialTransaction.delete({
          where: { id: existingTx.id },
        });
      }
    } else if (newPrice > 0) {
      await tx.financialTransaction.create({
        data: {
          type: TransactionType.EXPENSE,
          category: FinancialCategory.HARDWARE_PURCHASE,
          amount: newPrice,
          transactionDate: newDate ?? new Date(),
          description: `Pembelian Perangkat ${categoryLabel}: ${newBrand.trim()} (SN: ${newSN.trim().toUpperCase()})`,
          referenceId: id,
        },
      });
    }

    return updated;
  });

  safeRevalidate("/infrastructure");
  safeRevalidate("/customers");
  safeRevalidate("/hotspot");
  safeRevalidate("/finance");
  safeRevalidate("/dashboard");
  return device;
}

export async function returnDeviceToStock(deviceId: string) {
  const device = await prisma.inventoryDevice.update({
    where: { id: deviceId },
    data: {
      status: DeviceStatus.IN_STOCK,
      homeCustomerId: null,
      hotspotPartnerId: null,
      oltDeviceId: null,
      odpNodeId: null,
      routerDeviceId: null,
      notes: "Ditarik kembali ke gudang (Cold Spare / Ready)",
    },
  });
  safeRevalidate("/infrastructure");
  safeRevalidate("/customers");
  safeRevalidate("/hotspot");
  safeRevalidate("/topology");
  return device;
}

export async function toggleDeviceActiveStatus(deviceId: string) {
  const existing = await prisma.inventoryDevice.findUnique({
    where: { id: deviceId },
  });
  if (!existing) throw new Error("Perangkat tidak ditemukan");

  const newStatus =
    existing.status === DeviceStatus.INACTIVE
      ? DeviceStatus.IN_STOCK
      : DeviceStatus.INACTIVE;

  const device = await prisma.inventoryDevice.update({
    where: { id: deviceId },
    data: {
      status: newStatus,
      // If deactivating, unlink any customer, hotspot, OLT, ODP, or Router
      ...(newStatus === DeviceStatus.INACTIVE
        ? {
            homeCustomerId: null,
            hotspotPartnerId: null,
            oltDeviceId: null,
            odpNodeId: null,
            routerDeviceId: null,
          }
        : {}),
    },
  });

  safeRevalidate("/infrastructure");
  safeRevalidate("/customers");
  safeRevalidate("/hotspot");
  safeRevalidate("/topology");
  return device;
}

export async function deleteInventoryDevice(deviceId: string) {
  await prisma.$transaction(async (tx) => {
    // Hapus juga transaksi pengeluaran terkait jika ada
    await tx.financialTransaction.deleteMany({
      where: {
        referenceId: deviceId,
        category: FinancialCategory.HARDWARE_PURCHASE,
      },
    });

    await tx.inventoryDevice.delete({
      where: { id: deviceId },
    });
  });

  safeRevalidate("/infrastructure");
  safeRevalidate("/customers");
  safeRevalidate("/hotspot");
  safeRevalidate("/finance");
  safeRevalidate("/dashboard");
}
