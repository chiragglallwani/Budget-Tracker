import { useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Transaction = {
  id: number;
  note: string;
  category: string;
  amount: string | number;
  date: string;
  is_income: boolean;
};

export type FilterParams = {
  date_from?: string;
  date_to?: string;
  category?: string;
  amount_min?: string;
};

type DataTableProps = {
  columns: ColumnDef<Transaction>[];
  data: Transaction[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  categories: string[];
  pagination: PaginationState;
  onPaginationChange: (pagination: PaginationState) => void;
  onFilterChange?: (filters: FilterParams) => void;
  initialFilters?: FilterParams;
};

export default function DataTable({
  columns,
  data,
  loading,
  error,
  totalCount,
  categories,
  pagination,
  onPaginationChange,
  onFilterChange,
  initialFilters,
}: DataTableProps) {
  // Filter states
  const [dateFrom, setDateFrom] = useState(initialFilters?.date_from || "");
  const [dateTo, setDateTo] = useState(initialFilters?.date_to || "");
  const [selectedCategory, setSelectedCategory] = useState(
    initialFilters?.category || ""
  );
  const [amountMin, setAmountMin] = useState(initialFilters?.amount_min || "");

  // Update filter states when initialFilters change (but don't trigger onFilterChange)
  useEffect(() => {
    setDateFrom(initialFilters?.date_from || "");
    setDateTo(initialFilters?.date_to || "");
    setSelectedCategory(initialFilters?.category || "");
    setAmountMin(initialFilters?.amount_min || "");
  }, [initialFilters]);

  const handlePaginationChange = (
    updaterOrValue:
      | PaginationState
      | ((old: PaginationState) => PaginationState)
  ) => {
    const newPagination =
      typeof updaterOrValue === "function"
        ? updaterOrValue(pagination)
        : updaterOrValue;
    onPaginationChange(newPagination);
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    state: {
      pagination,
    },
    onPaginationChange: handlePaginationChange,
  });

  const handleResetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setSelectedCategory("");
    setAmountMin("");
    onPaginationChange({ pageIndex: 0, pageSize: 20 });
    // Notify parent after reset
    if (onFilterChange) {
      onFilterChange({});
    }
  };

  // Handlers that notify parent on user input
  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    if (onFilterChange) {
      onFilterChange({
        date_from: value || undefined,
        date_to: dateTo || undefined,
        category: selectedCategory || undefined,
        amount_min: amountMin || undefined,
      });
    }
  };

  const handleDateToChange = (value: string) => {
    setDateTo(value);
    if (onFilterChange) {
      onFilterChange({
        date_from: dateFrom || undefined,
        date_to: value || undefined,
        category: selectedCategory || undefined,
        amount_min: amountMin || undefined,
      });
    }
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    if (onFilterChange) {
      onFilterChange({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        category: value || undefined,
        amount_min: amountMin || undefined,
      });
    }
  };

  const handleAmountMinChange = (value: string) => {
    setAmountMin(value);
    if (onFilterChange) {
      onFilterChange({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        category: selectedCategory || undefined,
        amount_min: value || undefined,
      });
    }
  };

  const pageCount = Math.ceil(totalCount / pagination.pageSize);
  const currentPage = pagination.pageIndex + 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end p-4 border rounded-lg bg-card">
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="date-from">Date From</Label>
          <Input
            id="date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => handleDateFromChange(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="date-to">Date To</Label>
          <Input
            id="date-to"
            type="date"
            value={dateTo}
            onChange={(e) => handleDateToChange(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="category">Category</Label>
          <Select
            value={selectedCategory}
            onValueChange={(value) => handleCategoryChange(value)}
          >
            <SelectTrigger className="mt-1 w-full">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat, index) => (
                <SelectItem key={cat + index} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="amount-min">Min Amount</Label>
          <Input
            id="amount-min"
            type="number"
            value={amountMin}
            onChange={(e) => handleAmountMinChange(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="mt-1"
          />
        </div>
        <Button variant="theme" onClick={handleResetFilters} className="h-9">
          Reset
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">{error}</p>
        </div>
      ) : data?.length === 0 ? (
        <div className="flex items-center justify-center h-64 border rounded-lg">
          <p className="text-muted-foreground">
            No transactions found. Try adjusting your filters.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header, index) => (
                      <TableHead key={header.id + index}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table?.getRowModel()?.rows?.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell, index) => (
                      <TableCell key={cell.id + index}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalCount > pagination.pageSize && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="h-9 w-9"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    <span className="sr-only">Go to previous page</span>
                  </Button>
                </PaginationItem>

                {/* Page numbers */}
                {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => {
                  let pageNum: number;
                  if (pageCount <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= pageCount - 2) {
                    pageNum = pageCount - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <PaginationItem key={pageNum}>
                      <Button
                        variant={currentPage === pageNum ? "outline" : "ghost"}
                        size="icon"
                        onClick={() => table.setPageIndex(pageNum - 1)}
                        className="h-9 w-9"
                      >
                        {pageNum}
                      </Button>
                    </PaginationItem>
                  );
                })}

                {pageCount > 5 && currentPage < pageCount - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}

                <PaginationItem>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="h-9 w-9"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                    <span className="sr-only">Go to next page</span>
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}

          <div className="text-sm text-muted-foreground text-center">
            Showing {data?.length} of {totalCount} transactions
          </div>
        </>
      )}
    </div>
  );
}
