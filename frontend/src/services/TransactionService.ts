import axiosInstance from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { TransactionResponse } from "@/types/types";

export const transactionService = async (params: Record<string, string>) => {
  try {
    const response = await axiosInstance.get<TransactionResponse>(
      API_ENDPOINTS.TRANSACTIONS,
      {
        params,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
};
