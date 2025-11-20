import PageWrapper from "../Layouts/PageWrapper";
import Header from "../widgets/Header";
import BarGraph from "../widgets/BarGraph";
import { useState } from "react";
import { useEffect } from "react";
import { budgetManagementService } from "@/services/FinancialService";
import type { BudgetManagement } from "@/types/types";

export default function BudgetManagementView() {
  const [loading, setLoading] = useState(false);
  const [budgets, setBudgets] = useState<BudgetManagement[]>([]);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const response = await budgetManagementService();
      setBudgets(response.data);
    } catch (error) {
      console.error("Error fetching budgets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <PageWrapper>
      <Header title="Budget Management" />
      <BarGraph
        title="Budget vs Expense"
        data={budgets.map((budget) => ({
          label: budget.category,
          totalBudget: budget.budgetAmt,
          totalExpense: budget.expenseAmt,
        }))}
        xAxis="Category"
        yAxis="Amount"
      />
    </PageWrapper>
  );
}
