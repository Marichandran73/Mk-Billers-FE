import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

type ProtectedRouteProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem("MKbillers_token");
  return token ? children : <Navigate to="/login" replace />;
}
