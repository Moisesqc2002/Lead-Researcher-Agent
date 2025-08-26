import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  email: string;
  name?: string;
  businessName?: string;
  businessType?: string;
  goals?: string;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'RESEARCHING' | 'COMPLETED' | 'FAILED';
  targetRole?: string;
  targetIndustry?: string;
  targetLocation?: string;
  companySize?: string;
  icpDetails?: any;
  leads?: Lead[];
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  emailVerified: boolean;
  linkedinUrl?: string;
  companyName?: string;
  role?: string;
  website?: string;
  aboutSummary?: string;
  dataPoints?: any;
  qualificationReason?: string;
  interestRating?: number;
  createdAt: string;
  updatedAt: string;
}

export const authApi = {
  login: async (email: string, name?: string) => {
    const { data } = await api.post('/api/auth/login', { email, name });
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  logout: async () => {
    await api.post('/api/auth/logout');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

export const userApi = {
  getProfile: async (): Promise<User> => {
    const { data } = await api.get('/api/users/profile');
    return data;
  },

  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const { data } = await api.put('/api/users/profile', userData);
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  }
};

export const campaignApi = {
  getCampaigns: async (): Promise<Campaign[]> => {
    const { data } = await api.get('/api/campaigns');
    return data;
  },

  getCampaign: async (id: string): Promise<Campaign> => {
    const { data } = await api.get(`/api/campaigns/${id}`);
    return data;
  },

  createCampaign: async (campaignData: Partial<Campaign>): Promise<Campaign> => {
    const { data } = await api.post('/api/campaigns', campaignData);
    return data;
  },

  updateCampaignStatus: async (id: string, status: Campaign['status']): Promise<Campaign> => {
    const { data } = await api.put(`/api/campaigns/${id}/status`, { status });
    return data;
  }
};

export interface CopilotMessage {
  type: 'user' | 'assistant';
  content: string;
}

export interface CopilotResponse {
  response: string;
  icpExtracted: boolean;
  icpDetails?: any;
}

export const copilotApi = {
  sendMessage: async (
    campaignId: string, 
    message: string, 
    conversationHistory: CopilotMessage[]
  ): Promise<CopilotResponse> => {
    const { data } = await api.post(`/api/copilot/chat/${campaignId}`, {
      message,
      conversationHistory
    });
    return data;
  },

  startResearch: async (campaignId: string): Promise<{ message: string; status: string }> => {
    const { data } = await api.post(`/api/copilot/research/${campaignId}`);
    return data;
  }
};