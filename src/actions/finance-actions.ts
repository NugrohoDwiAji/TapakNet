"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TransactionType, FinancialCategory, PaymentMethod } from "@prisma/client";

export async function getFinancialTransactions(filters?: {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  category?: FinancialCategory;
  limit?: number;
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
    take: filters?.limit || 200,
    include: {
      settlement: {
        select: {
          id: true,
          partner: {
            select: { id: true, name: true },
          },
        },
      },
      invoice: {
        select: {
          id: true,
          customer: {
            select: { id: true, name: true },
          },
        },
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

  // Run SQL aggregations in parallel instead of fetching full transaction datasets
  const [
    totalIncomeAgg,
    totalExpenseAgg,
    monthlyExpenseAgg,
    monthlyIncomeGroups,
  ] = await Promise.all([
    prisma.financialTransaction.aggregate({
      _sum: { amount: true },
      where: { type: TransactionType.INCOME },
    }),
    prisma.financialTransaction.aggregate({
      _sum: { amount: true },
      where: { type: TransactionType.EXPENSE },
    }),
    prisma.financialTransaction.aggregate({
      _sum: { amount: true },
      where: {
        type: TransactionType.EXPENSE,
        transactionDate: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
    prisma.financialTransaction.groupBy({
      by: ["category"],
      _sum: { amount: true },
      where: {
        type: TransactionType.INCOME,
        transactionDate: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
  ]);

  const totalIncomeAll = totalIncomeAgg._sum.amount || 0;
  const totalExpenseAll = totalExpenseAgg._sum.amount || 0;
  const kasBersihTotal = totalIncomeAll - totalExpenseAll;

  const monthlyExpense = monthlyExpenseAgg._sum.amount || 0;
  let monthlyIncome = 0;
  let monthlyVoucher = 0;
  let monthlyCustomer = 0;
  let monthlyInstallation = 0;

  for (const group of monthlyIncomeGroups) {
    const amt = group._sum.amount || 0;
    monthlyIncome += amt;
    if (group.category === FinancialCategory.VOUCHER_HOTSPOT) monthlyVoucher = amt;
    else if (group.category === FinancialCategory.MONTHLY_BILLING) monthlyCustomer = amt;
    else if (group.category === FinancialCategory.INSTALLATION_FEE) monthlyInstallation = amt;
  }

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
