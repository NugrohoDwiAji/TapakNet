"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TransactionType, FinancialCategory, PaymentMethod } from "@prisma/client";

export async function getFinancialTransactions(filters?: {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  category?: FinancialCategory;
}) {
  const where: any = {};

  if (filters?.startDate || filters?.endDate) {
    where.transactionDate = {};
    if (filters.startDate) {
      where.transactionDate.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      where.transactionDate.lte = end;
    }
  }

  if (filters?.type) {
    where.type = filters.type;
  }

  if (filters?.category) {
    where.category = filters.category;
  }

  return await prisma.financialTransaction.findMany({
    where,
    orderBy: { transactionDate: "desc" },
    include: {
      settlement: {
        include: { partner: true },
      },
      invoice: {
        include: { customer: true },
      },
    },
  });
}

export async function createManualTransaction(data: {
  type: TransactionType;
  category: FinancialCategory;
  amount: number;
  transactionDate?: string;
  description: string;
  paymentMethod: PaymentMethod;
}) {
  const tx = await prisma.financialTransaction.create({
    data: {
      type: data.type,
      category: data.category,
      amount: Number(data.amount),
      transactionDate: data.transactionDate ? new Date(data.transactionDate) : new Date(),
      description: data.description,
      paymentMethod: data.paymentMethod,
    },
  });

  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return tx;
}

export async function deleteFinancialTransaction(id: string) {
  await prisma.financialTransaction.delete({
    where: { id },
  });
  revalidatePath("/finance");
  revalidatePath("/dashboard");
}

export async function getFinanceSummary(year?: number, month?: number) {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth() + 1;

  const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
  const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

  const [allTransactions, monthlyTransactions] = await Promise.all([
    prisma.financialTransaction.findMany(),
    prisma.financialTransaction.findMany({
      where: {
        transactionDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
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

  const kasBersihTotal = totalIncomeAll - totalExpenseAll;

  // Monthly Breakdown
  const monthlyIncome = monthlyTransactions
    .filter((t) => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpense = monthlyTransactions
    .filter((t) => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyVoucher = monthlyTransactions
    .filter((t) => t.category === FinancialCategory.VOUCHER_HOTSPOT)
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyCustomer = monthlyTransactions
    .filter((t) => t.category === FinancialCategory.MONTHLY_BILLING)
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyInstallation = monthlyTransactions
    .filter((t) => t.category === FinancialCategory.INSTALLATION_FEE)
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    kasBersihTotal,
    totalIncomeAll,
    totalExpenseAll,
    monthlyIncome,
    monthlyExpense,
    monthlyNet: monthlyIncome - monthlyExpense,
    monthlyVoucher,
    monthlyCustomer,
    monthlyInstallation,
    targetYear,
    targetMonth,
  };
}
