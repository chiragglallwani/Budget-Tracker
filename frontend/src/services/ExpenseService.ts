import axiosInstance from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { ResponseType } from "@/types/types";

export type Category = {
  id: number;
  name: string;
};

export type Expense = {
  id: number;
  category: Category;
  category_id: number;
  amount: string;
  date: string;
  note: string;
};

export type ExpenseFormData = {
  category_id: number;
  amount: number;
  date: string;
  note: string;
};

type ExpenseListResponse = {
  success: boolean;
  data?: Expense[] | { results: Expense[]; count?: number };
  message?: string;
  error?: string | Record<string, unknown>;
};

export const ExpenseGetAll = async (): Promise<Expense[]> => {
  try {
    const response = await axiosInstance.get<ExpenseListResponse>(
      API_ENDPOINTS.EXPENSES
    );

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to fetch expenses");
    }

    const data = response.data.data;
    if (Array.isArray(data)) {
      return data;
    } else if (data?.results) {
      return data.results;
    }
    return [];
  } catch (error) {
    console.error("Error fetching expenses:", error);
    throw error;
  }
};

export const ExpenseGetById = async (id: number): Promise<Expense> => {
  try {
    const response = await axiosInstance.get<{
      success: boolean;
      data?: Expense;
      message?: string;
    }>(`${API_ENDPOINTS.EXPENSES}/${id}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Failed to fetch expense");
    }

    return response.data.data;
  } catch (error) {
    console.error("Error fetching expense:", error);
    throw error;
  }
};

export const ExpenseCreate = async (
  data: ExpenseFormData
): Promise<ResponseType<Expense>> => {
  try {
    const response = await axiosInstance.post<{
      success: boolean;
      data?: Expense;
      message?: string;
      error?: string | Record<string, unknown>;
    }>(API_ENDPOINTS.EXPENSES, data);

    if (!response.data.success || !response.data.data) {
      const errorMessage =
        response.data.message ||
        (typeof response.data.error === "string"
          ? response.data.error
          : "Failed to create expense");
      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error: unknown) {
    const errorMessage =
      (
        error as {
          response?: { data?: { message?: string; amount?: string[] } };
        }
      ).response?.data?.message ||
      (error as { response?: { data?: { amount?: string[] } } }).response?.data
        ?.amount?.[0] ||
      "Failed to create expense";
    return {
      success: false,
      error: errorMessage,
      message: errorMessage,
    };
  }
};

export const ExpenseUpdate = async (
  id: number,
  data: ExpenseFormData
): Promise<ResponseType<Expense>> => {
  try {
    const response = await axiosInstance.put<{
      success: boolean;
      data?: Expense;
      message?: string;
      error?: string | Record<string, unknown>;
    }>(`${API_ENDPOINTS.EXPENSES}/${id}`, data);

    if (!response.data.success || !response.data.data) {
      const errorMessage =
        response.data.message ||
        (typeof response.data.error === "string"
          ? response.data.error
          : "Failed to update expense");
      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error: unknown) {
    const errorMessage =
      (
        error as {
          response?: { data?: { message?: string; amount?: string[] } };
        }
      ).response?.data?.message ||
      (error as { response?: { data?: { amount?: string[] } } }).response?.data
        ?.amount?.[0] ||
      "Failed to update expense";
    return {
      success: false,
      error: errorMessage,
      message: errorMessage,
    };
  }
};

export const ExpenseDelete = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`${API_ENDPOINTS.EXPENSES}/${id}`);
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
};
