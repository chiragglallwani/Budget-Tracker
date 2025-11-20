import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormDialog from "@/components/widgets/FormDialog";
import ManagementTable from "@/components/widgets/ManagementTable";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  BudgetGetAll,
  BudgetCreate,
  BudgetUpdate,
  BudgetDelete,
  type Budget,
  type Category,
} from "@/services/BudgetService";
import { CategoryGetAll } from "@/services/CategoryService";
import { BudgetSchema, type BudgetSchemaType } from "@/types/Schema";
import { formatCurrency } from "@/lib/common";
import ManagementWrapper from "@/components/Layouts/ManagementWrapper";

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export default function BudgetManagement() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const currentYear = new Date().getFullYear();
  const form = useForm<BudgetSchemaType>({
    resolver: zodResolver(BudgetSchema),
    defaultValues: {
      category_id: "",
      year: String(currentYear),
      month: String(new Date().getMonth() + 1),
      amount: "",
    },
  });

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (editingBudget) {
      form.reset({
        category_id: editingBudget.category_id
          ? String(editingBudget.category_id)
          : "",
        year: String(editingBudget.year),
        month: String(editingBudget.month),
        amount: editingBudget.amount,
      });
    } else {
      form.reset({
        category_id: "",
        year: String(currentYear),
        month: String(new Date().getMonth() + 1),
        amount: "",
      });
    }
  }, [editingBudget, form, currentYear]);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const data = await BudgetGetAll();
      setBudgets(data);
    } catch (error) {
      console.error("Failed to fetch budgets:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await CategoryGetAll({ is_income: false });
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const onSubmit = async (data: BudgetSchemaType) => {
    setLoading(true);
    try {
      const payload = {
        year: Number(data.year),
        month: Number(data.month),
        amount: parseFloat(data.amount),
        category_id: Number(data.category_id),
      };

      let result;
      if (editingBudget) {
        result = await BudgetUpdate(editingBudget.id, payload);
      } else {
        result = await BudgetCreate(payload);
      }

      if (!result.success) {
        form.setError("root", {
          message: result.error || "Failed to save budget",
        });
        return;
      }

      await fetchBudgets();
      setDialogOpen(false);
      setEditingBudget(null);
      form.reset();
    } catch {
      form.setError("root", { message: "Failed to save budget" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (budget: Budget) => {
    try {
      await BudgetDelete(budget.id);
      await fetchBudgets();
    } catch (error) {
      console.error("Failed to delete budget:", error);
    }
  };

  const handleRowClick = (budget: Budget) => {
    setEditingBudget(budget);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingBudget(null);
    setDialogOpen(true);
  };

  const getMonthName = (month: number) => {
    return (
      MONTHS.find((m) => m.value === String(month))?.label || String(month)
    );
  };

  const columns = [
    {
      accessorKey: "category",
      header: "Category",
      cell: (row: Budget) => row.category?.name || "General",
    },
    {
      accessorKey: "month",
      header: "Month",
      cell: (row: Budget) => getMonthName(row.month),
    },
    {
      accessorKey: "year",
      header: "Year",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: (row: Budget) => formatCurrency(Number(row.amount)),
    },
  ];

  return (
    <ManagementWrapper
      onClick={handleAddNew}
      title="Budget Management"
      buttonText="Add Budget"
    >
      <ManagementTable
        data={budgets}
        columns={columns}
        onRowClick={handleRowClick}
        onDelete={handleDelete}
        getItemName={(row) =>
          `${getMonthName(row.month)} ${row.year} - $${Number(
            row.amount
          ).toFixed(2)}`
        }
        emptyMessage="No budgets found. Add your first budget!"
      />

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingBudget ? "Edit Budget" : "Add Budget"}
        description="Create or update a monthly budget."
        onSubmit={form.handleSubmit(onSubmit)}
        isLoading={loading}
        errorMessage={form.formState.errors.root?.message}
      >
        <Form {...form}>
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category (required)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories
                      .filter((cat) => !cat.is_income)
                      .map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="2000"
                      max="2100"
                      placeholder="2025"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Month</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MONTHS.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Form>
      </FormDialog>
    </ManagementWrapper>
  );
}
