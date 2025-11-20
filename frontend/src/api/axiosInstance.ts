// src/api/axiosInstance.ts
import axios, {
  type AxiosInstance,
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import {
  getStoredRefreshToken,
  getStoredAccessToken,
  clearAuthTokens,
  storeRefreshToken,
  storeAccessToken,
} from "@/lib/auth";
import { API_ENDPOINTS } from "@/api/endpoints";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL, // Replace with your backend API URL
  headers: {
    "Content-Type": "application/json",
  },
});

// Initialize accessToken from storage on module load
let accessToken: string | null = getStoredAccessToken();
let isRefreshing = false;
let failedRequestsQueue: Array<(token: string) => void> = [];

const processQueue = (token: string) => {
  failedRequestsQueue.forEach((cb) => cb(token));
  failedRequestsQueue = [];
};

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    //todo: do not check for status code instead check for error message
    if (error.response?.status === 401 && originalRequest) {
      if (!isRefreshing) {
        isRefreshing = true;
        const refreshToken = getStoredRefreshToken();

        if (refreshToken) {
          try {
            const response = await axios.post(
              `${import.meta.env.VITE_BACKEND_URL}${
                API_ENDPOINTS.AUTH.REFRESH
              }`,
              {
                refresh: refreshToken,
              }
            );

            const { access: newAccessToken, refresh: newRefreshToken } =
              response.data;

            accessToken = newAccessToken;
            storeAccessToken(newAccessToken);
            storeRefreshToken(newRefreshToken);
            processQueue(newAccessToken);
            isRefreshing = false;

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axiosInstance(originalRequest);
          } catch (refreshError) {
            clearAuthTokens();
            accessToken = null;
            console.error("Refresh token expired. Logging out.");
            isRefreshing = false;
            return Promise.reject(refreshError);
          }
        } else {
          clearAuthTokens();
          accessToken = null;
          window.location.href = "/login";
        }
      }

      return new Promise((resolve) => {
        failedRequestsQueue.push((token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(axiosInstance(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  }
);

export const setAuthTokens = (access: string, refresh: string) => {
  accessToken = access;
  storeAccessToken(access);
  storeRefreshToken(refresh);
};

export default axiosInstance;
