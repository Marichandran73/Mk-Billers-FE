export const ADMIN_RESTRICTED_MESSAGE =
  "You don't have access to create user or report";

const PLAN_BILL_LIMITS: Record<string, number | null> = {
  FREE: 6,
  PRO: 200,
  PREMIUM: 500,
  BUSINESS: null,
};

export type RestrictedAction =
  | "create-user"
  | "edit-user"
  | "delete-user"
  | "print-bill"
  | "save-bill"
  | "edit-bill"
  | "delete-bill"
  | "generate-report"
  | "download-report"
  | "save-settings"
  | "create-bill";

export function getRestrictedActionMessage(action: RestrictedAction): string {
  const messages: Record<RestrictedAction, string> = {
    "create-user": "You don't have access to create users",
    "edit-user": "You don't have access to edit users",
    "delete-user": "You don't have access to delete users",
    "print-bill": "You don't have access to print bills",
    "save-bill": "You don't have access to save bills",
    "edit-bill": "You don't have access to edit bills",
    "delete-bill": "You don't have access to delete bills",
    "generate-report": "You don't have access to generate reports",
    "download-report": "You don't have access to download reports",
    "save-settings": "You don't have access to save settings",
    "create-bill": "You don't have access to create bills",
  };
  return messages[action];
}

export function isInactiveAdmin(): boolean {
  const rawUser = localStorage.getItem("MKbillers_user");
  if (!rawUser) return false;
  try {
    const user = JSON.parse(rawUser) as {
      role?: string;
      company?: { is_active?: boolean };
    };
    return user?.role === "ADMIN" && user?.company?.is_active === false;
  } catch {
    return false;
  }
}

export function isStaffUser(): boolean {
  const rawUser = localStorage.getItem("MKbillers_user");
  if (!rawUser) return false;
  try {
    const user = JSON.parse(rawUser) as { role?: string };
    return user?.role === "STAFF";
  } catch {
    return false;
  }
}

export function getCurrentPlanBillLimit(): number | null {
  const rawUser = localStorage.getItem("MKbillers_user");
  if (!rawUser) return PLAN_BILL_LIMITS.FREE;
  try {
    const user = JSON.parse(rawUser) as {
      company?: { plan_code?: string };
    };
    const planCode = (user?.company?.plan_code ?? "FREE").toUpperCase();
    return planCode in PLAN_BILL_LIMITS
      ? PLAN_BILL_LIMITS[planCode]
      : PLAN_BILL_LIMITS.FREE;
  } catch {
    return PLAN_BILL_LIMITS.FREE;
  }
}

export function hasStaffReachedBillLimit(totalBills: number): boolean {
  if (!isStaffUser()) return false;
  const planBillLimit = getCurrentPlanBillLimit();
  if (planBillLimit == null) return false;
  return totalBills >= planBillLimit;
}
