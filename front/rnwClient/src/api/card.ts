import { del, get, patch, post } from '@/api/client';

export type Card = {
  cardId: number;
  cardName: string;
  cardCompany: string;
  debt: number; // used but not yet paid
};

export const getCards = () => get<Card[]>('/card/search');

export const createCard = (data: Pick<Card, 'cardName' | 'cardCompany'>) => post<string>('/card/add', data);

// sets the card's debt to 0
export const payCard = (cardId: number) => patch<string>(`/card/pay/${cardId}`);
export const deleteCard = (cardId: number) => del<string>(`/card/delete/${cardId}`);
