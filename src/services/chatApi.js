import axios from 'axios';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:8000').replace('/api', '') + '/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

class ChatApiService {
  // Chat Rooms (using main room endpoints)
  async getChatRooms() {
    const response = await api.get('/rooms');
    return response.data;
  }

  async createChatRoom(data) {
    const response = await api.post('/rooms', data);
    return response.data;
  }

  async getChatRoom(roomId) {
    const response = await api.get(`/rooms/${roomId}`);
    return response.data;
  }

  async updateChatRoom(roomId, data) {
    const response = await api.put(`/rooms/${roomId}`, data);
    return response.data;
  }

  async deleteChatRoom(roomId) {
    const response = await api.delete(`/rooms/${roomId}`);
    return response.data;
  }

  // Chat Messages
  async getMessages(roomId, page = 1) {
    const response = await api.get(`/chat-rooms/${roomId}/messages`, {
      params: { page }
    });
    return response.data;
  }

  async sendMessage(roomId, data) {
    const response = await api.post(`/chat-rooms/${roomId}/messages`, data);
    return response.data;
  }

  async sendMessageWithFile(roomId, formData) {
    const response = await api.post(`/chat-rooms/${roomId}/messages`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async editMessage(messageId, message) {
    const response = await api.put(`/chat-messages/${messageId}`, { message });
    return response.data;
  }

  async deleteMessage(messageId) {
    const response = await api.delete(`/chat-messages/${messageId}`);
    return response.data;
  }

  async sendTypingIndicator(roomId, isTyping) {
    const response = await api.post(`/chat-rooms/${roomId}/typing`, {
      is_typing: isTyping
    });
    return response.data;
  }

  async uploadFile(roomId, file, type = 'file') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await api.post(`/chat-rooms/${roomId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Room usage
  async getRoomUsage() {
    const response = await api.get('/rooms/usage/summary');
    return response.data;
  }
}

const chatApiService = new ChatApiService();
export default chatApiService; 