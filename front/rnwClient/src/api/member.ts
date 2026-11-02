import { get, patch, post } from '@/api/client';
import { setSessionToken } from '@/api/session';
import { clearToken, setToken } from '@/api/token';

export type SignUpRequest = { id: string; password: string; name: string; phoneNumber: string };
export type UpdateMemberRequest = { currentPassword: string; password?: string; phoneNumber?: string };

export const signUp = (data: SignUpRequest) => post<string>('/member/sign-up', data);

// 200 = available, 409 (ApiError) = taken
export const checkId = (id: string) => get<string>(`/member/id-check/${encodeURIComponent(id)}`);

export async function login(id: string, password: string) {
  const { token } = await post<{ token: string }>('/member/login', { id, password });
  await setToken(token);
  setSessionToken(token);
}

export const findId = async (name: string, phoneNumber: string) =>
  (await post<{ ids: string[] }>('/member/find-id', { name, phoneNumber })).ids;

export type ResetPasswordRequest = { id: string; name: string; phoneNumber: string; newPassword: string };
export const resetPassword = (data: ResetPasswordRequest) => patch<string>('/member/reset-password', data);

export async function logout() {
  await clearToken();
  setSessionToken(null);
}

export type MemberInfo = { id: string; name: string; phoneNumber: string };
export const getMemberInfo = () => get<MemberInfo>('/member/info');

export const updateMember = (data: UpdateMemberRequest) => patch<string>('/member/update', data);
export const withdraw = () => patch<string>('/member/withdraw');
