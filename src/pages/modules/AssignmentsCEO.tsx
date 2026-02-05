import React from "react";
import { Autocomplete, Box, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridRenderEditCellParams, GridRowModel, GridToolbar } from "@mui/x-data-grid";
import { format } from "date-fns";
import { useAppStore } from "../../state/store";
import type { Assignment } from "../../types/schema";
import StatusChip from "../../components/StatusChip";
import { daysLeft, isOverdue } from "../../utils/date";

function today() { return new Date().toISOString().slice(0,10); }

function FreeSoloEditCell(props: GridRenderEditCellParams & { options: string[] }) {
  const { id, field, value, api, options } = props;
  const v = (value ?? "") as string;

  return (
    <Autocomplete
      freeSolo
      options={options}
      value={v}
      onChange={(_, newVal) => api.setEditCellValue({ id, field, value: newVal ?? "" })}
      onInputChange={(_, newInput) => api.setEditCellValue({ id, field, value: newInput ?? "" })}
      renderInput={(params) => <TextField {...params} variant="standard" />}
    />
  );
}

export default function AssignmentsCEO() {
  const data = useAppStore(s => s.data);
  const createAssignment = useAppStore(s => s.createAssignment);
  const updateAssignmentCore = useAppStore(s => s.updateAssignmentCore);

  const employees = data?.employees ?? [];
  const taskTypes = data?.masterData.taskTypes ?? [];
  const projects = data?.masterData.projects ?? [];
  const priorities = data?.masterData.priorities ?? [];

  const [createOpen, setCreateOpen] = React.useState(false);
  const rows = data?.assignments ?? [];

  const designationOptions = React.useMemo(
    () => [...new Set(employees.map(e => e.designation).filter(Boolean))],
    [employees]
  );

  const columns = React.useMemo<GridColDef[]>(() => [
    { field: "sn", headerName: "S.N.", width: 90, editable: true, type: "number" },
    {
      field: "dateAssigned", headerName: "Date Assigned", width: 140, editable: true,
      valueFormatter: (p) => p.value ? format(new Date(p.value), "yyyy-MM-dd") : ""
    },

    { field: "employeeName", headerName: "Employee Name", width: 190, editable: false },
    { field: "employeeHumanId", headerName: "Employee ID", width: 120, editable: false },

    {
      field: "designation", headerName: "Designation", width: 170, editable: true,
      renderEditCell: (p) => <FreeSoloEditCell {...p} options={designationOptions} />
    },

    {
      field: "taskType", headerName: "Task Type", width: 170, editable: true,
      renderEditCell: (p) => <FreeSoloEditCell {...p} options={taskTypes} />
    },

    {
      field: "project", headerName: "Project", width: 200, editable: true,
      renderEditCell: (p) => <FreeSoloEditCell {...p} options={projects} />
    },

    { field: "taskDetails", headerName: "Task Details", width: 420, editable: true },

    {
      field: "deadline", headerName: "Deadline", width: 140, editable: true,
      valueFormatter: (p) => p.value ? format(new Date(p.value), "yyyy-MM-dd") : ""
    },

    { field: "priority", headerName: "Priority", width: 120, editable: true, type: "singleSelect", valueOptions: priorities },

    {
      field: "workStatus", headerName: "Work Status", width: 150, editable: false,
      renderCell: (p) => <StatusChip status={p.row.workStatus} overdue={isOverdue(p.row.deadline, p.row.workStatus)} />
    },

    { field: "employeeRemarks", headerName: "Employee Remarks", width: 260, editable: false },
    {
      field: "lastUpdateAt", headerName: "Last Update Date", width: 180, editable: false,
      valueFormatter: (p) => p.value ? format(new Date(p.value), "yyyy-MM-dd HH:mm") : ""
    },

    { field: "ceoComment", headerName: "CEO Comment", width: 260, editable: true },
    { field: "doneDate", headerName: "Done Date", width: 140, editable: false },

    { field: "daysLeft", headerName: "Days Left", width: 110, editable: false, valueGetter: (p) => daysLeft(p.row.deadline) },

    { field: "overdue", headerName: "Overdue?", width: 110, editable: false, valueGetter: (p) => isOverdue(p.row.deadline, p.row.workStatus) ? "Yes" : "No" },
  ], [taskTypes, projects, priorities, designationOptions]);

  const processRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
    const patch: any = {};
    const allowed = ["sn","dateAssigned","designation","taskType","project","taskDetails","deadline","priority","ceoComment"];
    for (const k of allowed) {
      if (newRow[k] !== oldRow[k]) patch[k] = newRow[k];
    }
    if (Object.keys(patch).length) updateAssignmentCore(oldRow.id, patch);
    return { ...oldRow, ...patch };
  };

  const [createForm, setCreateForm] = React.useState({
    sn: 1,
    dateAssigned: today(),
    employeeId: employees[0]?.id ?? "",
    designation: employees[0]?.designation ?? "",
    taskType: taskTypes[0] ?? "Design",
    project: projects[0] ?? "Phase Tower",
    taskDetails: "",
    deadline: today(),
    priority: (priorities[1] ?? "MEDIUM") as any,
    ceoComment: "Please update progress daily.",
  });

  React.useEffect(() => {
    if (!data) return;
    setCreateForm(p => ({
      ...p,
      employeeId: p.employeeId || employees[0]?.id || "",
      designation: p.designation || employees[0]?.designation || "",
      taskType: p.taskType || taskTypes[0] || "Design",
      project: p.project || projects[0] || "Phase Tower",
      priority: p.priority || (priorities[1] ?? "MEDIUM"),
    }));
  }, [data, employees, taskTypes, projects, priorities]);

  const setF = (k: string, v: any) => setCreateForm(p => ({ ...p, [k]: v }));

  const create = () => {
    if (!createForm.employeeId) return;
    createAssignment(createForm as any);
    setCreateOpen(false);
  };

  return (
    <Stack spacing={2.2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h5">Main Assignments (CEO)</Typography>
          <Typography color="text.secondary">
            Spreadsheet-style master table. Employee updates auto-sync into this table.
          </Typography>
        </Box>

        <Button variant="contained" onClick={() => setCreateOpen(true)}>New Assignment</Button>
      </Stack>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(r: Assignment) => r.id}
            disableRowSelectionOnClick
            slots={{ toolbar: GridToolbar }}
            processRowUpdate={processRowUpdate}
            onProcessRowUpdateError={(e) => console.error(e)}
            pageSizeOptions={[10, 20, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 20, page: 0 } } }}
            sx={{
              "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": { outline: "none" },
              "& .MuiDataGrid-row.Mui-selected": { backgroundColor: "rgba(30,58,138,0.08) !important" },
            }}
          />
        </CardContent>
      </Card>

      {createOpen && (
        <Card sx={{ border: "1px solid rgba(15,23,42,0.12)" }}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">Create new assignment</Typography>

              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <TextField label="S.N." type="number" value={createForm.sn} onChange={(e) => setF("sn", Number(e.target.value))} sx={{ width: 140 }} />
                <TextField label="Date Assigned" type="date" value={createForm.dateAssigned} onChange={(e) => setF("dateAssigned", e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 190 }} />

                <TextField
                  select
                  label="Employee"
                  value={createForm.employeeId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const emp = employees.find(x => x.id === id);
                    setF("employeeId", id);
                    setF("designation", emp?.designation ?? "");
                  }}
                  sx={{ minWidth: 260 }}
                >
                  {employees.map(e => <MenuItem key={e.id} value={e.id}>{e.name} ({e.employeeId})</MenuItem>)}
                </TextField>

                <Autocomplete
                  freeSolo
                  options={designationOptions}
                  value={createForm.designation}
                  onInputChange={(_, v) => setF("designation", v)}
                  renderInput={(params) => <TextField {...params} label="Designation" sx={{ minWidth: 220 }} />}
                />
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <Autocomplete
                  freeSolo
                  options={taskTypes}
                  value={createForm.taskType}
                  onInputChange={(_, v) => setF("taskType", v)}
                  renderInput={(params) => <TextField {...params} label="Task Type" sx={{ minWidth: 240 }} />}
                />

                <Autocomplete
                  freeSolo
                  options={projects}
                  value={createForm.project}
                  onInputChange={(_, v) => setF("project", v)}
                  renderInput={(params) => <TextField {...params} label="Project" sx={{ minWidth: 280 }} />}
                />

                <TextField label="Deadline" type="date" value={createForm.deadline} onChange={(e) => setF("deadline", e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 190 }} />

                <TextField select label="Priority" value={createForm.priority} onChange={(e) => setF("priority", e.target.value)} sx={{ width: 170 }}>
                  {priorities.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </TextField>
              </Stack>

              <TextField label="Task Details" value={createForm.taskDetails} onChange={(e) => setF("taskDetails", e.target.value)} multiline minRows={3} />
              <TextField label="CEO Comment" value={createForm.ceoComment} onChange={(e) => setF("ceoComment", e.target.value)} />

              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button variant="contained" onClick={create}>Create</Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
