import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

export function IconLink({
  to,
  label,
  children,
  disabled = false,
  onBlocked,
}: {
  to: string;
  label: string;
  children: ReactNode;
  disabled?: boolean;
  onBlocked?: () => void;
}) {
  return (
    <NavLink
      className={`icon-btn ${disabled ? "pointer-events-auto opacity-50" : ""}`}
      to={to}
      aria-label={label}
      aria-disabled={disabled}
      onClick={(event) => {
        if (!disabled) return;
        event.preventDefault();
        onBlocked?.();
      }}
    >
      {children}
    </NavLink>
  );
}
