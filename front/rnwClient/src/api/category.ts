import { del, get, post } from '@/api/client';

export type Category = { categoryId: number; categoryName: string };

export const getCategories = () => get<Category[]>('/category/get');
export const addCategory = (categoryName: string) => post<string>('/category/add', { categoryName });
export const deleteCategory = (categoryId: number) => del<string>(`/category/delete/${categoryId}`);
