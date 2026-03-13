import axios from 'axios';

// Assuming your FastAPI server is on 8000
const API_BASE_URL = 'http://localhost:8000'; 

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const medfluxAPI = {
  // Triggers the massive full-pipeline simulation
  simulate: async (payload: any) => {
    const response = await apiClient.post('/simulate', payload);
    return response.data;
  }
};