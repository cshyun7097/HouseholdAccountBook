import { get, patch, post } from '@/api/client';
import { clearToken, setToken } from '@/api/token';

export type SignUpRequest = { id: string; password: string; name: string; phoneNumber: string };
export type UpdateMemberRequest = { currentPassword: string; password?: string; phoneNumber?: string };

export const signUp = (data: SignUpRequest) => post<string>('/member/sign-up', data);

// 200 = available, 409 (ApiError) = taken
export const checkId = (id: string) => get<string>(`/member/id-check/${encodeURIComponent(id)}`);

export async function login(id: string, password: string) {
  const { token } = await post<{ token: string }>('/member/login', { id, password });
  await setToken(token);
}

export const logout = clearToken;

export const updateMember = (data: UpdateMemberRequest) => patch<string>('/member/update', data);
export const withdraw = () => patch<string>('/member/withdraw');
