"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PaymentMethod, TransactionType, FinancialCategory } from "@prisma/client";

export async function getVoucherPackages() {
  return await prisma.voucherPackage.findMany({
    orderBy: { sellPrice: "asc" },
  });
}

export async function createVoucherPackage(data: {
  name: string;
  sellPrice: number;
  defaultOwnerShare: number;
  defaultPartnerFee: number;
}) {
  const pkg = await prisma.voucherPackage.create({
    data: {
      name: data.name,
      sellPrice: Number(data.sellPrice),
      defaultOwnerShare: Number(data.defaultOwnerShare),
      defaultPartnerFee: Number(data.defaultPartnerFee),
      isActive: true,
    },
  });

  // Automatically create PartnerStock for all existing partners
  const partners = await prisma.hotspotPartner.findMany();
  if (partners.length > 0) {
    await prisma.partnerStock.createMany({
      data: partners.map((p) => ({
        partnerId: p.id,
        packageId: pkg.id,
        quantity: 0,
      })),
      skipDuplicates: true,
    });
  }

  revalidatePath("/hotspot");
  revalidatePath("/dashboard");
  return pkg;
}

export async function updateVoucherPackage(
  id: string,
  data: {
    name?: string;
    sellPrice?: number;
    defaultOwnerShare?: number;
    defaultPartnerFee?: number;
    isActive?: boolean;
  }
) {
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.sellPrice !== undefined) updateData.sellPrice = Number(data.sellPrice);
  if (data.defaultOwnerShare !== undefined) updateData.defaultOwnerShare = Number(data.defaultOwnerShare);
  if (data.defaultPartnerFee !== undefined) updateData.defaultPartnerFee = Number(data.defaultPartnerFee);
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const pkg = await prisma.voucherPackage.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/hotspot");
  revalidatePath("/dashboard");
  return pkg;
}

export async function deleteVoucherPackage(id: string) {
  return await prisma.$transaction(async (tx) => {
    // Clean up dependent stocks and pricings
    await tx.partnerStock.deleteMany({
      where: { packageId: id },
    });

    await tx.partnerCustomPricing.deleteMany({
      where: { packageId: id },
    });

    await tx.voucherDistributionItem.deleteMany({
      where: { packageId: id },
    });

    await tx.voucherSettlementItem.deleteMany({
      where: { packageId: id },
    });

    const deleted = await tx.voucherPackage.delete({
      where: { id },
    });

    revalidatePath("/hotspot");
    revalidatePath("/dashboard");
    return deleted;
  });
}

