import { ApiError } from '@/api/client';
import { logout } from '@/api/member';

// For screens behind login. The backend answers 401 for a missing or expired token:
// log out (the root layout's guard then sends the user to login) and return undefined;
// otherwise return the message to show.
export async function authedErrorMessage(e: unknown) {
  if (e instanceof ApiError && e.status === 401) {
    await logout();
    return undefined;
  }
  return e instanceof ApiError ? e.message : '서버에 연결할 수 없습니다.';
}
