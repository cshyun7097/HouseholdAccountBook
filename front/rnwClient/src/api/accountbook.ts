import { get, post } from '@/api/client';

export type AccountBook = {
  accountBookId: number;
  content: string;
  price: number;
  date: string; // yyyy-MM-dd
  type: 'INCOME' | 'EXPENSE';
  categoryId: number;
  categoryName: string;
  accountId: number;
};

// Spring PagedModel body
export type Page<T> = {
  content: T[];
  page: { size: number; number: number; totalElements: number; totalPages: number };
};

export type DateRange = { startDate: string; endDate: string }; // yyyy-MM-dd, both days included

// accountId omitted = every account; range omitted = all dates
export const getAccountBooks = (page: number, accountId?: number, range?: DateRange) =>
  get<Page<AccountBook>>(
    `/accountbook/get${accountId ? `/${accountId}` : ''}${range ? '/date' : ''}?page=${page}` +
      (range ? `&startDate=${range.startDate}&endDate=${range.endDate}` : ''),
  );

export type AddAccountBookRequest = Pick<AccountBook, 'content' | 'price' | 'type' | 'categoryId' | 'accountId' | 'date'>;
export const addAccountBook = (data: AddAccountBookRequest) => post<string>('/accountbook/add', data);

export type Dashboard = {
  month: string; // yyyy-MM
  monthly: { month: string; income: number; expense: number }[]; // last 6 months, oldest first
  categories: { categoryName: string; total: number }[]; // this month's expenses, largest first
};
export const getDashboard = () => get<Dashboard>('/accountbook/dashboard');
