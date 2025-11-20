import CryptoJS from "crypto-js";

const SECRET_KEY = "secret-key";
const REFRESH_TOKEN_KEY = "encrypted_refresh_token";
const ACCESS_TOKEN_KEY = "encrypted_access_token";

export const encryptToken = (token: string): string => {
  return CryptoJS.AES.encrypt(token, SECRET_KEY).toString();
};

export const decryptToken = (encryptedToken: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedToken, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const storeRefreshToken = (token: string) => {
  sessionStorage.setItem(REFRESH_TOKEN_KEY, encryptToken(token));
};

export const getStoredRefreshToken = (): string | null => {
  const encryptedToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
  return encryptedToken ? decryptToken(encryptedToken) : null;
};

export const storeAccessToken = (token: string) => {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, encryptToken(token));
};

export const getStoredAccessToken = (): string | null => {
  const encryptedToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  return encryptedToken ? decryptToken(encryptedToken) : null;
};

export const clearAuthTokens = () => {
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
};
