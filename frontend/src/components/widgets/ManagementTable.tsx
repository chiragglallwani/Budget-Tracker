import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import DeleteDialog from "./DeleteDialog";

type Column<T> = {
  accessorKey: keyof T | string;
  header: string;
  cell?: (row: T) => React.ReactNode;
};

type ManagementTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  onDelete: (row: T) => void;
  getItemName?: (row: T) => string;
  emptyMessage?: string;
};

export default function ManagementTable<T extends { id: number | string }>({
  data,
  columns,
  onRowClick,
  onDelete,
  getItemName,
  emptyMessage = "No data available",
}: ManagementTableProps<T>) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, row: T) => {
    e.stopPropagation();
    setItemToDelete(row);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      onDelete(itemToDelete);
      setItemToDelete(null);
    }
  };

  const getItemDisplayName = (row: T): string => {
    if (getItemName) {
      return getItemName(row);
    }
    if ("name" in row && typeof row.name === "string") {
      return row.name;
    }
    return "this item";
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-lg">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border max-h-[400px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={String(column.accessorKey)}>
                  {column.header}
                </TableHead>
              ))}
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
              >
                {columns.map((column) => {
                  let cellValue: React.ReactNode;

                  if (column.cell) {
                    cellValue = column.cell(row);
                  } else if (typeof column.accessorKey === "string") {
                    const value = row[column.accessorKey as keyof T];
                    cellValue =
                      value !== null && value !== undefined
                        ? String(value)
                        : "-";
                  } else {
                    cellValue = "-";
                  }

                  return (
                    <TableCell key={String(column.accessorKey)}>
                      {cellValue}
                    </TableCell>
                  );
                })}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDeleteClick(e, row)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        itemName={itemToDelete ? getItemDisplayName(itemToDelete) : undefined}
      />
    </>
  );
}
