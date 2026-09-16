import { useEffect } from "react";
import { toast } from "react-toastify";

import {
  getRestrictedActionMessage,
  isStaffUser,
  isInactiveAdmin,
} from "../../utils/permissions";
import { BillsPage } from "./BillsPage";
import { EmptyState } from "./EmptyState";

export function ReportsPage() {
  const reportRestricted = isInactiveAdmin() || isStaffUser();

  useEffect(() => {
    if (reportRestricted) {
      toast.error(getRestrictedActionMessage("generate-report"));
    }
  }, [reportRestricted]);

  if (reportRestricted) {
    return (
      <EmptyState
        title="Report access restricted"
        description="You do not have access to generate or download reports."
      />
    );
  }

  return (
    <BillsPage
      restrictReportGeneration={reportRestricted}
      restrictAllActions={reportRestricted}
    />
  );
}
