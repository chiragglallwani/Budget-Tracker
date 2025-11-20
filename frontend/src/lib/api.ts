import type { AxiosError } from "axios";

export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Check if it's an AxiosError with response data
    const axiosError = error as AxiosError<{
      success?: boolean;
      message?: string;
      error?: string | Record<string, unknown>;
    }>;

    if (axiosError.response?.data) {
      const data = axiosError.response.data;

      // Backend returns standardized format
      if (data.success === false) {
        // If there's a message, use it
        if (data.message) {
          return data.message;
        }
        // If error is a string, use it
        if (typeof data.error === "string") {
          return data.error;
        }
        // If error is an object (validation errors), format it
        if (typeof data.error === "object" && data.error !== null) {
          const errorObj = data.error as Record<string, unknown>;
          const firstError = Object.entries(errorObj)[0];
          if (firstError) {
            const [field, value] = firstError;
            if (Array.isArray(value) && value.length > 0) {
              return `${field}: ${value[0]}`;
            }
            return `${field}: ${String(value)}`;
          }
        }
      }

      // Fallback: try to get detail or message from response
      if ("detail" in data && typeof data.detail === "string") {
        return data.detail;
      }
      if ("message" in data && typeof data.message === "string") {
        return data.message;
      }
    }

    // Use the error message if available
    return error.message;
  }

  return "An unexpected error occurred";
}
