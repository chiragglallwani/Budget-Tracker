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
  IncomeGetAll,
  IncomeCreate,
  IncomeUpdate,
  IncomeDelete,
  type Income,
  type Category,
} from "@/services/IncomeService";
import { CategoryGetAll } from "@/services/CategoryService";
import { IncomeSchema, type IncomeSchemaType } from "@/types/Schema";
import { formatCurrency, formatDate } from "@/lib/common";
import ManagementWrapper from "@/components/Layouts/ManagementWrapper";

export default function IncomeManagement() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  const form = useForm<IncomeSchemaType>({
    resolver: zodResolver(IncomeSchema),
    defaultValues: {
      category_id: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      note: "",
    },
  });

  useEffect(() => {
    fetchIncomes();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (editingIncome) {
      form.reset({
        category_id: String(editingIncome.category_id),
        amount: editingIncome.amount,
        date: editingIncome.date,
        note: editingIncome.note || "",
      });
    } else {
      form.reset({
        category_id: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        note: "",
      });
    }
  }, [editingIncome, form]);

  const fetchIncomes = async () => {
    setLoading(true);
    try {
      const data = await IncomeGetAll();
      setIncomes(data);
    } catch (error) {
      console.error("Failed to fetch incomes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await CategoryGetAll({ is_income: true });
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const onSubmit = async (data: IncomeSchemaType) => {
    setLoading(true);
    try {
      const payload = {
        category_id: Number(data.category_id),
        amount: parseFloat(data.amount),
        date: data.date,
        note: data.note,
      };

      let result;
      if (editingIncome) {
        result = await IncomeUpdate(editingIncome.id, payload);
      } else {
        result = await IncomeCreate(payload);
      }

      if (!result.success) {
        form.setError("root", {
          message: result.error || "Failed to save income",
        });
        return;
      }

      await fetchIncomes();
      setDialogOpen(false);
      setEditingIncome(null);
      form.reset();
    } catch {
      form.setError("root", { message: "Failed to save income" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (income: Income) => {
    try {
      await IncomeDelete(income.id);
      await fetchIncomes();
    } catch (error) {
      console.error("Failed to delete income:", error);
    }
  };

  const handleRowClick = (income: Income) => {
    setEditingIncome(income);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingIncome(null);
    setDialogOpen(true);
  };

  const columns = [
    {
      accessorKey: "note",
      header: "Title",
      cell: (row: Income) => row.note || "-",
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: (row: Income) => row.category?.name || "-",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: (row: Income) => formatCurrency(Number(row.amount)),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: (row: Income) => formatDate(row.date),
    },
  ];

  return (
    <ManagementWrapper
      onClick={handleAddNew}
      title="Income Management"
      buttonText="Add Income"
    >
      <ManagementTable
        data={incomes}
        columns={columns}
        onRowClick={handleRowClick}
        onDelete={handleDelete}
        getItemName={(row) =>
          `${row.category?.name || "Unknown"} - $${Number(row.amount).toFixed(
            2
          )}`
        }
        emptyMessage="No incomes found. Add your first income!"
      />

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingIncome ? "Edit Income" : "Add Income"}
        description="Create or update an income entry."
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
