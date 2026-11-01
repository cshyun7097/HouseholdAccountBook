import { get } from '@/api/client';

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

// accountId omitted = every account
export const getAccountBooks = (page: number, accountId?: number) =>
  get<Page<AccountBook>>(`/accountbook/get${accountId ? `/${accountId}` : ''}?page=${page}`);
