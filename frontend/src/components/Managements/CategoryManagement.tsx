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
  CategoryGetAll,
  CategoryCreate,
  CategoryUpdate,
  CategoryDelete,
  type Category,
} from "@/services/CategoryService";
import { CategorySchema, type CategorySchemaType } from "@/types/Schema";
import ManagementWrapper from "@/components/Layouts/ManagementWrapper";

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const form = useForm<CategorySchemaType>({
    resolver: zodResolver(CategorySchema),
    defaultValues: {
      name: "",
      is_income: "false",
    },
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (editingCategory) {
      form.reset({
        name: editingCategory.name,
        is_income: editingCategory.is_income ? "true" : "false",
      });
    } else {
      form.reset({
        name: "",
        is_income: "false",
      });
    }
  }, [editingCategory, form]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await CategoryGetAll();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CategorySchemaType) => {
    setLoading(true);
    try {
      const payload = {
        name: data.name,
        is_income: data.is_income === "true",
      };

      let result;
      if (editingCategory) {
        result = await CategoryUpdate(editingCategory.id, payload);
      } else {
        result = await CategoryCreate(payload);
      }

      if (!result.success) {
        form.setError("name", {
          message: result.error || "Failed to save category",
        });
        return;
      }

      await fetchCategories();
      setDialogOpen(false);
      setEditingCategory(null);
      form.reset();
    } catch {
      form.setError("name", { message: "Failed to save category" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (category: Category) => {
    try {
      await CategoryDelete(category.id);
      await fetchCategories();
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  };

  const handleRowClick = (category: Category) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingCategory(null);
    setDialogOpen(true);
  };

  const columns = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "is_income",
      header: "Type",
      cell: (row: Category) => (
        <span className={row.is_income ? "text-green-600" : "text-red-600"}>
          {row.is_income ? "Income" : "Expense"}
        </span>
      ),
    },
  ];

  return (
    <ManagementWrapper
      onClick={handleAddNew}
      title="Category Management"
      buttonText="Add Category"
    >
      <ManagementTable
        data={categories}
        columns={columns}
        onRowClick={handleRowClick}
        onDelete={handleDelete}
        getItemName={(row) => row.name}
        emptyMessage="No categories found. Add your first category!"
      />

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingCategory ? "Edit Category" : "Add Category"}
        description="Create or update a category for your income or expenses."
        onSubmit={form.handleSubmit(onSubmit)}
        isLoading={loading}
      >
        <Form {...form}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Groceries" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_income"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="false">Expense</SelectItem>
                    <SelectItem value="true">Income</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </Form>
      </FormDialog>
    </ManagementWrapper>
  );
}
