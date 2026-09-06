import { api } from './api'
import type { DashboardStats } from '../types'

export const dashboardApi = {
  async stats() {
    const { data } = await api.get<DashboardStats>('/dashboard/stats')
    return data
  },
}
