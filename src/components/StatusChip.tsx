import React from "react";
import { Chip } from "@mui/material";
import type { WorkStatus } from "../config/appConfig";

export default function StatusChip({ status, overdue }: { status: WorkStatus; overdue: boolean }) {
  const label = status.replaceAll("_", " ");
  const color =
    status === "DONE" ? "success" :
    overdue ? "error" :
    status === "BLOCKED" ? "warning" :
    status === "IN_PROGRESS" ? "info" : "default";

  return (
    <Chip
      size="small"
      label={label}
      color={color as any}
      variant={status === "NOT_STARTED" ? "outlined" : "filled"}
    />
  );
}
