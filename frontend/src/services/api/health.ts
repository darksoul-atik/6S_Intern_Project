import axios from 'axios';
import { API_BASE_URL } from '@/constants/config';
import type { ApiResponse } from '@/types/api';

export interface HealthData {
  status: string;
  timestamp?: string;
  db?: 'connected' | 'disconnected';
  database?: {
    status: string;
    connectionState: number;
    host?: string;
  };
}

export async function getHealthStatus(): Promise<HealthData> {
  const url = `${API_BASE_URL}/health`;
  const res = await axios.get<ApiResponse<HealthData> | HealthData>(url);
  const data = res.data;
  if ('data' in data && data.data) {
    return data.data as HealthData;
  }
  return data as HealthData;
}
