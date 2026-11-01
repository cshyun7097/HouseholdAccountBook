import { router } from 'expo-router';

import { ApiError } from '@/api/client';
import { logout } from '@/api/member';

// For screens behind login. Spring Security answers 403 for a missing or expired token:
// send the user back to login and return undefined; otherwise return the message to show.
export async function authedErrorMessage(e: unknown) {
  if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
    await logout();
    router.replace('/');
    return undefined;
  }
  return e instanceof ApiError ? e.message : '서버에 연결할 수 없습니다.';
}
