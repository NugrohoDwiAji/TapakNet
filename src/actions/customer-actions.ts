"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  CustomerStatus,
  InvoiceStatus,
  PaymentMethod,
  TransactionType,
  FinancialCategory,
  DeviceStatus,
} from "@prisma/client";

export async function getHomeCustomers(year: number = new Date().getFullYear()) {
  return await prisma.homeCustomer.findMany({
    include: {
      odp: true,
      devices: true,
      invoices: {
        where: { year },
        orderBy: { month: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function createHomeCustomer(data: {
  name: string;
  phone: string;
  address: string;
  coordinates?: string;
  mikhmonUsername?: string;
  packageName: string;
  monthlyFee: number;
  installationFee?: number;
  dueDay?: number;
  odpId?: string;
  odpPort?: number;
  signalDbm?: number;
  notes?: string;
  inventoryDeviceId?: string;
  recordInstallationIncome?: boolean;
}) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  return await prisma.$transaction(async (tx) => {
    // 1. Create Customer
    const customer = await tx.homeCustomer.create({
      data: {
        name: data.name,
        phone: data.phone,
        address: data.address,
        coordinates: data.coordinates || null,
        mikhmonUsername: data.mikhmonUsername || null,
        packageName: data.packageName,
        monthlyFee: Number(data.monthlyFee),
        installationFee: Number(data.installationFee || 0),
        dueDay: Number(data.dueDay || 10),
        status: CustomerStatus.ACTIVE,
        odpId: data.odpId || null,
        odpPort: data.odpPort ? Number(data.odpPort) : null,
        signalDbm: data.signalDbm ? Number(data.signalDbm) : null,
        notes: data.notes || null,
      },
    });

    // 2. Generate 12-Month Invoices for current year
    const invoiceRows = [];
    for (let m = 1; m <= 12; m++) {
      const dueDate = new Date(currentYear, m - 1, customer.dueDay);
      invoiceRows.push({
        customerId: customer.id,
        year: currentYear,
        month: m,
        amount: customer.monthlyFee,
        status: InvoiceStatus.PENDING,
        dueDate,
      });
    }
    await tx.customerInvoice.createMany({
      data: invoiceRows,
    });

    // 3. Link Inventory Device if selected
    if (data.inventoryDeviceId) {
      await tx.inventoryDevice.update({
        where: { id: data.inventoryDeviceId },
        data: {
          status: DeviceStatus.DEPLOYED_HOME,
          homeCustomerId: customer.id,
        },
      });
    }

    // 4. Record Installation Fee Income if requested & > 0
    if (data.recordInstallationIncome && Number(data.installationFee) > 0) {
      await tx.financialTransaction.create({
        data: {
          type: TransactionType.INCOME,
          category: FinancialCategory.INSTALLATION_FEE,
          amount: Number(data.installationFee),
          transactionDate: new Date(),
          description: `Biaya Pasang Baru Pelanggan - ${customer.name}`,
          paymentMethod: PaymentMethod.CASH,
        },
      });
    }

    revalidatePath("/customers");
    revalidatePath("/infrastructure");
    revalidatePath("/finance");
    revalidatePath("/dashboard");
    return customer;
  });
}

export async function updateHomeCustomer(
  id: string,
  data: {
    name?: string;
    phone?: string;
    address?: string;
    coordinates?: string;
    mikhmonUsername?: string;
    packageName?: string;
    monthlyFee?: number;
    installationFee?: number;
    dueDay?: number;
    status?: CustomerStatus;
    odpId?: string | null;
    odpPort?: number | null;
    signalDbm?: number | null;
    notes?: string;
  }
) {
  const customer = await prisma.homeCustomer.update({
    where: { id },
    data,
  });

  revalidatePath("/customers");
  revalidatePath("/infrastructure");
  revalidatePath("/dashboard");
  return customer;
}

export async function toggleHomeCustomerStatus(id: string) {
  const customer = await prisma.homeCustomer.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!customer) throw new Error("Pelanggan tidak ditemukan");

  const newStatus =
    customer.status === CustomerStatus.ACTIVE
      ? CustomerStatus.INACTIVE
      : CustomerStatus.ACTIVE;

  const updated = await prisma.homeCustomer.update({
    where: { id },
    data: { status: newStatus },
  });

  revalidatePath("/customers");
  revalidatePath("/infrastructure");
  revalidatePath("/dashboard");
  return updated;
}

export async function payInvoice(data: {
  invoiceId: string;
  paidAt?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}) {
  const { invoiceId, paidAt, paymentMethod, notes } = data;
  const payDate = paidAt ? new Date(paidAt) : new Date();

  return await prisma.$transaction(async (tx) => {
    const invoice = await tx.customerInvoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true },
    });

    if (!invoice) throw new Error("Invoice tidak ditemukan");
    if (invoice.status === InvoiceStatus.PAID) throw new Error("Tagihan ini sudah lunas");

    // Update invoice to PAID
    const updatedInvoice = await tx.customerInvoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: payDate,
        paymentMethod,
        notes: notes || null,
      },
    });

    // Create Financial Transaction for monthly billing
    await tx.financialTransaction.create({
      data: {
        type: TransactionType.INCOME,
        category: FinancialCategory.MONTHLY_BILLING,
        amount: invoice.amount,
        transactionDate: payDate,
        description: `Tagihan Bulanan ${invoice.customer.name} (Bulan ${invoice.month}/${invoice.year})`,
        paymentMethod,
        invoiceId: invoice.id,
        referenceId: invoice.id,
      },
    });

    revalidatePath("/customers");
    revalidatePath("/finance");
    revalidatePath("/dashboard");
    return updatedInvoice;
  });
}

