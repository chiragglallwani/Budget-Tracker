import axiosInstance from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { ResponseType } from "@/types/types";

export type Category = {
  id: number;
  name: string;
  is_income: boolean;
};

export type CategoryFormData = {
  name: string;
  is_income: boolean;
};

type CategoryListResponse = {
  success: boolean;
  data?: Category[] | { results: Category[]; count?: number };
  message?: string;
  error?: string | Record<string, unknown>;
};

export const CategoryGetAll = async (params?: {
  is_income?: boolean;
}): Promise<Category[]> => {
  try {
    const queryParams: Record<string, string> = {};
    if (params?.is_income !== undefined) {
      queryParams.is_income = String(params.is_income);
    }
    const response = await axiosInstance.get<CategoryListResponse>(
      API_ENDPOINTS.CATEGORIES,
      { params: queryParams }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to fetch categories");
    }
    const data = response.data.data;
    if (Array.isArray(data)) {
      return data;
    } else if (data?.results) {
      return data.results;
    }
    return [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

export const CategoryGetById = async (id: number): Promise<Category> => {
  try {
    const response = await axiosInstance.get<{
      success: boolean;
      data?: Category;
      message?: string;
    }>(`${API_ENDPOINTS.CATEGORIES}/${id}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Failed to fetch category");
    }

    return response.data.data;
  } catch (error) {
    console.error("Error fetching category:", error);
    throw error;
  }
};

export const CategoryCreate = async (
  data: CategoryFormData
): Promise<ResponseType<Category>> => {
  try {
    const response = await axiosInstance.post<{
      success: boolean;
      data?: Category;
      message?: string;
      error?: string | Record<string, unknown>;
    }>(API_ENDPOINTS.CATEGORIES, data);

    if (!response.data.success || !response.data.data) {
      const errorMessage =
        response.data.message ||
        (typeof response.data.error === "string"
          ? response.data.error
          : "Failed to create category");
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
          response?: { data?: { message?: string; name?: string[] } };
        }
      ).response?.data?.message ||
      (error as { response?: { data?: { name?: string[] } } }).response?.data
        ?.name?.[0] ||
      "Failed to create category";
    return {
      success: false,
      error: errorMessage,
      message: errorMessage,
    };
  }
};

export const CategoryUpdate = async (
  id: number,
  data: CategoryFormData
): Promise<ResponseType<Category>> => {
  try {
    const response = await axiosInstance.put<{
      success: boolean;
      data?: Category;
      message?: string;
      error?: string | Record<string, unknown>;
    }>(`${API_ENDPOINTS.CATEGORIES}/${id}`, data);

    if (!response.data.success || !response.data.data) {
      const errorMessage =
        response.data.message ||
        (typeof response.data.error === "string"
          ? response.data.error
          : "Failed to update category");
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
          response?: { data?: { message?: string; name?: string[] } };
        }
      ).response?.data?.message ||
      (error as { response?: { data?: { name?: string[] } } }).response?.data
        ?.name?.[0] ||
      "Failed to update category";
    return {
      success: false,
      error: errorMessage,
      message: errorMessage,
    };
  }
};

export const CategoryDelete = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`${API_ENDPOINTS.CATEGORIES}/${id}`);
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};