export async function getHotspotPartners() {
  return await prisma.hotspotPartner.findMany({
    include: {
      odp: true,
      stocks: {
        include: { package: true },
      },
      customPricings: true,
      devices: true,
      settlements: {
        orderBy: { settlementDate: "desc" },
        take: 3,
        include: {
          items: {
            include: { package: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function createHotspotPartner(data: {
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  coordinates?: string;
  odpId?: string;
  odpPort?: number;
  notes?: string;
}) {
  const partner = await prisma.hotspotPartner.create({
    data: {
      name: data.name,
      ownerName: data.ownerName,
      phone: data.phone,
      address: data.address,
      coordinates: data.coordinates || null,
      odpId: data.odpId || null,
      odpPort: data.odpPort ? Number(data.odpPort) : null,
      notes: data.notes || null,
      unpaidBalance: 0,
    },
  });

  // Automatically initialize partner stocks for all active packages
  const packages = await prisma.voucherPackage.findMany({ where: { isActive: true } });
  if (packages.length > 0) {
    await prisma.partnerStock.createMany({
      data: packages.map((pkg) => ({
        partnerId: partner.id,
        packageId: pkg.id,
        quantity: 0,
      })),
      skipDuplicates: true,
    });
  }

  revalidatePath("/hotspot");
  revalidatePath("/infrastructure");
  return partner;
}

export async function updateHotspotPartner(
  id: string,
  data: {
    name?: string;
    ownerName?: string;
    phone?: string;
    address?: string;
    coordinates?: string;
    odpId?: string | null;
    odpPort?: number | null;
    notes?: string;
    unpaidBalance?: number;
  }
) {
  const partner = await prisma.hotspotPartner.update({
    where: { id },
    data,
  });
  revalidatePath("/hotspot");
  revalidatePath("/infrastructure");
  return partner;
}

export async function deleteHotspotPartner(id: string) {
  await prisma.$transaction(async (tx) => {
    // Return deployed devices to IN_STOCK
    await tx.inventoryDevice.updateMany({
      where: { hotspotPartnerId: id },
      data: {
        hotspotPartnerId: null,
        status: "IN_STOCK",
      },
    });

    // Delete partner (cascade deletes stocks, customPricings, distributions, settlements)
    await tx.hotspotPartner.delete({
      where: { id },
    });
  });

  revalidatePath("/hotspot");
  revalidatePath("/infrastructure");
  revalidatePath("/dashboard");
  revalidatePath("/finance");
}

// -------------------------------------------------------------
// LOG DROP VOUCHER (Distribution)
// -------------------------------------------------------------
export async function distributeVouchers(data: {
  partnerId: string;
  distributionDate: string; // ISO date string
  notes?: string;
  items: Array<{
    packageId: string;
    quantity: number;
  }>;
}) {
  const { partnerId, distributionDate, notes, items } = data;
  const filteredItems = items.filter((item) => Number(item.quantity) > 0);

  if (filteredItems.length === 0) {
    throw new Error("Paling sedikit satu paket voucher harus memiliki jumlah drop > 0");
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Create distribution record
    const distribution = await tx.voucherDistribution.create({
      data: {
        partnerId,
        distributionDate: new Date(distributionDate),
        notes: notes || null,
        items: {
          create: filteredItems.map((item) => ({
            packageId: item.packageId,
            quantity: Number(item.quantity),
          })),
        },
      },
    });

    // 2. Increment partner stocks
    for (const item of filteredItems) {
      await tx.partnerStock.upsert({
        where: {
          partnerId_packageId: {
            partnerId,
            packageId: item.packageId,
          },
        },
        update: {
          quantity: {
            increment: Number(item.quantity),
          },
        },
        create: {
          partnerId,
          packageId: item.packageId,
          quantity: Number(item.quantity),
        },
      });
    }

    revalidatePath("/hotspot");
    revalidatePath("/dashboard");
    return distribution;
  });
}

// -------------------------------------------------------------
// LOG TARIK SETORAN (Settlement with Snapshots & Underpayment)
// -------------------------------------------------------------
export async function settleVouchers(data: {
  partnerId: string;
  settlementDate: string; // ISO date string
  paymentMethod: PaymentMethod;
  notes?: string;
  actualReceived: number;
  items: Array<{
    packageId: string;
    soldQuantity: number;
    remainingStock: number;
  }>;
}) {
  const { partnerId, settlementDate, paymentMethod, notes, actualReceived, items } = data;

  return await prisma.$transaction(async (tx) => {
    // Fetch partner with custom pricings
    const partner = await tx.hotspotPartner.findUnique({
      where: { id: partnerId },
      include: {
        customPricings: true,
        stocks: true,
      },
    });

    if (!partner) {
      throw new Error("Data mitra warung tidak ditemukan");
    }

    // Fetch all relevant packages
    const packageIds = items.map((i) => i.packageId);
    const packages = await tx.voucherPackage.findMany({
      where: { id: { in: packageIds } },
    });
    const packageMap = new Map(packages.map((p) => [p.id, p]));

    let expectedTotal = 0;
    const settlementItemsData = [];

    for (const item of items) {
      const pkg = packageMap.get(item.packageId);
      if (!pkg) continue;

      // Check for partner custom pricing override
      const customPrice = partner.customPricings.find((cp) => cp.packageId === item.packageId);
      const ownerShareSnapshot = customPrice ? customPrice.customOwnerShare : pkg.defaultOwnerShare;
      const sellPriceSnapshot = pkg.sellPrice;
      const partnerFeeSnapshot = sellPriceSnapshot - ownerShareSnapshot;

      const soldQty = Number(item.soldQuantity);
      const subtotalOwnerShare = soldQty * ownerShareSnapshot;
      expectedTotal += subtotalOwnerShare;

      settlementItemsData.push({
        packageId: item.packageId,
        soldQuantity: soldQty,
        remainingStock: Number(item.remainingStock),
        sellPriceSnapshot,
        ownerShareSnapshot,
        partnerFeeSnapshot,
        subtotalOwnerShare,
      });

      // Update partner physical stock to the remainingStock directly
      await tx.partnerStock.upsert({
        where: {
          partnerId_packageId: {
            partnerId,
            packageId: item.packageId,
          },
        },
        update: {
          quantity: Number(item.remainingStock),
        },
        create: {
          partnerId,
          packageId: item.packageId,
          quantity: Number(item.remainingStock),
        },
      });
    }

    const actual = Number(actualReceived);
    const shortfallAmount = expectedTotal - actual;

    // Create Settlement Record
    const settlement = await tx.voucherSettlement.create({
      data: {
        partnerId,
        settlementDate: new Date(settlementDate),
        expectedTotal,
        actualReceived: actual,
        shortfallAmount,
        paymentMethod,
        notes: notes || null,
        items: {
          create: settlementItemsData,
        },
      },
    });

    // Update partner's unpaidBalance if there is shortfall or overpayment
    if (shortfallAmount !== 0) {
      await tx.hotspotPartner.update({
        where: { id: partnerId },
        data: {
          unpaidBalance: {
            increment: shortfallAmount,
          },
        },
      });
    }

    // Automatically record INCOME in FinancialTransaction if actual money was received
    if (actual > 0) {
      await tx.financialTransaction.create({
        data: {
          type: TransactionType.INCOME,
          category: FinancialCategory.VOUCHER_HOTSPOT,
          amount: actual,
          transactionDate: new Date(settlementDate),
          description: `Setoran Voucher Hotspot - ${partner.name}${
            shortfallAmount > 0
              ? ` (Kurang Bayar Rp ${shortfallAmount.toLocaleString("id-ID")})`
              : ""
          }`,
          paymentMethod,
          settlementId: settlement.id,
          referenceId: settlement.id,
        },
      });
    }

    revalidatePath("/hotspot");
    revalidatePath("/finance");
    revalidatePath("/dashboard");
    return settlement;
  });
}

// -------------------------------------------------------------
// PAY OFF MITRA PIUTANG (Unpaid Balance Settlement)
// -------------------------------------------------------------
export async function payPartnerUnpaidBalance(data: {
  partnerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}) {
  const { partnerId, amount, paymentMethod, notes } = data;
  return await prisma.$transaction(async (tx) => {
    const partner = await tx.hotspotPartner.findUnique({
      where: { id: partnerId },
    });
    if (!partner) throw new Error("Mitra tidak ditemukan");

    await tx.hotspotPartner.update({
      where: { id: partnerId },
      data: {
        unpaidBalance: {
          decrement: Number(amount),
        },
      },
    });

    await tx.financialTransaction.create({
      data: {
        type: TransactionType.INCOME,
        category: FinancialCategory.VOUCHER_HOTSPOT,
        amount: Number(amount),
        transactionDate: new Date(),
        description: `Pelunasan Piutang Kurang Bayar Voucher - ${partner.name}${
          notes ? ` (${notes})` : ""
        }`,
        paymentMethod,
      },
    });

    revalidatePath("/hotspot");
    revalidatePath("/finance");
    revalidatePath("/dashboard");
  });
}
