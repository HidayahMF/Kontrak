import type { AuthUser, Contract, Employee, Page, Summary } from './types';

const base = import.meta.env.VITE_API_URL ?? '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    ...options,
  });
  const raw = await response.text();
  let json: { data?: T; message?: string } = {};
  try { if (raw) json = JSON.parse(raw); } catch {}
  if (!response.ok) {
    if (response.status === 401 && !['/auth/login', '/auth/me'].includes(path) && location.pathname !== '/login') location.replace('/login');
    throw new Error(json.message ?? 'Terjadi kesalahan pada server.');
  }
  if (!('data' in json)) throw new Error('Format response server tidak valid.');
  return json.data as T;
}

export const api = {
  login: (input: { nip: string; birthCode: string }) => request<{ user: AuthUser }>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  me: () => request<{ user: AuthUser }>('/auth/me'),
  logout: () => request<null>('/auth/logout', { method: 'POST' }),
  employees: (search: string) => request<Employee[]>(`/employees?search=${encodeURIComponent(search)}`),
  summary: () => request<Summary>('/dashboard/summary'),
  contracts: (params: URLSearchParams) => request<Page>(`/contracts?${params}`),
  contract: (id: number) => request<Contract>(`/contracts/${id}`),
  create: (input: { nip: string; startDate: string; endDate: string }) => request<Contract>('/contracts', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: number, input: { nip: string; startDate: string; endDate: string }) => request<Contract>(`/contracts/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  remove: (id: number) => request<null>(`/contracts/${id}`, { method: 'DELETE' }),
};
