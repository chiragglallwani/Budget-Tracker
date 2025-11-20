import PageWrapper from "@/components/Layouts/PageWrapper";
import Charts from "@/components/widgets/Charts";
import AnimateNumbers from "../widgets/AnimateNumbers";
import Header from "@/components/widgets/Header";
import { financialSummaryService } from "@/services/FinancialService";
import { useEffect, useState } from "react";
import type { FinancialSummary } from "@/types/types";
import { Loader } from "@/components/widgets/Loader";

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [financialSummary, setFinancialSummary] =
    useState<FinancialSummary | null>(null);

  const fetchFinancialSummary = async () => {
    setLoading(true);
    try {
      const response = await financialSummaryService();
      setFinancialSummary(response.data);
    } catch (error) {
      console.error("Error fetching financial summary:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialSummary();
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <PageWrapper>
      <Header title="Financial Summary" />
      <Charts
        barData={(financialSummary?.budgetStats || []).map((stat) => ({
          label: stat.date,
          totalBudget: stat.totalBudget,
          totalExpense: stat.totalExpense,
        }))}
        incomePieData={(financialSummary?.incomeCategories || []).map(
          (category) => ({
            label: category.category,
            value: category.totalincome,
          })
        )}
        expensePieData={(financialSummary?.expenseCategories || []).map(
          (category) => ({
            label: category.category,
            value: category.totalincome,
          })
        )}
      />
      <div className="flex flex-col gap-y-12 flex-wrap lg:flex-row mt-24 gap-x-12">
        <AnimateNumbers
          targetNumber={financialSummary?.totalSaving || 0}
          duration={2}
          title="Total Savings"
          className="bg-green-300 text-green-900"
        />
        <AnimateNumbers
          targetNumber={financialSummary?.totalExpenses || 0}
          duration={2}
          title="Total Expenses"
          className="bg-yellow-200 text-yellow-900"
        />
        <AnimateNumbers
          targetNumber={financialSummary?.totalEarning || 0}
          duration={2}
          title="Total Income"
          className="bg-blue-300 text-blue-900"
        />
      </div>
    </PageWrapper>
  );
}
