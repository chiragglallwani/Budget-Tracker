import axiosInstance from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";

export const financialSummaryService = async () => {
  try {
    const response = await axiosInstance.get(API_ENDPOINTS.SUMMARY);
    return response.data;
  } catch (error) {
    console.error("Error fetching financial summary:", error);
    throw error;
  }
};

export const budgetManagementService = async () => {
  try {
    const response = await axiosInstance.get(API_ENDPOINTS.BUDGET_MANAGEMENT);
    return response.data;
  } catch (error) {
    console.error("Error fetching budget management:", error);
    throw error;
  }
};
