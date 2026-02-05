import type { Assignment } from "../types/schema";
import { daysLeft, isOverdue } from "./date";

function esc(v: any): string {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return '"' + s.replaceAll('"', '""') + '"';
  return s;
}

export function assignmentsToCSV(rows: Assignment[]): string {
  const header = [
    "S.N.","Date Assigned","Employee Name","Employee ID","Designation","Task Type","Project","Task Details",
    "Deadline","Priority","Work Status","Employee Remarks","Last Update Date","CEO Comment","Done Date","Days Left","Overdue?"
  ];
  const lines = [header.map(esc).join(",")];

  for (const a of rows) {
    const dl = daysLeft(a.deadline);
    const od = isOverdue(a.deadline, a.workStatus) ? "Yes" : "No";
    lines.push([
      a.sn, a.dateAssigned, a.employeeName, a.employeeHumanId, a.designation, a.taskType, a.project, a.taskDetails,
      a.deadline, a.priority, a.workStatus, a.employeeRemarks, a.lastUpdateAt ?? "", a.ceoComment, a.doneDate ?? "", dl, od
    ].map(esc).join(","));
  }
  return lines.join("\n");
}

export function downloadText(filename: string, text: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
