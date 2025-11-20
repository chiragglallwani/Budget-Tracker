import PageWrapper from "@/components/Layouts/PageWrapper";
import Header from "@/components/widgets/Header";
import CategoryManagement from "../Managements/CategoryManagement";
import IncomeManagement from "../Managements/IncomeManagement";
import ExpenseManagement from "../Managements/ExpenseManagement";
import BudgetManagement from "../Managements/BudgetManagement";

export default function TransactionManagement() {
  return (
    <PageWrapper>
      <Header title="Transaction Management" />
      <div className="flex flex-col gap-y-12 flex-wrap mt-24">
        <CategoryManagement />
        <IncomeManagement />
        <ExpenseManagement />
        <BudgetManagement />
      </div>
    </PageWrapper>
  );
}
