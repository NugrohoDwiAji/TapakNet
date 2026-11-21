"use server";

import { prisma } from "@/lib/prisma";
import {
  TransactionType,
  FinancialCategory,
  DeviceStatus,
  CustomerStatus,
} from "@prisma/client";

export async function getDashboardData() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
  const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
  const sixMonthsAgo = new Date(currentYear, currentMonth - 6, 1);

  // Execute optimized aggregations and selective queries in parallel
  const [
    totalIncomeAgg,
    totalExpenseAgg,
    monthlyExpenseAgg,
    monthlyIncomeByCategory,
    allTimeIncomeByCategory,
    trendTransactions,
    deviceStatusCounts,
    activeCustomersCount,
    odpNodes,
    partners,
    topSettlements,
  ] = await Promise.all([
    // 1. Overall Income Sum (Pure SQL aggregation)
    prisma.financialTransaction.aggregate({
      _sum: { amount: true },
      where: { type: TransactionType.INCOME },
    }),
    // 2. Overall Expense Sum
    prisma.financialTransaction.aggregate({
      _sum: { amount: true },
      where: { type: TransactionType.EXPENSE },
    }),
    // 3. Monthly Expense Sum
    prisma.financialTransaction.aggregate({
      _sum: { amount: true },
      where: {
        type: TransactionType.EXPENSE,
        transactionDate: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
    // 4. Monthly Income grouped by Category
    prisma.financialTransaction.groupBy({
      by: ["category"],
      _sum: { amount: true },
      where: {
        type: TransactionType.INCOME,
        transactionDate: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
    // 5. All-Time Income grouped by Category (for Chart 2 composition)
    prisma.financialTransaction.groupBy({
      by: ["category"],
      _sum: { amount: true },
      where: { type: TransactionType.INCOME },
    }),
    // 6. Only past 6-month transactions for trend (only necessary columns)
    prisma.financialTransaction.findMany({
      where: { transactionDate: { gte: sixMonthsAgo } },
      select: {
        amount: true,
        type: true,
        transactionDate: true,
      },
    }),
    // 7. Inventory device count by status (Pure SQL group count)
    prisma.inventoryDevice.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    // 8. Active customers count (Pure SQL count)
    prisma.homeCustomer.count({
      where: { status: CustomerStatus.ACTIVE },
    }),
    // 9. ODP capacity and occupied port selections
    prisma.odpNode.findMany({
      select: {
        splitterCapacity: true,
        homeCustomers: { select: { odpPort: true } },
        hotspotPartners: { select: { odpPort: true } },
        childOdps: { select: { parentOdpPort: true } },
      },
    }),
    // 10. Partners for stocks & unpaid balance (selective fields only)
    prisma.hotspotPartner.findMany({
      select: {
        id: true,
        name: true,
        unpaidBalance: true,
        stocks: {
          select: {
            packageId: true,
            quantity: true,
            package: { select: { defaultOwnerShare: true } },
          },
        },
        customPricings: {
          select: {
            packageId: true,
            customOwnerShare: true,
          },
        },
      },
    }),
    // 11. Top 5 partners by actual received revenue
    prisma.voucherSettlement.groupBy({
      by: ["partnerId"],
      _sum: { actualReceived: true },
      orderBy: {
        _sum: { actualReceived: "desc" },
      },
      take: 5,
    }),
  ]);

  // Overall Kas Bersih
  const totalIncomeAll = totalIncomeAgg._sum.amount || 0;
  const totalExpenseAll = totalExpenseAgg._sum.amount || 0;
  const totalKasBersih = totalIncomeAll - totalExpenseAll;

  // Monthly Income & Breakdown
  const pengeluaranBulanIni = monthlyExpenseAgg._sum.amount || 0;
  let incomeVoucherBulanIni = 0;
  let incomeBulananBulanIni = 0;
  let incomePasangBaruBulanIni = 0;
  let incomeLainnyaBulanIni = 0;
  let pemasukanBulanIni = 0;

  for (const group of monthlyIncomeByCategory) {
    const amt = group._sum.amount || 0;
    pemasukanBulanIni += amt;
    if (group.category === FinancialCategory.VOUCHER_HOTSPOT) incomeVoucherBulanIni = amt;
    else if (group.category === FinancialCategory.MONTHLY_BILLING) incomeBulananBulanIni = amt;
    else if (group.category === FinancialCategory.INSTALLATION_FEE) incomePasangBaruBulanIni = amt;
    else if (group.category === FinancialCategory.OTHER_INCOME) incomeLainnyaBulanIni = amt;
  }

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
  let devicesInStock = 0;
  let devicesDeployedHome = 0;
  let devicesDeployedHotspot = 0;
  let devicesBroken = 0;
  let totalDevices = 0;

  for (const d of deviceStatusCounts) {
    const cnt = d._count._all;
    totalDevices += cnt;
    if (d.status === DeviceStatus.IN_STOCK) devicesInStock = cnt;
    else if (d.status === DeviceStatus.DEPLOYED_HOME) devicesDeployedHome = cnt;
    else if (d.status === DeviceStatus.DEPLOYED_HOTSPOT) devicesDeployedHotspot = cnt;
    else if (d.status === DeviceStatus.BROKEN) devicesBroken = cnt;
  }
  const devicesDeployedTotal = devicesDeployedHome + devicesDeployedHotspot;

  // ODP Ports Summary (includes cascading child splitters)
  let totalOdpCapacity = 0;
  let occupiedOdpPorts = 0;
  for (const odp of odpNodes) {
    totalOdpCapacity += odp.splitterCapacity;
    const occupiedPortsSet = new Set<number>();
    odp.homeCustomers.forEach((c) => c.odpPort && occupiedPortsSet.add(c.odpPort));
    odp.hotspotPartners.forEach((hp) => hp.odpPort && occupiedPortsSet.add(hp.odpPort));
    odp.childOdps.forEach((co) => co.parentOdpPort && occupiedPortsSet.add(co.parentOdpPort));
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

    const txInMonth = trendTransactions.filter((tx) => {
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
  // CHART 2: Income Composition (All-time)
  // -------------------------------------------------------------
  let totalVoucherAll = 0;
  let totalCustomerAll = 0;
  let totalInstallationAll = 0;
  let totalOtherAll = 0;

  for (const group of allTimeIncomeByCategory) {
    const amt = group._sum.amount || 0;
    if (group.category === FinancialCategory.VOUCHER_HOTSPOT) totalVoucherAll = amt;
    else if (group.category === FinancialCategory.MONTHLY_BILLING) totalCustomerAll = amt;
    else if (group.category === FinancialCategory.INSTALLATION_FEE) totalInstallationAll = amt;
    else if (group.category === FinancialCategory.OTHER_INCOME) totalOtherAll = amt;
  }

  // -------------------------------------------------------------
  // CHART 3: Top 5 Titik Hotspot / Warung
  // -------------------------------------------------------------
  const partnerNameMap = new Map(partners.map((p) => [p.id, p.name]));
  const topPartners = topSettlements
    .map((s) => ({
      name: partnerNameMap.get(s.partnerId) || "Mitra Warung",
      totalRevenue: s._sum.actualReceived || 0,
    }))
    .filter((p) => p.totalRevenue > 0);

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
      activeCustomersCount,
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
