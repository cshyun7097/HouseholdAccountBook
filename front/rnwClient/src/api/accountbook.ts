import { del, get, patch, post } from '@/api/client';

export type AccountBook = {
  accountBookId: number;
  content: string;
  price: number;
  date: string; // yyyy-MM-dd
  type: 'INCOME' | 'EXPENSE';
  categoryId: number;
  categoryName: string;
  paymentType: 'ACCOUNT' | 'CARD';
  accountId: number | null; // null for card entries
  cardId: number | null; // null for account entries
};

// Spring PagedModel body
export type Page<T> = {
  content: T[];
  page: { size: number; number: number; totalElements: number; totalPages: number };
};

export type DateRange = { startDate: string; endDate: string }; // yyyy-MM-dd, both days included

// Set at most one of accountId / cardId; neither = every account and card
export type Source = { accountId?: number; cardId?: number };

// range omitted = all dates; categoryIds empty = every category
export const getAccountBooks = (page: number, { accountId, cardId }: Source, range?: DateRange, categoryIds: number[] = []) => {
  const dates = range ? `&startDate=${range.startDate}&endDate=${range.endDate}` : '';
  if (categoryIds.length) {
    const source = cardId ? `&cardId=${cardId}` : accountId ? `&accountId=${accountId}` : '';
    return get<Page<AccountBook>>(`/accountbook/get/category?page=${page}&categoryIds=${categoryIds.join(',')}${source}${dates}`);
  }
  const source = cardId ? `/card/${cardId}` : accountId ? `/${accountId}` : '';
  return get<Page<AccountBook>>(`/accountbook/get${source}${range ? '/date' : ''}?page=${page}${dates}`);
};

export type AddAccountBookRequest = Pick<AccountBook, 'content' | 'price' | 'type' | 'categoryId' | 'paymentType' | 'date'> &
  Partial<Pick<AccountBook, 'accountId' | 'cardId'>>;
export const addAccountBook = (data: AddAccountBookRequest) => post<string>('/accountbook/add', data);

// The backend can't change an entry's date, account or card
export type UpdateAccountBookRequest = Pick<AccountBook, 'content' | 'price' | 'type' | 'categoryId'>;
export const updateAccountBook = (accountBookId: number, data: UpdateAccountBookRequest) =>
  patch<string>(`/accountbook/update/${accountBookId}`, data);
export const deleteAccountBook = (accountBookId: number) => del<string>(`/accountbook/delete/${accountBookId}`);

export type Dashboard = {
  month: string; // yyyy-MM
  monthly: { month: string; income: number; expense: number }[]; // last 6 months, oldest first
  categories: { categoryName: string; total: number }[]; // this month's expenses, largest first
};
export const getDashboard = () => get<Dashboard>('/accountbook/dashboard');
export const getExpenseByCategory = (month: string) =>
  get<Dashboard['categories']>(`/accountbook/dashboard/categories?month=${month}`);
