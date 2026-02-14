import axios from 'axios';

// Why: Environment-based host keeps same build usable in local/staging/prod.
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

let getToken = () => null;
let onUnauthorized = async () => false;

// Why: AuthProvider injects runtime auth dependencies without recreating axios instance.
export function configureApi({ tokenProvider, unauthorizedHandler }) {
  getToken = tokenProvider;
  onUnauthorized = unauthorizedHandler;
}

api.interceptors.request.use((config) => {
  // Why: Protected APIs require bearer token on every request.
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Why: Backend dashboard response changes for user app context.
  config.headers['x-app-context'] = 'user';
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    // Why: Token refresh enables seamless session continuity for normal expiry.
    // Risk: `_retry` guard prevents infinite retry loops on invalid refresh cookie.
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const recovered = await onUnauthorized();
      if (recovered) return api(original);
    }
    return Promise.reject(error);
  },
);
