import BarGraph from "@/components/widgets/BarGraph";
import PieChart from "@/components/widgets/Piechart";

type ChartsProps = {
  barData: {
    label: string;
    totalBudget: number;
    totalExpense: number;
  }[];
  incomePieData: {
    label: string;
    value: number;
  }[];
  expensePieData: {
    label: string;
    value: number;
  }[];
};

export default function Charts({
  barData,
  incomePieData,
  expensePieData,
}: ChartsProps) {
  return (
    <section className="flex flex-col gap-y-28 lg:flex-row gap-4">
      <div className="flex-[0.5]">
        <BarGraph
          title="Budget vs Expense"
          data={barData}
          xAxis="Date"
          yAxis="Amount"
        />
      </div>
      <div className="flex flex-[0.5] flex-col gap-y-28 md:flex-row">
        <PieChart title="Income Category" data={incomePieData} />
        <PieChart title="Expense Category" data={expensePieData} />
      </div>
    </section>
  );
}
