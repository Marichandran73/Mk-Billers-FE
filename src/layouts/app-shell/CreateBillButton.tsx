import { Plus } from "lucide-react";
import { NavLink } from "react-router-dom";

export function CreateBillButton({
  disabled = false,
  onBlocked,
}: {
  disabled?: boolean;
  onBlocked?: () => void;
}) {
  return (
    <NavLink
      className={`btn-primary ${disabled ? "pointer-events-auto opacity-60" : ""}`}
      to="/bills/new"
      aria-disabled={disabled}
      onClick={(event) => {
        if (!disabled) return;
        event.preventDefault();
        onBlocked?.();
      }}
    >
      <Plus className="h-4 w-4" /> Create Bill
    </NavLink>
  );
}
