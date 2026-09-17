import axios from "axios";
import { toast } from "react-toastify";

import {
  getRestrictedActionMessage,
  isInactiveAdmin,
} from "../utils/permissions";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ,
});

function getRestrictionMessage(url: string, method: string): string | null {
  if (!isInactiveAdmin()) return null;

  const path = url.toLowerCase();
  const httpMethod = method.toUpperCase();

  if (path.startsWith("/auth/")) return null;

  if (path.startsWith("/reports")) {
    return getRestrictedActionMessage("generate-report");
  }

  if (path.startsWith("/bills")) {
    if (httpMethod === "POST") return getRestrictedActionMessage("create-bill");
    if (httpMethod === "PUT" || httpMethod === "PATCH")
      return getRestrictedActionMessage("edit-bill");
    if (httpMethod === "DELETE")
      return getRestrictedActionMessage("delete-bill");
  }

  if (path.startsWith("/customers")) {
    if (httpMethod === "POST") return getRestrictedActionMessage("create-user");
    if (httpMethod === "PUT" || httpMethod === "PATCH")
      return getRestrictedActionMessage("edit-user");
    if (httpMethod === "DELETE")
      return getRestrictedActionMessage("delete-user");
  }

  if (path.startsWith("/settings") || path.startsWith("/company")) {
    if (
      httpMethod === "POST" ||
      httpMethod === "PUT" ||
      httpMethod === "PATCH" ||
      httpMethod === "DELETE"
    ) {
      return getRestrictedActionMessage("save-settings");
    }
  }

  return null;
}

api.interceptors.request.use((config) => {
  // Prefer current storage key, but keep legacy fallback for existing sessions.
  const token =
    localStorage.getItem("MKbillers_token") ??
    localStorage.getItem("fe_bills_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const restrictionMessage = getRestrictionMessage(
    config.url ?? "",
    config.method ?? "GET",
  );
  if (restrictionMessage) {
    toast.error(restrictionMessage);
    return Promise.reject(new Error(restrictionMessage));
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("MKbillers_token");
      localStorage.removeItem("MKbillers_user");
      localStorage.removeItem("fe_bills_token");
      localStorage.removeItem("fe_bills_user");
      const publicAuthPaths = ["/login", "/register", "/forgot-password", "/set-password"];
      if (!publicAuthPaths.includes(window.location.pathname)) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
