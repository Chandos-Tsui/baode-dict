const TOKEN_KEY = 'baode_dict_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };
  if (!isFormData) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
      if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    throw new Error(data.message || `请求失败 (${res.status})`);
  }

  if (data.code !== 0) {
    throw new Error(data.message || '请求失败');
  }

  return data.data as T;
}

// ─── Public API ───

export const api = {
  // Words
  getWords: (params: { q?: string; category?: string; tag?: string; page?: number; size?: number } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v != null) qs.set(k, String(v)); });
    return request(`/api/words?${qs}`);
  },
  getWord: (id: number) => request(`/api/words/${id}`),
  getRelatedWords: (id: number) => request(`/api/words/${id}/related`),
  getTags: () => request(`/api/words/tags`),

  // Categories
  getCategories: () => request(`/api/categories`),
  getCategory: (slug: string, page = 1, size = 20) =>
    request(`/api/categories/${slug}?page=${page}&size=${size}`),

  // Daily
  getDaily: (date?: string) => request(`/api/daily${date ? `?date=${date}` : ''}`),
  getDailyHistory: (limit = 30) => request(`/api/daily/history?limit=${limit}`),

  // Submissions (public)
  submitContribution: (data: {
    type: 'add' | 'correct';
    word_id?: number;
    proposed_data: any;
    contributor_name?: string;
    contributor_contact?: string;
    note?: string;
  }) => request(`/api/submissions`, { method: 'POST', body: JSON.stringify(data) }),

  // Auth
  login: (username: string, password: string) =>
    request(`/api/auth/login`, { method: 'POST', body: JSON.stringify({ username, password }) }),
  getMe: () => request(`/api/auth/me`),

  // ─── Admin API ───
  getStats: () => request(`/api/admin/stats`),

  // Words admin
  createWord: (data: any) =>
    request(`/api/admin/words`, { method: 'POST', body: JSON.stringify(data) }),
  updateWord: (id: number, data: any) =>
    request(`/api/admin/words/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWord: (id: number) =>
    request(`/api/admin/words/${id}`, { method: 'DELETE' }),
  uploadAudio: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('audio', file);
    return request(`/api/admin/words/${id}/audio`, { method: 'POST', body: formData });
  },
  deleteAudio: (id: number) =>
    request(`/api/admin/words/${id}/audio`, { method: 'DELETE' }),

  // Categories admin
  createCategory: (data: any) =>
    request(`/api/admin/categories`, { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: number, data: any) =>
    request(`/api/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: number) =>
    request(`/api/admin/categories/${id}`, { method: 'DELETE' }),

  // Submissions admin
  getSubmissions: (status?: string, page = 1, size = 20) =>
    request(`/api/admin/submissions/list${status ? `?status=${status}&` : '?'}page=${page}&size=${size}`),
  getSubmission: (id: number) => request(`/api/admin/submissions/detail/${id}`),
  approveSubmission: (id: number, data?: any) =>
    request(`/api/admin/submissions/${id}/approve`, { method: 'POST', body: JSON.stringify(data ? { data } : {}) }),
  rejectSubmission: (id: number, review_note: string) =>
    request(`/api/admin/submissions/${id}/reject`, { method: 'POST', body: JSON.stringify({ review_note }) }),

  // Daily admin
  setDaily: (date: string, word_id: number, editor_note?: string) =>
    request(`/api/admin/daily`, { method: 'POST', body: JSON.stringify({ date, word_id, editor_note }) }),
  getDailyList: () => request(`/api/admin/daily/list`),
  deleteDaily: (id: number) => request(`/api/admin/daily/${id}`, { method: 'DELETE' }),
};
