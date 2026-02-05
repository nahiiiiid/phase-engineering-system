import React from "react";
import {
  Box, Button, Card, CardContent, Divider, Stack, Typography, Alert, TextField
} from "@mui/material";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { useAppStore } from "../../state/store";
import { assignmentsToCSV, downloadText } from "../../utils/csv";
import { downloadJSON, readJsonFile } from "../../utils/jsonExport";
import type { Employee } from "../../types/schema";

export default function DataTools() {
  const data = useAppStore(s => s.data);
  const exportJSONPayload = useAppStore(s => s.exportJSON);
  const importJSON = useAppStore(s => s.importJSON);
  const resetAll = useAppStore(s => s.resetAll);

  const addEmployee = useAppStore(s => s.addEmployee);
  const updateEmployee = useAppStore(s => s.updateEmployee);
  const deleteEmployee = useAppStore(s => s.deleteEmployee);

  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  const downloadBackup = () => {
    setMsg(null); setErr(null);
    const payload = exportJSONPayload();
    downloadJSON("phase_engineering_full_backup.json", payload);
    setMsg("Backup downloaded.");
  };

  const downloadCSV = () => {
    setMsg(null); setErr(null);
    if (!data) return;
    const csv = assignmentsToCSV(data.assignments);
    downloadText("phase_engineering_tasks_all.csv", csv, "text/csv;charset=utf-8");
    setMsg("CSV exported.");
  };

  const onImport = async (file: File) => {
    setMsg(null); setErr(null);
    try {
      const json = await readJsonFile(file);
      importJSON(json);
      setMsg("Import successful. Data restored.");
    } catch (e: any) {
      setErr(e?.message || "Import failed.");
    }
  };

  const employees = data?.employees ?? [];

  const cols = React.useMemo<GridColDef<Employee>[]>(() => [
    { field: "name", headerName: "Name", flex: 1, editable: true, minWidth: 180 },
    { field: "employeeId", headerName: "Employee ID", width: 140, editable: true },
    { field: "designation", headerName: "Designation", flex: 1, editable: true, minWidth: 180 },
    { field: "accessCode", headerName: "Access Code", width: 140, editable: true, type: "number" },
    { field: "id", headerName: "Internal ID", width: 190 },
    {
      field: "actions", headerName: "Delete", width: 110, sortable: false, filterable: false,
      renderCell: (p) => (
        <Button color="error" size="small" onClick={() => deleteEmployee(p.row.id)}>
          Delete
        </Button>
      )
    }
  ], [deleteEmployee]);

  const processRowUpdate = async (newRow: Employee, oldRow: Employee) => {
    const patch: any = {};
    (["name","employeeId","designation","accessCode"] as const).forEach(k => {
      if (newRow[k] !== oldRow[k]) patch[k] = newRow[k];
    });
    if (Object.keys(patch).length) updateEmployee(oldRow.id, patch);
    return { ...oldRow, ...patch };
  };

  const [newEmp, setNewEmp] = React.useState({ name: "", employeeId: "", designation: "", accessCode: 0 });

  const addNew = () => {
    if (!newEmp.name.trim() || !newEmp.employeeId.trim() || !newEmp.accessCode) {
      setErr("Please fill Name, Employee ID, and Access Code.");
      return;
    }
    setErr(null);
    addEmployee({ ...newEmp } as any);
    setNewEmp({ name: "", employeeId: "", designation: "", accessCode: 0 });
    setMsg("Employee added.");
  };

  return (
    <Stack spacing={2.2}>
      <Box>
        <Typography variant="h5">Data & Admin (CEO only)</Typography>
        <Typography color="text.secondary">
          Backup/restore and manage employees. This replaces a backend admin panel.
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            {msg && <Alert severity="success">{msg}</Alert>}
            {err && <Alert severity="error">{err}</Alert>}

            <Typography variant="h6">Backup & restore (JSON)</Typography>
            <Typography variant="body2" color="text.secondary">
              JSON is the primary “database backup” format. Store backups in company drive regularly.
            </Typography>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              <Button variant="contained" onClick={downloadBackup}>Download Full Backup (JSON)</Button>
              <Button variant="outlined" component="label">
                Import Backup (JSON)
                <input type="file" accept="application/json" hidden onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onImport(f);
                  e.currentTarget.value = "";
                }} />
              </Button>
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            <Typography variant="h6">Export (CSV)</Typography>
            <Typography variant="body2" color="text.secondary">
              CSV is best for Excel/Google Sheets.
            </Typography>
            <Button variant="outlined" onClick={downloadCSV} sx={{ width: "fit-content" }}>
              Export All Assignments (CSV)
            </Button>

            <Divider sx={{ my: 1.5 }} />

            <Typography variant="h6">Employees (add / edit)</Typography>
            <Typography variant="body2" color="text.secondary">
              Edit Name, Employee ID, Designation and Access Code. Updates reflect everywhere immediately.
            </Typography>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1} flexWrap="wrap">
              <TextField label="Name" value={newEmp.name} onChange={(e) => setNewEmp(p => ({ ...p, name: e.target.value }))} />
              <TextField label="Employee ID" value={newEmp.employeeId} onChange={(e) => setNewEmp(p => ({ ...p, employeeId: e.target.value }))} />
              <TextField label="Designation" value={newEmp.designation} onChange={(e) => setNewEmp(p => ({ ...p, designation: e.target.value }))} />
              <TextField label="Access Code" type="number" value={newEmp.accessCode || ""} onChange={(e) => setNewEmp(p => ({ ...p, accessCode: Number(e.target.value) }))} />
              <Button variant="contained" onClick={addNew}>Add</Button>
            </Stack>

            <Box sx={{ height: 420 }}>
              <DataGrid
                rows={employees}
                columns={cols}
                getRowId={(r) => r.id}
                disableRowSelectionOnClick
                slots={{ toolbar: GridToolbar }}
                processRowUpdate={processRowUpdate}
                onProcessRowUpdateError={(e) => console.error(e)}
                sx={{ "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": { outline: "none" } }}
              />
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Typography variant="h6">Reset</Typography>
            <Typography variant="body2" color="text.secondary">
              Clears browser-stored data and restores demo seed data.
            </Typography>
            <Button variant="outlined" color="error" onClick={resetAll} sx={{ width: "fit-content" }}>
              Reset Everything (Local Data)
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
