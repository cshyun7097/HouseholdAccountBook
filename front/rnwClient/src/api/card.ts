import { del, get, patch, post } from '@/api/client';

export type Card = {
  cardId: number;
  cardName: string;
  cardCompany: string;
  debt: number; // used but not yet paid
};

export const getCards = () => get<Card[]>('/card/search');

export const createCard = (data: Pick<Card, 'cardName' | 'cardCompany'>) => post<string>('/card/add', data);

// takes amount out of the account and off the card's debt
export const payCard = (cardId: number, accountId: number, amount: number) =>
  patch<string>(`/card/pay/${cardId}`, { accountId, amount });
export const deleteCard = (cardId: number) => del<string>(`/card/delete/${cardId}`);
