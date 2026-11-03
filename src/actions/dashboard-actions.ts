"use server";

import { prisma } from "@/lib/prisma";
import {
  TransactionType,
  FinancialCategory,
  DeviceStatus,
  DeviceCategory,
} from "@prisma/client";

export async function getDashboardData() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
  const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

  // 1. Fetch All Financial Transactions & Group by Month for Cashflow Chart
  const [
    allTransactions,
    monthlyTransactions,
    partners,
    packages,
    devices,
    odpNodes,
    homeCustomers,
    settlementItems,
  ] = await Promise.all([
    prisma.financialTransaction.findMany({
      orderBy: { transactionDate: "asc" },
    }),
    prisma.financialTransaction.findMany({
      where: {
        transactionDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    }),
    prisma.hotspotPartner.findMany({
      include: {
        stocks: {
          include: { package: true },
        },
        customPricings: true,
      },
    }),
    prisma.voucherPackage.findMany(),
    prisma.inventoryDevice.findMany(),
    prisma.odpNode.findMany({
      include: {
        homeCustomers: { select: { odpPort: true } },
        hotspotPartners: { select: { odpPort: true } },
      },
    }),
    prisma.homeCustomer.findMany({
      select: { id: true, status: true },
    }),
    prisma.voucherSettlement.findMany({
      include: {
        partner: true,
      },
    }),
  ]);

  // Overall Kas Bersih
  const totalIncomeAll = allTransactions
    .filter((t) => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenseAll = allTransactions
    .filter((t) => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalKasBersih = totalIncomeAll - totalExpenseAll;

  // Monthly Income & Breakdown
  const pemasukanBulanIni = monthlyTransactions
    .filter((t) => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.amount, 0);

  const pengeluaranBulanIni = monthlyTransactions
    .filter((t) => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);

  const incomeVoucherBulanIni = monthlyTransactions
    .filter((t) => t.category === FinancialCategory.VOUCHER_HOTSPOT)
    .reduce((sum, t) => sum + t.amount, 0);

  const incomeBulananBulanIni = monthlyTransactions
    .filter((t) => t.category === FinancialCategory.MONTHLY_BILLING)
    .reduce((sum, t) => sum + t.amount, 0);

  const incomePasangBaruBulanIni = monthlyTransactions
    .filter((t) => t.category === FinancialCategory.INSTALLATION_FEE)
    .reduce((sum, t) => sum + t.amount, 0);

  const incomeLainnyaBulanIni = monthlyTransactions
    .filter((t) => t.category === FinancialCategory.OTHER_INCOME)
    .reduce((sum, t) => sum + t.amount, 0);

  // Total Piutang Warung (unpaidBalance)
  const totalUnpaidBalance = partners.reduce((sum, p) => sum + p.unpaidBalance, 0);

  // Sisa Nilai Voucher Konsinyasi di Warung (Physical active stock value)
  let totalConsignmentStockValue = 0;
  for (const partner of partners) {
    for (const stock of partner.stocks) {
      const customPrice = partner.customPricings.find((cp) => cp.packageId === stock.packageId);
      const ownerShare = customPrice ? customPrice.customOwnerShare : stock.package.defaultOwnerShare;
      totalConsignmentStockValue += stock.quantity * ownerShare;
    }
  }

  // Device Inventory Summary
  const devicesInStock = devices.filter((d) => d.status === DeviceStatus.IN_STOCK).length;
  const devicesDeployedHome = devices.filter((d) => d.status === DeviceStatus.DEPLOYED_HOME).length;
  const devicesDeployedHotspot = devices.filter((d) => d.status === DeviceStatus.DEPLOYED_HOTSPOT).length;
  const devicesDeployedTotal = devicesDeployedHome + devicesDeployedHotspot;
  const devicesBroken = devices.filter((d) => d.status === DeviceStatus.BROKEN).length;
  const totalDevices = devices.length;

  // ODP Ports Summary
  let totalOdpCapacity = 0;
  let occupiedOdpPorts = 0;
  for (const odp of odpNodes) {
    totalOdpCapacity += odp.splitterCapacity;
    const occupiedPortsSet = new Set<number>();
    odp.homeCustomers.forEach((c) => c.odpPort && occupiedPortsSet.add(c.odpPort));
    odp.hotspotPartners.forEach((hp) => hp.odpPort && occupiedPortsSet.add(hp.odpPort));
    occupiedOdpPorts += occupiedPortsSet.size;
  }
  const sisaPortOdp = Math.max(0, totalOdpCapacity - occupiedOdpPorts);

  // -------------------------------------------------------------
  // CHART 1: Monthly Cashflow Trend (Past 6 Months)
  // -------------------------------------------------------------
  const monthsTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - 1 - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const label = d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });

    const txInMonth = allTransactions.filter((tx) => {
      const txDate = new Date(tx.transactionDate);
      return txDate.getFullYear() === y && txDate.getMonth() + 1 === m;
    });

    const income = txInMonth
      .filter((tx) => tx.type === TransactionType.INCOME)
      .reduce((s, tx) => s + tx.amount, 0);

    const expense = txInMonth
      .filter((tx) => tx.type === TransactionType.EXPENSE)
      .reduce((s, tx) => s + tx.amount, 0);

    monthsTrend.push({
      label,
      income,
      expense,
      net: income - expense,
    });
  }

  // -------------------------------------------------------------
  // CHART 2: Income Composition (All-time or Past 90 Days)
  // -------------------------------------------------------------
  const totalVoucherAll = allTransactions
    .filter((t) => t.category === FinancialCategory.VOUCHER_HOTSPOT)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCustomerAll = allTransactions
    .filter((t) => t.category === FinancialCategory.MONTHLY_BILLING)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalInstallationAll = allTransactions
    .filter((t) => t.category === FinancialCategory.INSTALLATION_FEE)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOtherAll = allTransactions
    .filter((t) => t.category === FinancialCategory.OTHER_INCOME)
    .reduce((sum, t) => sum + t.amount, 0);

  // -------------------------------------------------------------
  // CHART 3: Top 5 Titik Hotspot / Warung
  // -------------------------------------------------------------
  const partnerSettlementMap = new Map<string, { name: string; totalRevenue: number }>();
  partners.forEach((p) => {
    partnerSettlementMap.set(p.id, { name: p.name, totalRevenue: 0 });
  });

  allTransactions
    .filter((tx) => tx.category === FinancialCategory.VOUCHER_HOTSPOT && tx.settlementId)
    .forEach((tx) => {
      const settlement = settlementItems.find((s) => s.id === tx.settlementId);
      if (settlement && partnerSettlementMap.has(settlement.partnerId)) {
        const item = partnerSettlementMap.get(settlement.partnerId)!;
        item.totalRevenue += tx.amount;
      }
    });

  const topPartners = Array.from(partnerSettlementMap.values())
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  return {
    kpis: {
      totalKasBersih,
      totalIncomeAll,
      totalExpenseAll,
      pemasukanBulanIni,
      pengeluaranBulanIni,
      incomeVoucherBulanIni,
      incomeBulananBulanIni,
      incomePasangBaruBulanIni,
      incomeLainnyaBulanIni,
      totalUnpaidBalance,
      totalConsignmentStockValue,
      totalVoucherValueInField: totalUnpaidBalance + totalConsignmentStockValue,
      devicesInStock,
      devicesDeployedTotal,
      devicesDeployedHome,
      devicesDeployedHotspot,
      devicesBroken,
      totalDevices,
      totalOdpCapacity,
      occupiedOdpPorts,
      sisaPortOdp,
      activeCustomersCount: homeCustomers.filter((c) => c.status === "ACTIVE").length,
      totalPartnersCount: partners.length,
    },
    cashflowTrend: monthsTrend,
    incomeComposition: {
      labels: ["Voucher Hotspot", "Tagihan Rumahan", "Biaya Pasang Baru", "Lainnya"],
      data: [totalVoucherAll, totalCustomerAll, totalInstallationAll, totalOtherAll],
    },
    topPartners,
  };
}
