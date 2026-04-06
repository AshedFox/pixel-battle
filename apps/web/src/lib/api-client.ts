import { RequestResult } from '@/types/request';
import { accessTokenErrorSchema } from '@repo/shared';

type RefreshFn = () => Promise<
  RequestResult<{
    accessToken: string;
    expiresAt: string;
  }>
>;

let accessToken: string | null = null;
let refreshFn: RefreshFn | null = null;

export function configureApiClient(opts: {
  accessToken: string | null;
  onRefresh: RefreshFn;
}) {
  accessToken = opts.accessToken;
  refreshFn = opts.onRefresh;
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  const doRequest = (token: string | null) =>
    fetch(input, {
      ...init,
      headers: {
        ...init?.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  let res = await doRequest(accessToken);

  if (res.status === 401) {
    const { code } = accessTokenErrorSchema.parse(await res.json());

    if (code === 'ACCESS_TOKEN_EXPIRED' && refreshFn) {
      const { data } = await refreshFn();

      if (data) {
        accessToken = data.accessToken;
        res = await doRequest(data.accessToken);
      }
    }
  }

  return res;
}
