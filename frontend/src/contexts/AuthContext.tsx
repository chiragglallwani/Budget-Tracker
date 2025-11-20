import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useJwt } from "react-jwt";
import type { AuthContextType } from "@/types/types";
import {
  loginUser,
  registerUser,
  logoutUser,
  getUserDetails,
} from "@/services/AuthService";
import { clearAuthTokens, getStoredRefreshToken } from "@/lib/auth";
import { AuthContext } from "@/hooks/useAuth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const refreshToken = getStoredRefreshToken();
  const { decodedToken } = useJwt(refreshToken || "");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!refreshToken) {
          setIsLoading(false);
          return;
        }

        if (!decodedToken) {
          return;
        }

        const userId = (decodedToken as { user_id: string }).user_id;
        if (userId) {
          try {
            const user = await getUserDetails(userId);
            setUser(user.email);
            setIsLoading(false);
          } catch (error) {
            console.error("Failed to fetch user details:", error);
            clearAuthTokens();
            setIsLoading(false);
          }
        } else {
          clearAuthTokens();
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to check authentication:", error);
        clearAuthTokens();
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [decodedToken, refreshToken]);

  const login = async (email: string, password: string): Promise<boolean> => {
    const response = await loginUser({ email, password });
    if (response.success) {
      setUser(response.data?.user || null);
      setIsLoading(false);
      return true;
    } else {
      setMessage(response.message || "Login failed");
      setIsLoading(false);
      return false;
    }
  };

  const register = async (
    email: string,
    password: string
  ): Promise<boolean> => {
    const response = await registerUser({ email, password });
    if (response.success) {
      setUser(response.data?.user || null);
      setIsLoading(false);
      return true;
    } else {
      setMessage(response.message || "Login failed");
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    logoutUser().catch(console.error);
    setUser(null);
    clearAuthTokens();
    setIsLoading(false);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    message,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
