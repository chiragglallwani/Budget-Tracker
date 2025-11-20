export type ResponseType<T> = Promise<{
  data?: T;
  message?: string;
  success: boolean;
  error?: string;
}>;

type Transaction = {
  id: number;
  note: string;
  category: string;
  amount: number;
  date: string;
  is_income: boolean;
};

export type TransactionData = {
  count: number;
  next: string | null;
  previous: string | null;
  data: Transaction[];
};

export type TransactionResponse = {
  success: boolean;
  data?: TransactionData;
  message?: string;
  error?: string | Record<string, unknown>;
};

export type User = {
  id: string;
  email: string;
  username: string;
  date_joined: string;
  last_login: string;
};

export type AuthResponse = {
  user: User["email"];
  access_token: string;
  refresh_token: string;
};

export type AuthContextType = {
  user: string | null;
  message: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

// Financial Summary
export type BudgetStat = {
  date: string;
  totalBudget: number;
  totalExpense: number;
};

export type CategoryTransaction = {
  category: string;
  totalincome: number;
};

export type FinancialSummary = {
  budgetStats: BudgetStat[];
  incomeCategories: CategoryTransaction[];
  expenseCategories: CategoryTransaction[];
  totalSaving: number;
  totalEarning: number;
  totalExpenses: number;
};

export type BudgetManagement = {
  category: string;
  budgetAmt: number;
  expenseAmt: number;
};

export type BudgetManagementResponse = {
  success: boolean;
  data?: BudgetManagement[];
  message?: string;
  error?: string | Record<string, unknown>;
};
