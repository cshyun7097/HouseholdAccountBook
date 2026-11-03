import { del, get, patch, post } from '@/api/client';

export type Account = {
  accountId: number;
  accountNumber: string;
  bankInfo: string;
  accountName: string;
  balance: number;
};

export const getAccounts = () => get<Account[]>('/account/search');

export type CreateAccountRequest = Omit<Account, 'accountId'>;
export const createAccount = (data: CreateAccountRequest) => post<string>('/account/add', data);

export const updateBalance = (accountId: number, balance: number) =>
  patch<string>(`/account/update-balance/${accountId}`, { balance });
export const deleteAccount = (accountId: number) => del<string>(`/account/delete/${accountId}`);

export const transfer = (fromAccountId: number, toAccountId: number, amount: number) =>
  post<string>('/account/transfer', { fromAccountId, toAccountId, amount });
