import axios from 'axios';
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

let authToken: string | null = null;

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  console.log('[API Request]', {
    url: config.url,
    method: config.method,
    hasToken: !!authToken
  });
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('[API Response]', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  async (error) => {
    console.log('[API Error]', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      response: error.response?.data
    });
    if (error.response?.status === 401) {
      // Only clear token on 401, let the auth context handle redirect
      console.log('[API Error] Unauthorized - clearing token');
      authToken = null;
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: async (data: { username: string; email: string; password: string; name: string }) => {
    const response = await api.post('/auth/register', data);
    console.log('[API Register] Response:', {
      hasToken: !!response.data.token,
      hasUser: !!response.data.user
    });
    if (response.data.token) {
      console.log('[API Register] Setting auth token');
      authToken = response.data.token;
    }
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    console.log('[API Login] Response:', {
      hasToken: !!response.data.token,
      hasUser: !!response.data.user
    });
    if (response.data.token) {
      console.log('[API Login] Setting auth token');
      authToken = response.data.token;
    }
    return response.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
    authToken = null;
  },
};

export const userApi = {
  getCurrentUser: async () => {
    console.log('[API getCurrentUser] Making request with token:', !!authToken);
    const response = await api.get('/users/me');
    console.log('[API getCurrentUser] Response:', response.data);
    return response.data;
  },

  updateUser: async (id: string, data: Partial<{ username: string; email: string; name: string }>) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string) => {
    await api.delete(`/users/${id}`);
  },
};

export default api;
