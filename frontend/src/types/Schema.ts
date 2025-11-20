import { z } from "zod";

export const AuthSchema = z.object({
  email: z.string().email().min(1, "Email is required"),
  password: z.string().min(8, "Password should be at least 8 characters long"),
});

export type AuthSchemaType = z.infer<typeof AuthSchema>;

export const BudgetSchema = z.object({
  category_id: z.string().min(1, "Category is required"),
  year: z
    .string()
    .min(1, "Year is required")
    .refine(
      (val) => {
        const year = Number(val);
        return year >= 2010 && year <= 2100;
      },
      { message: "Year must be between 2010 and 2100" }
    ),
  month: z
    .string()
    .min(1, "Month is required")
    .refine(
      (val) => {
        const month = Number(val);
        return month >= 1 && month <= 12;
      },
      { message: "Month must be between 1 and 12" }
    ),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine(
      (val) => {
        const amount = parseFloat(val);
        return !isNaN(amount) && amount > 0;
      },
      { message: "Amount must be greater than 0" }
    ),
});

export const CategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  is_income: z.string().refine((val) => val === "true" || val === "false", {
    message: "Type is required",
  }),
});

export const ExpenseSchema = z.object({
  category_id: z.string().min(1, "Category is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine(
      (val) => {
        const amount = parseFloat(val);
        return !isNaN(amount) && amount > 0;
      },
      { message: "Amount must be greater than 0" }
    ),
  date: z.string().min(1, "Date is required"),
  note: z.string().min(10, "Note must be at least 10 characters long"),
});

export const IncomeSchema = z.object({
  category_id: z.string().min(1, "Category is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine(
      (val) => {
        const amount = parseFloat(val);
        return !isNaN(amount) && amount > 0;
      },
      { message: "Amount must be greater than 0" }
    ),
  date: z.string().min(1, "Date is required"),
  note: z.string().min(10, "Note must be at least 10 characters long"),
});

export type BudgetSchemaType = z.infer<typeof BudgetSchema>;
export type CategorySchemaType = z.infer<typeof CategorySchema>;
export type ExpenseSchemaType = z.infer<typeof ExpenseSchema>;
export type IncomeSchemaType = z.infer<typeof IncomeSchema>;
