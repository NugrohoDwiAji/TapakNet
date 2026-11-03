import { getFinancialTransactions, getFinanceSummary } from "@/actions/finance-actions";
import FinanceClientView from "@/components/finance/FinanceClientView";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const [transactions, summary] = await Promise.all([
    getFinancialTransactions(),
    getFinanceSummary(),
  ]);

  return <FinanceClientView transactions={transactions} summary={summary} />;
}
