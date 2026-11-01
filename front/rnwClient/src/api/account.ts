import { get } from '@/api/client';

export type Account = {
  accountId: number;
  accountNumber: string;
  bankInfo: string;
  accountName: string;
  balance: number;
};

export const getAccounts = () => get<Account[]>('/account/search');
