import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

let getToken = () => null;
let onUnauthorized = async () => false;

export function configureApi({ tokenProvider, unauthorizedHandler }) {
  getToken = tokenProvider;
  onUnauthorized = unauthorizedHandler;
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['x-app-context'] = 'user';
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const recovered = await onUnauthorized();
      if (recovered) return api(original);
    }
    return Promise.reject(error);
  },
);