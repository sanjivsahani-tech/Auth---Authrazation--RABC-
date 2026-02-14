import axios from 'axios';

// Why: Frontend can point to different API hosts without code changes.
// Risk: Hardcoding base URL breaks staging/production deployments.
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

let getToken = () => null;
let onUnauthorized = async () => false;

// Why: AuthProvider injects runtime token/refresh handlers into one shared client.
// Behavior: Request/response interceptors call these handlers for every API call.
export function configureApi({ tokenProvider, unauthorizedHandler }) {
  getToken = tokenProvider;
  onUnauthorized = unauthorizedHandler;
}

api.interceptors.request.use((config) => {
  // Why: Access token stays in memory and is attached per request.
  // Risk: Missing Authorization header causes protected endpoints to fail with 401.
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Why: Backend dashboard endpoint changes response by app context.
  config.headers['x-app-context'] = 'admin';
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    // Why: Expired access tokens are recovered once using refresh flow.
    // Risk: Without retry guard, refresh loops can happen on persistent 401s.
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const recovered = await onUnauthorized();
      if (recovered) return api(original);
    }
    return Promise.reject(error);
  },
);
