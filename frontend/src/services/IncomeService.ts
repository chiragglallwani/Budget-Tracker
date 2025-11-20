import axiosInstance from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { ResponseType } from "@/types/types";

export type Category = {
  id: number;
  name: string;
};

export type Income = {
  id: number;
  category: Category;
  category_id: number;
  amount: string;
  date: string;
  note: string;
};

export type IncomeFormData = {
  category_id: number;
  amount: number;
  date: string;
  note: string;
};

type IncomeListResponse = {
  success: boolean;
  data?: Income[] | { results: Income[]; count?: number };
  message?: string;
  error?: string | Record<string, unknown>;
};

export const IncomeGetAll = async (): Promise<Income[]> => {
  try {
    const response = await axiosInstance.get<IncomeListResponse>(
      API_ENDPOINTS.INCOMES
    );

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to fetch incomes");
    }

    const data = response.data.data;
    if (Array.isArray(data)) {
      return data;
    } else if (data?.results) {
      return data.results;
    }
    return [];
  } catch (error) {
    console.error("Error fetching incomes:", error);
    throw error;
  }
};

export const IncomeGetById = async (id: number): Promise<Income> => {
  try {
    const response = await axiosInstance.get<{
      success: boolean;
      data?: Income;
      message?: string;
    }>(`${API_ENDPOINTS.INCOMES}/${id}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Failed to fetch income");
    }

    return response.data.data;
  } catch (error) {
    console.error("Error fetching income:", error);
    throw error;
  }
};

export const IncomeCreate = async (
  data: IncomeFormData
): Promise<ResponseType<Income>> => {
  try {
    const response = await axiosInstance.post<{
      success: boolean;
      data?: Income;
      message?: string;
      error?: string | Record<string, unknown>;
    }>(API_ENDPOINTS.INCOMES, data);

    if (!response.data.success || !response.data.data) {
      const errorMessage =
        response.data.message ||
        (typeof response.data.error === "string"
          ? response.data.error
          : "Failed to create income");
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
      (error as { response?: { data?: { amount?: string[] } } }).response
        ?.data?.amount?.[0] ||
      "Failed to create income";
    return {
      success: false,
      error: errorMessage,
      message: errorMessage,
    };
  }
};

export const IncomeUpdate = async (
  id: number,
  data: IncomeFormData
): Promise<ResponseType<Income>> => {
  try {
    const response = await axiosInstance.put<{
      success: boolean;
      data?: Income;
      message?: string;
      error?: string | Record<string, unknown>;
    }>(`${API_ENDPOINTS.INCOMES}/${id}`, data);

    if (!response.data.success || !response.data.data) {
      const errorMessage =
        response.data.message ||
        (typeof response.data.error === "string"
          ? response.data.error
          : "Failed to update income");
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
      (error as { response?: { data?: { amount?: string[] } } }).response
        ?.data?.amount?.[0] ||
      "Failed to update income";
    return {
      success: false,
      error: errorMessage,
      message: errorMessage,
    };
  }
};

export const IncomeDelete = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`${API_ENDPOINTS.INCOMES}/${id}`);
  } catch (error) {
    console.error("Error deleting income:", error);
    throw error;
  }
};