export async function unpayInvoice(invoiceId: string) {
  return await prisma.$transaction(async (tx) => {
    // Delete linked financial transaction if exists
    await tx.financialTransaction.deleteMany({
      where: { invoiceId },
    });

    // Reset invoice to PENDING
    const invoice = await tx.customerInvoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.PENDING,
        paidAt: null,
        paymentMethod: null,
      },
    });

    revalidatePath("/customers");
    revalidatePath("/finance");
    revalidatePath("/dashboard");
    return invoice;
  });
}

export async function ensureCustomerInvoicesForYear(customerId: string, year: number) {
  const customer = await prisma.homeCustomer.findUnique({
    where: { id: customerId },
    include: { invoices: { where: { year } } },
  });

  if (!customer) throw new Error("Pelanggan tidak ditemukan");

  const existingMonths = new Set(customer.invoices.map((inv) => inv.month));
  const newInvoices = [];

  for (let m = 1; m <= 12; m++) {
    if (!existingMonths.has(m)) {
      const dueDate = new Date(year, m - 1, customer.dueDay);
      newInvoices.push({
        customerId: customer.id,
        year,
        month: m,
        amount: customer.monthlyFee,
        status: InvoiceStatus.PENDING,
        dueDate,
      });
    }
  }

  if (newInvoices.length > 0) {
    await prisma.customerInvoice.createMany({ data: newInvoices });
    revalidatePath("/customers");
  }
}

export async function deleteHomeCustomer(id: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Return any deployed devices to IN_STOCK (Gudang)
    await tx.inventoryDevice.updateMany({
      where: { homeCustomerId: id },
      data: {
        homeCustomerId: null,
        status: DeviceStatus.IN_STOCK,
      },
    });

    // 2. Clean up linked financial transactions for invoices
    const invoices = await tx.customerInvoice.findMany({
      where: { customerId: id },
      select: { id: true },
    });
    const invoiceIds = invoices.map((i) => i.id);

    if (invoiceIds.length > 0) {
      await tx.financialTransaction.deleteMany({
        where: { invoiceId: { in: invoiceIds } },
      });
    }

    // 3. Delete invoices
    await tx.customerInvoice.deleteMany({
      where: { customerId: id },
    });

    // 4. Delete the customer
    const deletedCustomer = await tx.homeCustomer.delete({
      where: { id },
    });

    return deletedCustomer;
  }).then((res) => {
    revalidatePath("/customers");
    revalidatePath("/infrastructure");
    revalidatePath("/finance");
    revalidatePath("/dashboard");
    return res;
  });
}
