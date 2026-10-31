import { api } from "./api";
import type {
  AuthResponse,
  EmailTemplate,
  EmailTemplateId,
  ForgotPasswordResponse,
  InviteCompanyResponse,
  SuperAdminOverview,
  User,
} from "../types";

export interface InviteCompanyPayload {
  company_name: string;
  company_email: string;
  admin_email: string;
  email_template?: EmailTemplateId;
}

export interface InviteUserPayload {
  email: string;
  role: "ADMIN" | "STAFF";
  email_template?: EmailTemplateId;
}

export interface CompanyAccessStatusPayload {
  is_active: boolean;
}

export interface CompanyAccessStatusResponse {
  company_id: number;
  is_active: boolean;
  message: string;
}

export interface RoleUpdatePayload {
  role: "ADMIN" | "STAFF";
}

export interface RoleUpdateResponse {
  user_id: number;
  email: string;
  previous_role: string;
  current_role: string;
  message: string;
}

export interface UserAccessStatusPayload {
  is_active: boolean;
}

export interface UserAccessStatusResponse {
  user_id: number;
  email: string;
  is_active: boolean;
  message: string;
}

export const authApi = {
  async register(companyName: string, email: string, password: string) {
    const { data } = await api.post<AuthResponse>("/auth/register", {
      company_name: companyName,
      email,
      password,
    });
    return data;
  },
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
  async setupPassword(email: string, token: string, password: string) {
    const { data } = await api.post<AuthResponse>("/auth/setup-password", {
      email,
      token,
      password,
    });
    return data;
  },
  async emailTemplates(purpose: "invite" | "company" | "reset" = "invite") {
    const { data } = await api.get<EmailTemplate[]>("/auth/email-templates", {
      params: { purpose },
    });
    return data;
  },
  async inviteUser(payload: InviteUserPayload) {
    const { data } = await api.post<InviteCompanyResponse>(
      "/auth/invite",
      payload,
    );
    return data;
  },
  async createCompanyAccess(payload: InviteCompanyPayload) {
    const { data } = await api.post<InviteCompanyResponse>(
      "/auth/company-access",
      payload,
    );
    return data;
  },
  async companiesOverview(userSearch?: string) {
    const { data } = await api.get<SuperAdminOverview>(
      "/auth/companies/overview",
      {
        params: userSearch?.trim() ? { user_search: userSearch.trim() } : {},
      },
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
  async updateUserRole(userId: number, payload: RoleUpdatePayload) {
    const { data } = await api.patch<RoleUpdateResponse>(
      `/auth/users/${userId}/role`,
      payload,
    );
    return data;
  },
  async updateUserAccessStatus(userId: number, payload: UserAccessStatusPayload) {
    const { data } = await api.patch<UserAccessStatusResponse>(
      `/auth/users/${userId}/access`,
      payload,
    );
    return data;
  },
  async me() {
    const { data } = await api.get<User>("/auth/me");
    return data;
  },
};
