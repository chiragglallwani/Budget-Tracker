import axiosInstance from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { ResponseType } from "@/types/types";

export type Category = {
  id: number;
  name: string;
  is_income: boolean;
};

export type Budget = {
  id: number;
  category: Category | null;
  category_id: number | null;
  year: number;
  month: number;
  amount: string;
};

export type BudgetFormData = {
  category_id: number;
  year: number;
  month: number;
  amount: number;
};

type BudgetListResponse = {
  success: boolean;
  data?: Budget[] | { results: Budget[]; count?: number };
  message?: string;
  error?: string | Record<string, unknown>;
};

export const BudgetGetAll = async (): Promise<Budget[]> => {
  try {
    const response = await axiosInstance.get<BudgetListResponse>(
      API_ENDPOINTS.BUDGETS
    );

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to fetch budgets");
    }

    const data = response.data.data;
    if (Array.isArray(data)) {
      return data;
    } else if (data?.results) {
      return data.results;
    }
    return [];
  } catch (error) {
    console.error("Error fetching budgets:", error);
    throw error;
  }
};

export const BudgetGetById = async (id: number): Promise<Budget> => {
  try {
    const response = await axiosInstance.get<{
      success: boolean;
      data?: Budget;
      message?: string;
    }>(`${API_ENDPOINTS.BUDGETS}/${id}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Failed to fetch budget");
    }

    return response.data.data;
  } catch (error) {
    console.error("Error fetching budget:", error);
    throw error;
  }
};

export const BudgetCreate = async (
  data: BudgetFormData
): Promise<ResponseType<Budget>> => {
  try {
    const payload: {
      year: number;
      month: number;
      amount: number;
      category_id?: number;
    } = {
      year: data.year,
      month: data.month,
      amount: data.amount,
    };

    if (data.category_id) {
      payload.category_id = data.category_id;
    }

    const response = await axiosInstance.post<{
      success: boolean;
      data?: Budget;
      message?: string;
      error?: string | Record<string, unknown>;
    }>(API_ENDPOINTS.BUDGETS, payload);

    if (!response.data.success || !response.data.data) {
      const errorMessage =
        response.data.message ||
        (typeof response.data.error === "string"
          ? response.data.error
          : "Failed to create budget");
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
      "Failed to create budget";
    return {
      success: false,
      error: errorMessage,
      message: errorMessage,
    };
  }
};

export const BudgetUpdate = async (
  id: number,
  data: BudgetFormData
): Promise<ResponseType<Budget>> => {
  try {
    const payload: {
      year: number;
      month: number;
      amount: number;
      category_id: number;
    } = {
      year: data.year,
      month: data.month,
      amount: data.amount,
      category_id: data.category_id,
    };

    const response = await axiosInstance.put<{
      success: boolean;
      data?: Budget;
      message?: string;
      error?: string | Record<string, unknown>;
    }>(`${API_ENDPOINTS.BUDGETS}/${id}`, payload);

    if (!response.data.success || !response.data.data) {
      const errorMessage =
        response.data.message ||
        (typeof response.data.error === "string"
          ? response.data.error
          : "Failed to update budget");
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
      "Failed to update budget";
    return {
      success: false,
      error: errorMessage,
      message: errorMessage,
    };
  }
};

export const BudgetDelete = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`${API_ENDPOINTS.BUDGETS}/${id}`);
  } catch (error) {
    console.error("Error deleting budget:", error);
    throw error;
  }
};
