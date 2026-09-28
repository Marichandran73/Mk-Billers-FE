import { api } from './api'
import type {
  Company,
  CurrentPlan,
  InvoiceSettings,
  Plan,
  PlanSelectionResponse,
  UserInvoiceTemplate,
} from '../types'

export const settingsApi = {
  async company() {
    const { data } = await api.get<Company>('/company')
    return data
  },
  async updateCompany(payload: Partial<Company>) {
    const { data } = await api.put<Company>('/company', payload)
    return data
  },
  async invoice() {
    const { data } = await api.get<InvoiceSettings>('/settings/invoice')
    return data
  },
  async updateInvoice(payload: InvoiceSettings) {
    const { data } = await api.put<InvoiceSettings>('/settings/invoice', payload)
    return data
  },
  async customTemplate() {
    const { data } = await api.get<UserInvoiceTemplate>('/settings/custom-template')
    return data
  },
  async updateCustomTemplate(payload: UserInvoiceTemplate) {
    const { data } = await api.put<UserInvoiceTemplate>('/settings/custom-template', payload)
    return data
  },
  async plans() {
    const { data } = await api.get<Plan[]>('/settings/plans')
    return data
  },
  async currentPlan() {
    const { data } = await api.get<CurrentPlan>('/settings/plans/current')
    return data
  },
  async updateCurrentPlan(code: Plan['code']) {
    const { data } = await api.put<PlanSelectionResponse>('/settings/plans/current', { code })
    return data
  },
}
