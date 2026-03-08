import axios from 'axios';
import { useAuthStore } from './store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: async (email: string, password: string, securityQuestions: any) => {
    const response = await apiClient.post('/api/auth/register', {
      email,
      password,
      securityQuestions
    });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await apiClient.post('/api/auth/login', {
      email,
      password
    });
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await apiClient.post('/api/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  getSecurity: async () => {
    const response = await apiClient.get('/api/auth/security');
    return response.data;
  },

  updateSecurity: async (securityQuestions: any, emergencyContacts: any) => {
    const response = await apiClient.post('/api/auth/security', {
      securityQuestions,
      emergencyContacts
    });
    return response.data;
  }
};

// Vault endpoints
export const vaultAPI = {
  getItems: async () => {
    const response = await apiClient.get('/api/vault');
    return response.data;
  },

  upload: async (fileName: string, fileType: string, encryptedContent: string, authTag: string, nonce: string, recipients: string[] = [], tags: string[] = []) => {
    const response = await apiClient.post('/api/vault/upload', {
      fileName,
      fileType,
      encryptedContent,
      authTag,
      nonce,
      recipients,
      tags
    });
    return response.data;
  },

  getItem: async (vaultId: string) => {
    const response = await apiClient.get(`/api/vault/${vaultId}`);
    return response.data;
  },

  updateItem: async (vaultId: string, fileName?: string, tags?: string[], recipients?: string[]) => {
    const response = await apiClient.put(`/api/vault/${vaultId}`, {
      fileName,
      tags,
      recipients
    });
    return response.data;
  },

  deleteItem: async (vaultId: string) => {
    const response = await apiClient.delete(`/api/vault/${vaultId}`);
    return response.data;
  },

  search: async (query: string) => {
    const response = await apiClient.get(`/api/vault/search/${query}`);
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get('/api/vault/stats');
    return response.data;
  }
};

// Heir endpoints
export const heirAPI = {
  getAll: async () => {
    const response = await apiClient.get('/api/heirs');
    return response.data;
  },

  add: async (email: string, name: string, relationship: string, inheritanceShare: number, permissions: string[]) => {
    const response = await apiClient.post('/api/heirs', {
      email,
      name,
      relationship,
      inheritanceShare,
      permissions
    });
    return response.data;
  },

  getHeir: async (heirId: string) => {
    const response = await apiClient.get(`/api/heirs/${heirId}`);
    return response.data;
  },

  update: async (heirId: string, name?: string, relationship?: string, inheritanceShare?: number, permissions?: string[]) => {
    const response = await apiClient.put(`/api/heirs/${heirId}`, {
      name,
      relationship,
      inheritanceShare,
      permissions
    });
    return response.data;
  },

  confirm: async (heirId: string, email: string) => {
    const response = await apiClient.post(`/api/heirs/${heirId}/confirm`, { email });
    return response.data;
  },

  delete: async (heirId: string) => {
    const response = await apiClient.delete(`/api/heirs/${heirId}`);
    return response.data;
  },

  getDistribution: async () => {
    const response = await apiClient.get('/api/heirs/distribution/summary');
    return response.data;
  },

  getPending: async () => {
    const response = await apiClient.get('/api/heirs/status/pending');
    return response.data;
  }
};

// Inheritance endpoints
export const inheritanceAPI = {
  getRules: async () => {
    const response = await apiClient.get('/api/inheritance');
    return response.data;
  },

  create: async (ruleType: string, triggerCondition: any, beneficiaries: string[], releaseDate?: string, inactivityDays?: number, affectedVaults?: string[]) => {
    const response = await apiClient.post('/api/inheritance', {
      ruleType,
      triggerCondition,
      releaseDate,
      inactivityDays,
      beneficiaries,
      affectedVaults
    });
    return response.data;
  },

  getRule: async (ruleId: string) => {
    const response = await apiClient.get(`/api/inheritance/${ruleId}`);
    return response.data;
  },

  update: async (ruleId: string, triggerCondition?: any, beneficiaries?: string[], releaseDate?: string, inactivityDays?: number, affectedVaults?: string[]) => {
    const response = await apiClient.put(`/api/inheritance/${ruleId}`, {
      triggerCondition,
      releaseDate,
      inactivityDays,
      beneficiaries,
      affectedVaults
    });
    return response.data;
  },

  deactivate: async (ruleId: string) => {
    const response = await apiClient.post(`/api/inheritance/${ruleId}/deactivate`);
    return response.data;
  },

  delete: async (ruleId: string) => {
    const response = await apiClient.delete(`/api/inheritance/${ruleId}`);
    return response.data;
  },

  getTriggered: async () => {
    const response = await apiClient.get('/api/inheritance/status/triggered');
    return response.data;
  },

  getUpcoming: async () => {
    const response = await apiClient.get('/api/inheritance/schedule/upcoming');
    return response.data;
  },

  getInactivityStatus: async () => {
    const response = await apiClient.get('/api/inheritance/status/inactivity');
    return response.data;
  }
};

export default apiClient;