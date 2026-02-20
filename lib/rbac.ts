export type Role = "OFW_SPONSOR" | "FINANCE_LEAD" | "CAREGIVER" | "AUDITOR";

export const canApproveCards = (role?: string | null) =>
  role === "OFW_SPONSOR" || role === "FINANCE_LEAD";

export const canCreateCards = (role?: string | null) =>
  role === "OFW_SPONSOR" || role === "FINANCE_LEAD" || role === "CAREGIVER";

export const canUploadReceipts = (role?: string | null) =>
  role === "OFW_SPONSOR" || role === "FINANCE_LEAD" || role === "CAREGIVER";
