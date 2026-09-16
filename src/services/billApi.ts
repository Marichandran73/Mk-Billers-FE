import { api } from './api'
import type { Bill, BillPayload, PaginatedBills } from '../types'

export interface BillFilters {
  page?: number
  limit?: number
  search?: string
  month?: string
  year?: string
  customer_id?: string
}

export const billApi = {
  async list(filters: BillFilters) {
    const { data } = await api.get<PaginatedBills>('/bills', { params: filters })
    return data
  },
  async get(id: number) {
    const { data } = await api.get<Bill>(`/bills/${id}`)
    return data
  },
  async create(payload: BillPayload) {
    const { data } = await api.post<Bill>('/bills', payload)
    return data
  },
  async update(id: number, payload: BillPayload) {
    const { data } = await api.put<Bill>(`/bills/${id}`, payload)
    return data
  },
  async remove(id: number) {
    await api.delete(`/bills/${id}`)
  },
}
