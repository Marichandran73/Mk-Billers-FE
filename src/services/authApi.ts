import { api } from "./api";
import type {
  AuthResponse,
  ForgotPasswordResponse,
  InviteCompanyResponse,
  SuperAdminOverview,
  User,
} from "../types";

export interface InviteCompanyPayload {
  company_name: string;
  company_email: string;
  admin_email: string;
}

export interface CompanyAccessStatusPayload {
  is_active: boolean;
}

export interface CompanyAccessStatusResponse {
  company_id: number;
  is_active: boolean;
  message: string;
}

export const authApi = {
  async login(email: string, password: string) {
    const { data } = await api.post<AuthResponse>("/auth/login", {
      email,
      password,
    });
    return data;
  },
  async forgotPassword(email: string) {
    const { data } = await api.post<ForgotPasswordResponse>(
      "/auth/forgot-password",
      { email },
    );
    return data;
  },
  async setupPassword(token: string, password: string) {
    const { data } = await api.post<AuthResponse>("/auth/setup-password", {
      token,
      password,
    });
    return data;
  },
  async createCompanyAccess(payload: InviteCompanyPayload) {
    const { data } = await api.post<InviteCompanyResponse>(
      "/auth/company-access",
      payload,
    );
    return data;
  },
  async companiesOverview() {
    const { data } = await api.get<SuperAdminOverview>(
      "/auth/companies/overview",
    );
    return data;
  },
  async deleteCompanyAccess(companyId: number) {
    await api.delete(`/auth/company-access/${companyId}`);
  },
  async updateCompanyAccessStatus(
    companyId: number,
    payload: CompanyAccessStatusPayload,
  ) {
    const { data } = await api.patch<CompanyAccessStatusResponse>(
      `/auth/company-access/${companyId}/status`,
      payload,
    );
    return data;
  },
  async me() {
    const { data } = await api.get<User>("/auth/me");
    return data;
  },
};
