import { useEffect } from "react";
import { toast } from "react-toastify";

import {
  getRestrictedActionMessage,
  isInactiveAdmin,
} from "../../utils/permissions";
import { BillsPage } from "./BillsPage";
import { EmptyState } from "./EmptyState";

export function ReportsPage() {
  const reportRestricted = isInactiveAdmin();

  useEffect(() => {
    if (reportRestricted) {
      toast.error(getRestrictedActionMessage("generate-report"));
    }
  }, [reportRestricted]);

  if (reportRestricted) {
    return (
      <EmptyState
        title="Report access restricted"
        description="Company is inactive. Admin cannot generate or download reports."
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
