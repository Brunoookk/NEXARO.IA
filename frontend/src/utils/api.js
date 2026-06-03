const BASE = import.meta.env.VITE_API_BASE_URL || 'https://nexaro-ia.onrender.com';

let authToken = localStorage.getItem('nexaro-token') || '';

export function setAuthToken(token) {
  authToken = token || '';
  if (authToken) localStorage.setItem('nexaro-token', authToken);
  else localStorage.removeItem('nexaro-token');
}

export function getAuthToken() {
  return authToken;
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.detail || 'Erro na requisicao');
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (payload) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/me'),
  updateMe: (payload) => request('/me', { method: 'PATCH', body: JSON.stringify(payload) }),
  changePassword: (payload) => request('/me/change-password', { method: 'POST', body: JSON.stringify(payload) }),
  deleteAccount: () => request('/me', { method: 'DELETE' }),
  getSettings: () => request('/settings'),
  updateSettings: (payload) => request('/settings', { method: 'PATCH', body: JSON.stringify(payload) }),
  listSessions: () => request('/sessions'),
  dashboard: () => request('/dashboard'),
  listConversations: (params = {}) => request(`/conversations?${new URLSearchParams(params)}`),
  createConversation: (payload = {}) => request('/conversations', { method: 'POST', body: JSON.stringify(payload) }),
  getConversation: (id) => request(`/conversations/${id}`),
  updateConversation: (id, payload) => request(`/conversations/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteConversation: (id) => request(`/conversations/${id}`, { method: 'DELETE' }),
  duplicateConversation: (id) => request(`/conversations/${id}/duplicate`, { method: 'POST' }),
  exportConversations: () => request('/conversations-export'),
  importConversations: (payload) => request('/conversations-import', { method: 'POST', body: JSON.stringify(payload) }),
  listSaved: (params = {}) => request(`/saved?${new URLSearchParams(params)}`),
  createSaved: (payload) => request('/saved', { method: 'POST', body: JSON.stringify(payload) }),
  deleteSaved: (id) => request(`/saved/${id}`, { method: 'DELETE' }),
  uploadPDF: (conversationId, file) => {
    const form = new FormData();
    form.append('file', file);
    return request(`/upload/pdf?conversation_id=${conversationId}`, { method: 'POST', body: form });
  },
};

export async function streamChat(conversationId, message, onEvent) {
  const res = await fetch(`${BASE}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify({ conversation_id: conversationId, message }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Falha no chat');
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split('\n').filter((line) => line.startsWith('data: '));
    for (const line of lines) {
      try {
        onEvent(JSON.parse(line.slice(6)));
      } catch {
        // Ignore malformed SSE fragments.
      }
    }
  }
}
