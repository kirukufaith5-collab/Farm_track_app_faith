import { api } from './client.js';

export function register({ email, phone, password, full_name }) {
  return api('/auth/register', {
    method: 'POST',
    body: { email, phone, password, full_name: full_name || null },
  });
}

export function login({ email, password }) {
  return api('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function logout() {
  return api('/auth/logout', { method: 'POST' });
}

export function refresh() {
  return api('/auth/refresh', { method: 'POST' });
}

export function me() {
  return api('/auth/me');
}
