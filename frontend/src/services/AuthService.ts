// src/services/authService.ts
import axiosInstance, { setAuthTokens } from "@/api/axiosInstance";
import type { AuthSchemaType } from "@/types/Schema";
import type { AuthResponse, ResponseType, User } from "@/types/types";
import { extractErrorMessage } from "@/lib/api";
import { API_ENDPOINTS } from "@/api/endpoints";

export const registerUser = async (
  credentials: AuthSchemaType
): Promise<ResponseType<AuthResponse>> => {
  try {
    const response = await axiosInstance.post<{
      success: boolean;
      data?: {
        user: { email: string; username: string };
        access_token: string;
        refresh_token: string;
      };
      message?: string;
      error?: string | Record<string, unknown>;
    }>(API_ENDPOINTS.AUTH.REGISTER, credentials);

    if (!response.data.success || !response.data.data) {
      const errorMessage =
        response.data.message ||
        (typeof response.data.error === "string"
          ? response.data.error
          : "Registration failed");
      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }

    const { access_token, refresh_token, user } = response.data.data;
    setAuthTokens(access_token, refresh_token);

    return {
      success: true,
      data: {
        user: user.email || user.username || "",
        access_token,
        refresh_token,
      },
      message: response.data.message,
    };
  } catch (error) {
    const errorMessage = extractErrorMessage(error);
    return {
      success: false,
      error: errorMessage,
      message: errorMessage,
    };
  }
};

export const loginUser = async (
  credentials: AuthSchemaType
): Promise<ResponseType<AuthResponse>> => {
  try {
    const response = await axiosInstance.post<{
      success: boolean;
      data?: {
        access: string;
        refresh: string;
        user: { email: string };
      };
      message?: string;
      error?: string | Record<string, unknown>;
    }>(API_ENDPOINTS.AUTH.LOGIN, credentials);

    if (!response.data.success || !response.data.data) {
      return {
        success: false,
        error: response.data.message || "Login failed",
        message: response.data.message || "Login failed",
      };
    }

    const { access, refresh, user } = response.data.data;
    setAuthTokens(access, refresh);

    return {
      success: true,
      data: {
        user: user.email || "",
        access_token: access,
        refresh_token: refresh,
      },
      message: response.data.message,
    };
  } catch (error) {
    const errorMessage = extractErrorMessage(error);
    return {
      success: false,
      error: errorMessage,
      message: errorMessage,
    };
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT);
  } catch (error) {
    const errorMessage = extractErrorMessage(error);
    console.error("Logout failed:", errorMessage);
  }
};

export const getUserDetails = async (userId: User["id"]): Promise<User> => {
  try {
    const response = await axiosInstance.get<{
      success: boolean;
      data?: User;
      message?: string;
      error?: string | Record<string, unknown>;
    }>(API_ENDPOINTS.USERS.DETAILS.replace("{userId}", userId.toString()));

    if (!response.data.success || !response.data.data) {
      const errorMessage =
        response.data.message ||
        (typeof response.data.error === "string"
          ? response.data.error
          : "Failed to fetch user details");
      throw new Error(errorMessage);
    }

    return response.data.data;
  } catch (error) {
    const errorMessage = extractErrorMessage(error);
    throw new Error(errorMessage);
  }
};
