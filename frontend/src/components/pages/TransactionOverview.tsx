import { useMemo, useState, useEffect } from "react";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import PageWrapper from "@/components/Layouts/PageWrapper";
import Header from "@/components/widgets/Header";
import DataTable, { type FilterParams } from "@/components/widgets/DataTable";
import { transactionService } from "@/services/TransactionService";
import type { TransactionResponse } from "@/types/types";
import { formatCurrency, formatDate } from "@/lib/common";

type Transaction = {
  id: number;
  note: string;
  category: string;
  amount: string | number;
  date: string;
  is_income: boolean;
};

export default function TransactionOverview() {
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterParams>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: "note",
        header: "Title",
        cell: ({ row }) => {
          const note = row.getValue("note") as string;
          return <div className="font-medium">{note || "-"}</div>;
        },
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => {
          const category = row.getValue("category") as string;
          return <div>{category}</div>;
        },
      },
      {
        accessorKey: "is_income",
        header: "Income",
        cell: ({ row }) => {
          const isIncome = row.getValue("is_income") as boolean;
          const amount = row.original.amount;
          return (
            <div className={isIncome ? "text-green-600 font-medium" : ""}>
              {isIncome ? formatCurrency(Number(amount)) : "-"}
            </div>
          );
        },
      },
      {
        accessorKey: "is_income",
        header: "Expense",
        cell: ({ row }) => {
          const isIncome = row.getValue("is_income") as boolean;
          const amount = row.original.amount;
          return (
            <div className={!isIncome ? "text-red-600 font-medium" : ""}>
              {!isIncome ? formatCurrency(Number(amount)) : "-"}
            </div>
          );
        },
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => {
          const date = row.getValue("date") as string;
          return <div>{formatDate(date)}</div>;
        },
      },
    ],
    []
  );

  // Fetch categories for filter dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await transactionService({});
        if (response.success && response.data?.data) {
          const categoryNames = response.data?.data.map(
            (cat: Transaction) => cat.category
          );
          setCategories(categoryNames);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch transactions with filters
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);

      try {
        const params: Record<string, string> = {
          page: String(pagination.pageIndex + 1),
          page_size: String(pagination.pageSize),
        };

        if (filters.date_from) params.date_from = filters.date_from;
        if (filters.date_to) params.date_to = filters.date_to;
        if (filters.category) params.category = filters.category;
        if (filters.amount_min) params.amount_min = filters.amount_min;

        const response: TransactionResponse = await transactionService(params);
        if (response.success) {
          const responseData = response.data;
          // Handle paginated response
          if (Array.isArray(responseData?.data)) {
            setData(responseData.data);
            setTotalCount(responseData.count);
          } else {
            setData([]);
            setTotalCount(0);
          }
        } else {
          setError(response.message || "Failed to fetch transactions");
        }
      } catch (err) {
        setError("Failed to load transactions");
        console.error("Error fetching transactions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [pagination, filters]);

  const handleFilterChange = (newFilters: FilterParams) => {
    setFilters(newFilters);
    // Reset to first page when filters change
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  return (
    <PageWrapper>
      <Header title="Transaction Overview" />
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        error={error}
        totalCount={totalCount}
        categories={categories}
        pagination={pagination}
        onPaginationChange={setPagination}
        onFilterChange={handleFilterChange}
        initialFilters={filters}
      />
    </PageWrapper>
  );
}
