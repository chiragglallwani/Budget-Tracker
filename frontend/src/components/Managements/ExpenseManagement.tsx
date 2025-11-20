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
  ExpenseGetAll,
  ExpenseCreate,
  ExpenseUpdate,
  ExpenseDelete,
  type Expense,
  type Category,
} from "@/services/ExpenseService";
import { CategoryGetAll } from "@/services/CategoryService";
import { ExpenseSchema, type ExpenseSchemaType } from "@/types/Schema";
import { formatCurrency, formatDate } from "@/lib/common";
import ManagementWrapper from "@/components/Layouts/ManagementWrapper";

export default function ExpenseManagement() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const form = useForm<ExpenseSchemaType>({
    resolver: zodResolver(ExpenseSchema),
    defaultValues: {
      category_id: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      note: "",
    },
  });

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (editingExpense) {
      form.reset({
        category_id: String(editingExpense.category_id),
        amount: editingExpense.amount,
        date: editingExpense.date,
        note: editingExpense.note || "",
      });
    } else {
      form.reset({
        category_id: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        note: "",
      });
    }
  }, [editingExpense, form]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await ExpenseGetAll();
      setExpenses(data);
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
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

  const onSubmit = async (data: ExpenseSchemaType) => {
    setLoading(true);
    try {
      const payload = {
        category_id: Number(data.category_id),
        amount: parseFloat(data.amount),
        date: data.date,
        note: data.note,
      };

      let result;
      if (editingExpense) {
        result = await ExpenseUpdate(editingExpense.id, payload);
      } else {
        result = await ExpenseCreate(payload);
      }

      if (!result.success) {
        form.setError("root", {
          message: result.error || "Failed to save expense",
        });
        return;
      }

      await fetchExpenses();
      setDialogOpen(false);
      setEditingExpense(null);
      form.reset();
    } catch {
      form.setError("root", { message: "Failed to save expense" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (expense: Expense) => {
    try {
      await ExpenseDelete(expense.id);
      await fetchExpenses();
    } catch (error) {
      console.error("Failed to delete expense:", error);
    }
  };

  const handleRowClick = (expense: Expense) => {
    setEditingExpense(expense);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingExpense(null);
    setDialogOpen(true);
  };

  const columns = [
    {
      accessorKey: "note",
      header: "Title",
      cell: (row: Expense) => row.note || "-",
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: (row: Expense) => row.category?.name || "-",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: (row: Expense) => formatCurrency(Number(row.amount)),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: (row: Expense) => formatDate(row.date),
    },
  ];

  return (
    <ManagementWrapper
      onClick={handleAddNew}
      title="Expense Management"
      buttonText="Add Expense"
    >
      <ManagementTable
        data={expenses}
        columns={columns}
        onRowClick={handleRowClick}
        onDelete={handleDelete}
        getItemName={(row) =>
          `${row.category?.name || "Unknown"} - ₹${Number(row.amount).toFixed(
            2
          )}`
        }
        emptyMessage="No expenses found. Add your first expense!"
      />

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingExpense ? "Edit Expense" : "Add Expense"}
        description="Create or update an expense entry."
        onSubmit={form.handleSubmit(onSubmit)}
        isLoading={loading}
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
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((cat) => (
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

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note</FormLabel>
                <FormControl>
                  <Input placeholder="Add a note..." {...field} />
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
