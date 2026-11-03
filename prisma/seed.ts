import {
  PrismaClient,
  CustomerStatus,
  InvoiceStatus,
  PaymentMethod,
  DeviceCategory,
  DeviceStatus,
  TransactionType,
  FinancialCategory,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting realistic Indonesian RT/RW Net seed for tapakNet...");

  // Clean existing data in reverse order of foreign keys
  await prisma.financialTransaction.deleteMany();
  await prisma.customerInvoice.deleteMany();
  await prisma.inventoryDevice.deleteMany();
  await prisma.homeCustomer.deleteMany();
  await prisma.voucherSettlementItem.deleteMany();
  await prisma.voucherSettlement.deleteMany();
  await prisma.voucherDistributionItem.deleteMany();
  await prisma.voucherDistribution.deleteMany();
  await prisma.partnerCustomPricing.deleteMany();
  await prisma.partnerStock.deleteMany();
  await prisma.hotspotPartner.deleteMany();
  await prisma.voucherPackage.deleteMany();
  await prisma.odpNode.deleteMany();
  await prisma.oltDevice.deleteMany();

  // 1. OLT Devices
  const olt1 = await prisma.oltDevice.create({
    data: {
      name: "OLT ZTE C320 POP Puyung",
      brandModel: "ZTE C320 EPON/GPON 4-Port",
      localIp: "192.168.10.2",
      ponPortsCount: 4,
      location: "NOC Utama TapakNet (Rumah Server)",
      notes: "Uplink SFP 1G ke Core MikroTik CCR1009",
    },
  });

  // 2. ODP Nodes
  const odp1 = await prisma.odpNode.create({
    data: {
      code: "ODP-01-PASAR",
      oltId: olt1.id,
      ponPortNumber: 1,
      splitterCapacity: 8,
      coordinates: "-8.5833, 116.1167",
      opticalPowerDbm: -18.4,
      notes: "Tiang Depan Pasar Puyung, box ODP 8 core",
    },
  });

  const odp2 = await prisma.odpNode.create({
    data: {
      code: "ODP-02-KOMPLEK",
      oltId: olt1.id,
      ponPortNumber: 1,
      splitterCapacity: 8,
      coordinates: "-8.5845, 116.1180",
      opticalPowerDbm: -19.1,
      notes: "Tiang Gang Musholla Al-Ikhlas",
    },
  });

  const odp3 = await prisma.odpNode.create({
    data: {
      code: "ODP-03-JALANUTAMA",
      oltId: olt1.id,
      ponPortNumber: 2,
      splitterCapacity: 16,
      coordinates: "-8.5860, 116.1205",
      opticalPowerDbm: -17.8,
      notes: "Pertigaan Tiang Telkom Jl. Utama",
    },
  });

  // 3. Master Voucher Packages
  const pkg2k = await prisma.voucherPackage.create({
    data: {
      name: "Voucher 2.000 (3 Jam)",
      sellPrice: 2000,
      defaultOwnerShare: 1500,
      defaultPartnerFee: 500,
      isActive: true,
    },
  });

  const pkg3k = await prisma.voucherPackage.create({
    data: {
      name: "Voucher 3.000 (6 Jam)",
      sellPrice: 3000,
      defaultOwnerShare: 2300,
      defaultPartnerFee: 700,
      isActive: true,
    },
  });

  const pkg5k = await prisma.voucherPackage.create({
    data: {
      name: "Voucher 5.000 (24 Jam)",
      sellPrice: 5000,
      defaultOwnerShare: 4000,
      defaultPartnerFee: 1000,
      isActive: true,
    },
  });

  // 4. Hotspot Partners (Mitra Warung Titik Hotspot)
  const partner1 = await prisma.hotspotPartner.create({
    data: {
      name: "Warkop Bu Dewi",
      ownerName: "Ibu Dewi Lestari",
      phone: "081234567890",
      address: "Jl. Puyung No. 12, RT 02/01",
      coordinates: "-8.5835, 116.1168",
      odpId: odp1.id,
      odpPort: 1,
      unpaidBalance: 0,
      notes: "Warung ramai anak muda malam hari, pasang AP outdoor CPE220",
    },
  });

  const partner2 = await prisma.hotspotPartner.create({
    data: {
      name: "Toko Madura Bang Ali",
      ownerName: "Bang Ali Ridho",
      phone: "081398765432",
      address: "Dekat Lapangan Bola RT 03/02",
      coordinates: "-8.5850, 116.1190",
      odpId: odp2.id,
      odpPort: 1,
      unpaidBalance: 15000, // Ada sisa kurang bayar Rp 15.000
      notes: "Buka 24 jam nonstop, penjualan voucher konsisten",
    },
  });

  const partner3 = await prisma.hotspotPartner.create({
    data: {
      name: "Warung Makan Mbak Siti",
      ownerName: "Mbak Siti Rahma",
      phone: "085233445566",
      address: "Pertigaan Jl. Utama No. 4",
      coordinates: "-8.5862, 116.1208",
      odpId: odp3.id,
      odpPort: 1,
      unpaidBalance: 0,
      notes: "Titik strategis dekat pasar, outdoor AP LiteBeam",
    },
  });

  // Initial Stocks for Partners
  await prisma.partnerStock.createMany({
    data: [
      { partnerId: partner1.id, packageId: pkg2k.id, quantity: 45 },
      { partnerId: partner1.id, packageId: pkg3k.id, quantity: 20 },
      { partnerId: partner1.id, packageId: pkg5k.id, quantity: 30 },
      { partnerId: partner2.id, packageId: pkg2k.id, quantity: 60 },
      { partnerId: partner2.id, packageId: pkg5k.id, quantity: 40 },
      { partnerId: partner3.id, packageId: pkg2k.id, quantity: 25 },
      { partnerId: partner3.id, packageId: pkg3k.id, quantity: 15 },
      { partnerId: partner3.id, packageId: pkg5k.id, quantity: 20 },
    ],
  });

  // Sample Distribution Log
  const dist1 = await prisma.voucherDistribution.create({
    data: {
      partnerId: partner1.id,
      distributionDate: new Date(Date.now() - 14 * 24 * 3600 * 1000),
      notes: "Drop voucher stok awal bulan",
      items: {
        create: [
          { packageId: pkg2k.id, quantity: 100 },
          { packageId: pkg3k.id, quantity: 50 },
          { packageId: pkg5k.id, quantity: 50 },
        ],
      },
    },
  });

  // Sample Settlement Log with Underpayment & Financial Record
  const settlementDate1 = new Date(Date.now() - 3 * 24 * 3600 * 1000);
  const settlement1 = await prisma.voucherSettlement.create({
    data: {
      partnerId: partner1.id,
      settlementDate: settlementDate1,
      expectedTotal: 232500, // 55 * 1500 + 30 * 2300 + 20 * 4000 = 82500 + 69000 + 80000 = 231500
      actualReceived: 230000,
      shortfallAmount: 1500,
      paymentMethod: PaymentMethod.CASH,
      notes: "Setoran mingguan Bu Dewi, kurang 1.500 dibulatkan nanti",
      items: {
        create: [
          {
            packageId: pkg2k.id,
            soldQuantity: 55,
            remainingStock: 45,
            sellPriceSnapshot: 2000,
            ownerShareSnapshot: 1500,
            partnerFeeSnapshot: 500,
            subtotalOwnerShare: 82500,
          },
          {
            packageId: pkg3k.id,
            soldQuantity: 30,
            remainingStock: 20,
            sellPriceSnapshot: 3000,
            ownerShareSnapshot: 2300,
            partnerFeeSnapshot: 700,
            subtotalOwnerShare: 69000,
          },
          {
            packageId: pkg5k.id,
            soldQuantity: 20,
            remainingStock: 30,
            sellPriceSnapshot: 5000,
            ownerShareSnapshot: 4000,
            partnerFeeSnapshot: 1000,
            subtotalOwnerShare: 80000,
          },
        ],
      },
    },
  });

  // Link to Financial Transaction
  await prisma.financialTransaction.create({
    data: {
      type: TransactionType.INCOME,
      category: FinancialCategory.VOUCHER_HOTSPOT,
      amount: 230000,
      transactionDate: settlementDate1,
      description: `Setoran Voucher Hotspot - Warkop Bu Dewi (Settlement #${settlement1.id.slice(0, 8)})`,
      paymentMethod: PaymentMethod.CASH,
      settlementId: settlement1.id,
      referenceId: settlement1.id,
    },
  });

  // Settlement for Bang Ali (Last week)
  const settlementDate2 = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const settlement2 = await prisma.voucherSettlement.create({
    data: {
      partnerId: partner2.id,
      settlementDate: settlementDate2,
      expectedTotal: 260000, // 40 * 1500 + 50 * 4000 = 60000 + 200000
      actualReceived: 245000,
      shortfallAmount: 15000,
      paymentMethod: PaymentMethod.TRANSFER,
      notes: "Bang Ali transfer 245k, sisa 15k masuk piutang warung",
      items: {
        create: [
          {
            packageId: pkg2k.id,
            soldQuantity: 40,
            remainingStock: 60,
            sellPriceSnapshot: 2000,
            ownerShareSnapshot: 1500,
            partnerFeeSnapshot: 500,
            subtotalOwnerShare: 60000,
          },
          {
            packageId: pkg5k.id,
            soldQuantity: 50,
            remainingStock: 40,
            sellPriceSnapshot: 5000,
            ownerShareSnapshot: 4000,
            partnerFeeSnapshot: 1000,
            subtotalOwnerShare: 200000,
          },
        ],
      },
    },
  });

  await prisma.financialTransaction.create({
    data: {
      type: TransactionType.INCOME,
      category: FinancialCategory.VOUCHER_HOTSPOT,
      amount: 245000,
      transactionDate: settlementDate2,
      description: `Setoran Voucher Hotspot - Toko Madura Bang Ali (Settlement #${settlement2.id.slice(0, 8)})`,
      paymentMethod: PaymentMethod.TRANSFER,
      settlementId: settlement2.id,
      referenceId: settlement2.id,
    },
  });

  // 5. Home Customers (Pelanggan Rumahan PPPoE)
  const cust1 = await prisma.homeCustomer.create({
    data: {
      name: "Bapak H. Rohman",
      phone: "081912345678",
      address: "RT 01 RW 01 Puyung Barat",
      coordinates: "-8.5830, 116.1165",
      mikhmonUsername: "rohman_home",
      packageName: "10 Mbps Hemat",
      monthlyFee: 150000,
      installationFee: 200000,
      dueDay: 10,
      status: CustomerStatus.ACTIVE,
      odpId: odp1.id,
      odpPort: 2,
      signalDbm: -19.2,
      notes: "Pelanggan setia sejak 2025, kabel dropcore 75 meter",
    },
  });

  const cust2 = await prisma.homeCustomer.create({
    data: {
      name: "Pak Guru Ahmad",
      phone: "082155667788",
      address: "RT 02 RW 01 Puyung Timur",
      coordinates: "-8.5838, 116.1172",
      mikhmonUsername: "ahmad_pppoe",
      packageName: "20 Mbps Keluarga",
      monthlyFee: 200000,
      installationFee: 250000,
      dueDay: 5,
      status: CustomerStatus.ACTIVE,
      odpId: odp1.id,
      odpPort: 3,
      signalDbm: -20.1,
      notes: "Rumah lantai 2, sering dipakai Google Meet",
    },
  });

  const cust3 = await prisma.homeCustomer.create({
    data: {
      name: "Ibu Nurul Hidayah",
      phone: "087788990011",
      address: "RT 03 RW 02 Gang Melati No. 8",
      coordinates: "-8.5847, 116.1183",
      mikhmonUsername: "nurul_wifi",
      packageName: "10 Mbps Hemat",
      monthlyFee: 150000,
      installationFee: 200000,
      dueDay: 15,
      status: CustomerStatus.ACTIVE,
      odpId: odp2.id,
      odpPort: 2,
      signalDbm: -18.8,
      notes: "Dekat Musholla Al-Ikhlas",
    },
  });

  const cust4 = await prisma.homeCustomer.create({
    data: {
      name: "Mas Rendy Desain",
      phone: "089612344321",
      address: "RT 04 RW 02 Perum Griya Puyung",
      coordinates: "-8.5852, 116.1195",
      mikhmonUsername: "rendy_freelance",
      packageName: "30 Mbps Bisnis/Gamer",
      monthlyFee: 275000,
      installationFee: 300000,
      dueDay: 1,
      status: CustomerStatus.ACTIVE,
      odpId: odp2.id,
      odpPort: 3,
      signalDbm: -17.5,
      notes: "Freelance designer, butuh upload kencang dan latency rendah",
    },
  });

  const cust5 = await prisma.homeCustomer.create({
    data: {
      name: "Pak RT Supardi",
      phone: "081233441122",
      address: "Balai RT 01 Puyung",
      coordinates: "-8.5865, 116.1210",
      mikhmonUsername: "rt_supardi",
      packageName: "15 Mbps Komunitas",
      monthlyFee: 165000,
      installationFee: 0,
      dueDay: 10,
      status: CustomerStatus.ACTIVE,
      odpId: odp3.id,
      odpPort: 2,
      signalDbm: -18.2,
      notes: "Kantor RT, wifi dipakai warga saat pertemuan lingkungan",
    },
  });

  // Current year & month
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  // Invoices for Home Customers (Past month - all paid)
  for (const c of [cust1, cust2, cust3, cust4, cust5]) {
    const invPrev = await prisma.customerInvoice.create({
      data: {
        customerId: c.id,
        year: prevYear,
        month: prevMonth,
        amount: c.monthlyFee,
        status: InvoiceStatus.PAID,
        dueDate: new Date(prevYear, prevMonth - 1, c.dueDay),
        paidAt: new Date(prevYear, prevMonth - 1, c.dueDay - 1),
        paymentMethod: PaymentMethod.TRANSFER,
        notes: "Lunas via transfer BCA",
      },
    });

    await prisma.financialTransaction.create({
      data: {
        type: TransactionType.INCOME,
        category: FinancialCategory.MONTHLY_BILLING,
        amount: c.monthlyFee,
        transactionDate: invPrev.paidAt!,
        description: `Tagihan Bulanan ${c.name} (Bulan ${prevMonth}/${prevYear})`,
        paymentMethod: PaymentMethod.TRANSFER,
        invoiceId: invPrev.id,
        referenceId: invPrev.id,
      },
    });
  }

  // Invoices for Current Month (some paid, some pending)
  // cust1: PAID
  const inv1 = await prisma.customerInvoice.create({
    data: {
      customerId: cust1.id,
      year: currentYear,
      month: currentMonth,
      amount: cust1.monthlyFee,
      status: InvoiceStatus.PAID,
      dueDate: new Date(currentYear, currentMonth - 1, cust1.dueDay),
      paidAt: new Date(currentYear, currentMonth - 1, Math.min(cust1.dueDay, 2)),
      paymentMethod: PaymentMethod.CASH,
      notes: "Bayar tunai ke teknisi",
    },
  });
  await prisma.financialTransaction.create({
    data: {
      type: TransactionType.INCOME,
      category: FinancialCategory.MONTHLY_BILLING,
      amount: cust1.monthlyFee,
      transactionDate: inv1.paidAt!,
      description: `Tagihan Bulanan ${cust1.name} (Bulan ${currentMonth}/${currentYear})`,
      paymentMethod: PaymentMethod.CASH,
      invoiceId: inv1.id,
      referenceId: inv1.id,
    },
  });

  // cust2: PAID
  const inv2 = await prisma.customerInvoice.create({
    data: {
      customerId: cust2.id,
      year: currentYear,
      month: currentMonth,
      amount: cust2.monthlyFee,
      status: InvoiceStatus.PAID,
      dueDate: new Date(currentYear, currentMonth - 1, cust2.dueDay),
      paidAt: new Date(currentYear, currentMonth - 1, cust2.dueDay),
      paymentMethod: PaymentMethod.TRANSFER,
      notes: "Transfer Mandiri",
    },
  });
  await prisma.financialTransaction.create({
    data: {
      type: TransactionType.INCOME,
      category: FinancialCategory.MONTHLY_BILLING,
      amount: cust2.monthlyFee,
      transactionDate: inv2.paidAt!,
      description: `Tagihan Bulanan ${cust2.name} (Bulan ${currentMonth}/${currentYear})`,
      paymentMethod: PaymentMethod.TRANSFER,
      invoiceId: inv2.id,
      referenceId: inv2.id,
    },
  });

  // cust3, cust4, cust5: PENDING
  await prisma.customerInvoice.create({
    data: {
      customerId: cust3.id,
      year: currentYear,
      month: currentMonth,
      amount: cust3.monthlyFee,
      status: InvoiceStatus.PENDING,
      dueDate: new Date(currentYear, currentMonth - 1, cust3.dueDay),
      notes: "Jatuh tempo tgl 15",
    },
  });

  await prisma.customerInvoice.create({
    data: {
      customerId: cust4.id,
      year: currentYear,
      month: currentMonth,
      amount: cust4.monthlyFee,
      status: InvoiceStatus.PENDING,
      dueDate: new Date(currentYear, currentMonth - 1, cust4.dueDay),
      notes: "Jatuh tempo tgl 1",
    },
  });

  await prisma.customerInvoice.create({
    data: {
      customerId: cust5.id,
      year: currentYear,
      month: currentMonth,
      amount: cust5.monthlyFee,
      status: InvoiceStatus.PENDING,
      dueDate: new Date(currentYear, currentMonth - 1, cust5.dueDay),
      notes: "Jatuh tempo tgl 10",
    },
  });

  // Installation Fee income record for recent customer
  await prisma.financialTransaction.create({
    data: {
      type: TransactionType.INCOME,
      category: FinancialCategory.INSTALLATION_FEE,
      amount: 250000,
      transactionDate: new Date(Date.now() - 20 * 24 * 3600 * 1000),
      description: `Biaya Pasang Baru Pelanggan - ${cust2.name}`,
      paymentMethod: PaymentMethod.TRANSFER,
    },
  });

  // 6. Inventory Devices (Perangkat / Gudang)
  await prisma.inventoryDevice.createMany({
    data: [
      {
        category: DeviceCategory.ONT,
        brandModel: "ZTE F609 V3 (GPON)",
        serialNumber: "ZTEGC8921340",
        macAddress: "B8:3A:5A:11:22:33",
        purchaseDate: new Date("2025-01-15"),
        purchasePrice: 185000,
        status: DeviceStatus.DEPLOYED_HOME,
        homeCustomerId: cust1.id,
        notes: "Terpasang di rumah Pak H. Rohman",
      },
      {
        category: DeviceCategory.ONT,
        brandModel: "Huawei HG8245H5",
        serialNumber: "4857544329B81A01",
        macAddress: "A4:93:3F:44:55:66",
        purchaseDate: new Date("2025-02-10"),
        purchasePrice: 220000,
        status: DeviceStatus.DEPLOYED_HOME,
        homeCustomerId: cust2.id,
        notes: "Terpasang di rumah Pak Ahmad",
      },
      {
        category: DeviceCategory.ONT,
        brandModel: "ZTE F609 V5",
        serialNumber: "ZTEGC9981241",
        macAddress: "D4:6E:0E:77:88:99",
        purchaseDate: new Date("2025-03-01"),
        purchasePrice: 195000,
        status: DeviceStatus.DEPLOYED_HOME,
        homeCustomerId: cust3.id,
        notes: "Terpasang di Ibu Nurul",
      },
      {
        category: DeviceCategory.ONT,
        brandModel: "Huawei HG8245H5 Dual Band",
        serialNumber: "485754433AC55E02",
        macAddress: "A4:93:3F:AA:BB:CC",
        purchaseDate: new Date("2025-04-12"),
        purchasePrice: 260000,
        status: DeviceStatus.DEPLOYED_HOME,
        homeCustomerId: cust4.id,
        notes: "Terpasang di Mas Rendy (5GHz ready)",
      },
      {
        category: DeviceCategory.AP_OUTDOOR,
        brandModel: "TP-Link CPE220 2.4GHz High Power",
        serialNumber: "22091A4B0012",
        macAddress: "50:C7:BF:12:34:56",
        purchaseDate: new Date("2025-01-20"),
        purchasePrice: 480000,
        status: DeviceStatus.DEPLOYED_HOTSPOT,
        hotspotPartnerId: partner1.id,
        notes: "Terpasang di tiang depan Warkop Bu Dewi",
      },
      {
        category: DeviceCategory.AP_OUTDOOR,
        brandModel: "Ubiquiti LiteBeam M5 / AC",
        serialNumber: "UBNTLBE99120",
        macAddress: "78:8A:20:98:76:54",
        purchaseDate: new Date("2025-02-15"),
        purchasePrice: 750000,
        status: DeviceStatus.DEPLOYED_HOTSPOT,
        hotspotPartnerId: partner2.id,
        notes: "Terpasang di atap Toko Madura Bang Ali",
      },
      {
        category: DeviceCategory.ONT,
        brandModel: "ZTE F609 V3",
        serialNumber: "ZTEGC7711200",
        macAddress: "B8:3A:5A:99:88:77",
        purchaseDate: new Date("2025-05-10"),
        purchasePrice: 185000,
        status: DeviceStatus.IN_STOCK,
        notes: "Stok baru di lemari gudang NOC TapakNet",
      },
      {
        category: DeviceCategory.ONT,
        brandModel: "Huawei HG8245H5",
        serialNumber: "4857544381C10D44",
        macAddress: "A4:93:3F:66:77:88",
        purchaseDate: new Date("2025-05-10"),
        purchasePrice: 220000,
        status: DeviceStatus.IN_STOCK,
        notes: "Stok baru di lemari gudang",
      },
      {
        category: DeviceCategory.ROUTER,
        brandModel: "MikroTik hEX RB750Gr3",
        serialNumber: "RB750-G3-2024A",
        macAddress: "6C:3B:6B:11:00:22",
        purchaseDate: new Date("2025-01-05"),
        purchasePrice: 720000,
        status: DeviceStatus.IN_STOCK,
        notes: "Router cadangan cold-spare",
      },
      {
        category: DeviceCategory.SWITCH,
        brandModel: "TP-Link TL-SG108E Gigabit 8-Port",
        serialNumber: "TLSG108E-9800",
        macAddress: "00:31:92:44:11:88",
        purchaseDate: new Date("2025-02-01"),
        purchasePrice: 310000,
        status: DeviceStatus.IN_STOCK,
        notes: "Switch managed VLAN ready",
      },
      {
        category: DeviceCategory.ONT,
        brandModel: "ZTE F609 V1",
        serialNumber: "ZTEGC0001928",
        macAddress: "00:1E:E3:44:22:11",
        purchaseDate: new Date("2024-06-01"),
        purchasePrice: 150000,
        status: DeviceStatus.BROKEN,
        notes: "Port PON rusak tersambar petir saat hujan lebat",
      },
    ],
  });

  // 7. Operational Expenses & CapEx Ledger Records (for cashflow calculation)
  await prisma.financialTransaction.createMany({
    data: [
      {
        type: TransactionType.EXPENSE,
        category: FinancialCategory.ISP_BANDWIDTH,
        amount: 2200000,
        transactionDate: new Date(currentYear, currentMonth - 1, 1),
        description: "Tagihan Bandwidth ISP Hulu Dedicated 100 Mbps (Wholesale)",
        paymentMethod: PaymentMethod.TRANSFER,
      },
      {
        type: TransactionType.EXPENSE,
        category: FinancialCategory.ELECTRICITY_TOKEN,
        amount: 350000,
        transactionDate: new Date(currentYear, currentMonth - 1, 3),
        description: "Token Listrik PLN Server NOC & POP Puyung",
        paymentMethod: PaymentMethod.TRANSFER,
      },
      {
        type: TransactionType.EXPENSE,
        category: FinancialCategory.MAINTENANCE,
        amount: 175000,
        transactionDate: new Date(currentYear, currentMonth - 1, 8),
        description: "Beli Solasi 3M, Fast Connector FO 50 pcs & Protection Sleeve",
        paymentMethod: PaymentMethod.CASH,
      },
      {
        type: TransactionType.EXPENSE,
        category: FinancialCategory.HARDWARE_PURCHASE,
        amount: 850000,
        transactionDate: new Date(currentYear, currentMonth - 1, 12),
        description: "Beli 1 Roll Kabel Dropcore 1 Core 3 Seling 1000M",
        paymentMethod: PaymentMethod.TRANSFER,
      },
      // Expenses for previous month
      {
        type: TransactionType.EXPENSE,
        category: FinancialCategory.ISP_BANDWIDTH,
        amount: 2200000,
        transactionDate: new Date(prevYear, prevMonth - 1, 1),
        description: "Tagihan Bandwidth ISP Hulu Bulan Lalu",
        paymentMethod: PaymentMethod.TRANSFER,
      },
      {
        type: TransactionType.EXPENSE,
        category: FinancialCategory.ELECTRICITY_TOKEN,
        amount: 320000,
        transactionDate: new Date(prevYear, prevMonth - 1, 3),
        description: "Token Listrik PLN POP Bulan Lalu",
        paymentMethod: PaymentMethod.TRANSFER,
      },
    ],
  });

  console.log("✅ Seed completed successfully with realistic RT/RW Net data!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
