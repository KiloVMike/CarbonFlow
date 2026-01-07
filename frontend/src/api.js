import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const api = {
  health: () => apiClient.get('/health'),
  getSummary: () => apiClient.get('/summary'),
  getOrders: (page = 1, perPage = 10) => 
    apiClient.get('/orders', { params: { page, per_page: perPage } }),
  getOrderDetail: (orderNumber) => 
    apiClient.get(`/orders/${orderNumber}`),
  getAnalyticsByWarehouse: () => 
    apiClient.get('/analytics/by-warehouse'),
  getAnalyticsByCustomer: () => 
    apiClient.get('/analytics/by-customer'),
  getAnalyticsByMode: () => 
    apiClient.get('/analytics/by-mode'),
  getAnalyticsByMonth: () => 
    apiClient.get('/analytics/by-month'),
};

export default api;
