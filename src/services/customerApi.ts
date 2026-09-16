import { api } from './api'
import type { Customer } from '../types'

export interface CustomerPayload {
  name: string
  company_name: string
  email: string
  phone: string
  address: string
  gst_number: string
  city: string
  state: string
  pincode: string
}

export const customerApi = {
  async list(search = '') {
    const { data } = await api.get<Customer[]>('/customers', { params: { search } })
    return data
  },
  async create(payload: CustomerPayload) {
    const { data } = await api.post<Customer>('/customers', payload)
    return data
  },
  async update(id: number, payload: CustomerPayload) {
    const { data } = await api.put<Customer>(`/customers/${id}`, payload)
    return data
  },
  async remove(id: number) {
    await api.delete(`/customers/${id}`)
  },
}
