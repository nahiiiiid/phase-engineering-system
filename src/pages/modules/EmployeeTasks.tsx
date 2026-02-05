import React from "react";
import { Box, Button, Card, CardContent, MenuItem, Stack, TextField, Typography, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { format } from "date-fns";
import { APP_CONFIG } from "../../config/appConfig";
import { useAppStore } from "../../state/store";
import type { Assignment } from "../../types/schema";
import StatusChip from "../../components/StatusChip";
import { daysLeft, isOverdue } from "../../utils/date";

export default function EmployeeTasks() {
  const session = useAppStore(s => s.session);
  const data = useAppStore(s => s.data);
  const updateByEmployee = useAppStore(s => s.updateByEmployee);

  const statuses = (data?.masterData.statuses ?? APP_CONFIG.statuses);
  const employees = data?.employees ?? APP_CONFIG.employees;

  const isCEO = session?.role === "CEO";
  const myEmployeeId = session?.role === "EMPLOYEE" ? session.employeeId : null;

  const [filterEmployee, setFilterEmployee] = React.useState<string>(myEmployeeId ?? (employees[0]?.id ?? ""));
  const effectiveEmployee = isCEO ? filterEmployee : (myEmployeeId ?? "");

  const rows = (data?.assignments ?? []).filter(a => !effectiveEmployee || a.employeeId === effectiveEmployee);

  const cols = React.useMemo<GridColDef[]>(() => [
    { field: "sn", headerName: "S.N.", width: 90 },
    { field: "dateAssigned", headerName: "Date Assigned", width: 140,
      valueFormatter: (p) => p.value ? format(new Date(p.value), "yyyy-MM-dd") : "" },
    { field: "taskType", headerName: "Task Type", width: 170 },
    { field: "project", headerName: "Project", width: 210 },
    { field: "taskDetails", headerName: "Task Details", width: 420 },
    { field: "deadline", headerName: "Deadline", width: 140,
      valueFormatter: (p) => p.value ? format(new Date(p.value), "yyyy-MM-dd") : "" },
    { field: "priority", headerName: "Priority", width: 120 },
    { field: "ceoComment", headerName: "CEO Comment", width: 240 },
    { field: "lastUpdateAt", headerName: "Last Update", width: 170,
      valueFormatter: (p) => p.value ? format(new Date(p.value), "yyyy-MM-dd HH:mm") : "" },
    { field: "doneDate", headerName: "Done Date", width: 140 },
    { field: "sn", headerName: "Assignment Row #", width: 170, description: "Row number in Master Assignments (S.N.)" },
    { field: "workStatus", headerName: "Status", width: 150,
      renderCell: (p) => <StatusChip status={p.row.workStatus} overdue={isOverdue(p.row.deadline, p.row.workStatus)} /> },
    { field: "employeeRemarks", headerName: "Employee Remarks", width: 260 },
    { field: "daysLeft", headerName: "Days Left", width: 110, valueGetter: (p) => daysLeft(p.row.deadline) },
    { field: "overdue", headerName: "Overdue?", width: 110, valueGetter: (p) => isOverdue(p.row.deadline, p.row.workStatus) ? "Yes" : "No" },
    { field: "actions", headerName: "Update", width: 140, sortable: false, filterable: false,
      renderCell: (p) => <UpdateInline row={p.row} onSave={updateByEmployee} statuses={statuses} /> }
  ], [updateByEmployee]);

  return (
    <Stack spacing={2.2}>
      <Box>
        <Typography variant="h5">{isCEO ? "Employee Task View (CEO)" : "My Task Updates"}</Typography>
        <Typography color="text.secondary">
          {isCEO
            ? "Select an employee to see their filtered view."
            : "You can update only: Status, Employee Remarks, Done Date. All core fields are read-only."}
        </Typography>
      </Box>

      {isCEO && (
        <Card>
          <CardContent>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems="center">
              <TextField select label="Employee" value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)} sx={{ minWidth: 280 }}>
                {employees.map(e => <MenuItem key={e.id} value={e.id}>{e.name} ({e.employeeId})</MenuItem>)}
              </TextField>
              <Typography variant="body2" color="text.secondary">
                Tip: This view matches what employees see. Updates sync instantly.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent sx={{ p: 0 }}>
          <DataGrid
            rows={rows}
            columns={cols}
            getRowId={(r: Assignment) => r.id}
            disableRowSelectionOnClick
            slots={{ toolbar: GridToolbar }}
            pageSizeOptions={[10, 20, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 20, page: 0 } } }}
            sx={{ "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": { outline: "none" } }}
          />
        </CardContent>
      </Card>
    </Stack>
  );
}

function UpdateInline({ row, onSave, statuses }: { row: Assignment; onSave: (id: string, patch: any) => void; statuses: string[] }) {
  const [status, setStatus] = React.useState(row.workStatus);
  const [remarks, setRemarks] = React.useState(row.employeeRemarks ?? "");
  const [doneDate, setDoneDate] = React.useState(row.doneDate ?? new Date().toISOString().slice(0, 10));
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setStatus(row.workStatus);
    setRemarks(row.employeeRemarks ?? "");
    setDoneDate(row.doneDate ?? new Date().toISOString().slice(0, 10));
  }, [row.id, row.workStatus, row.employeeRemarks, row.doneDate]);

  const isDone = status === "DONE";

  return (
    <>
      <Button size="small" variant="outlined" onClick={() => setOpen(true)}>
        Update
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        scroll="paper"
      >
        <DialogTitle>Update Task</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              This update will instantly sync to the Main Assignment table.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                fullWidth
              >
                {statuses.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s.replaceAll("_", " ")}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Done Date"
                type="date"
                value={doneDate}
                onChange={(e) => setDoneDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                disabled={!isDone}
                helperText={isDone ? "Required for DONE" : "Enable by setting status to DONE"}
              />
            </Stack>

            <TextField
              label="Employee Remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              multiline
              minRows={4}
              placeholder="What did you do today? Any blockers?"
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              onSave(row.id, {
                workStatus: status,
                employeeRemarks: remarks,
                doneDate: isDone ? doneDate : null,
              });
              setOpen(false);
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
