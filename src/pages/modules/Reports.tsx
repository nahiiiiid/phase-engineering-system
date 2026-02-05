import React from "react";
import {
  Box, Button, Card, CardContent, Divider, Grid, MenuItem, Stack, TextField, Typography
} from "@mui/material";
import { APP_CONFIG } from "../../config/appConfig";
import { useAppStore } from "../../state/store";
import { assignmentsToCSV, downloadText } from "../../utils/csv";
import { downloadJSON } from "../../utils/jsonExport";
import { isOverdue } from "../../utils/date";

type Filters = {
  employeeId: string;
  project: string;
  taskType: string;
  status: string;
  priority: string;
  from: string;
  to: string;
  quick: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM";
};

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay(); // 0 sun
  const diff = (day + 6) % 7; // monday start
  x.setDate(x.getDate() - diff);
  return x;
}
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function startOfYear(d: Date) { return new Date(d.getFullYear(), 0, 1); }
function toISODate(d: Date) { return d.toISOString().slice(0,10); }

export default function Reports() {
  const session = useAppStore(s => s.session);
  const data = useAppStore(s => s.data);

  const md = data?.masterData;
  const employees = data?.employees ?? [];
  const projects = md?.projects ?? [];
  const taskTypes = md?.taskTypes ?? [];
  const priorities = md?.priorities ?? [];
  const statuses = md?.statuses ?? [];


  const isCEO = session?.role === "CEO";
  const myEmployeeId = session?.role === "EMPLOYEE" ? session.employeeId : "";

  const [f, setF] = React.useState<Filters>({
    employeeId: isCEO ? "" : myEmployeeId,
    project: "",
    taskType: "",
    status: "",
    priority: "",
    from: "",
    to: "",
    quick: "CUSTOM",
  });

  React.useEffect(() => {
    if (!isCEO) setF(p => ({ ...p, employeeId: myEmployeeId }));
  }, [isCEO, myEmployeeId]);

  const set = (k: keyof Filters, v: any) => setF(p => ({ ...p, [k]: v }));

  const rowsAll = data?.assignments ?? [];

  const rows = React.useMemo(() => {
    let r = rowsAll;

    if (!isCEO) r = r.filter(a => a.employeeId === myEmployeeId);
    if (f.employeeId) r = r.filter(a => a.employeeId === f.employeeId);
    if (f.project) r = r.filter(a => a.project === f.project);
    if (f.taskType) r = r.filter(a => a.taskType === f.taskType);
    if (f.status) r = r.filter(a => a.workStatus === f.status);
    if (f.priority) r = r.filter(a => a.priority === f.priority);

    if (f.from) r = r.filter(a => a.dateAssigned >= f.from);
    if (f.to) r = r.filter(a => a.dateAssigned <= f.to);

    return r;
  }, [rowsAll, f, isCEO, myEmployeeId]);

  const totals = React.useMemo(() => {
    const total = rows.length;
    const completed = rows.filter(a => a.workStatus === "DONE").length;
    const pending = total - completed;
    const overdue = rows.filter(a => isOverdue(a.deadline, a.workStatus)).length;
    return { total, completed, pending, overdue };
  }, [rows]);

  const byEmployee = React.useMemo(() => {
    const map = new Map<string, { employeeId: string; name: string; total: number; done: number; overdue: number }>();
    for (const a of rows) {
      const cur = map.get(a.employeeId) ?? { employeeId: a.employeeId, name: a.employeeName, total: 0, done: 0, overdue: 0 };
      cur.total += 1;
      if (a.workStatus === "DONE") cur.done += 1;
      if (isOverdue(a.deadline, a.workStatus)) cur.overdue += 1;
      map.set(a.employeeId, cur);
    }
    return [...map.values()].sort((x,y) => y.total - x.total);
  }, [rows]);

  const byProject = React.useMemo(() => {
    const map = new Map<string, { project: string; total: number; done: number; overdue: number }>();
    for (const a of rows) {
      const cur = map.get(a.project) ?? { project: a.project, total: 0, done: 0, overdue: 0 };
      cur.total += 1;
      if (a.workStatus === "DONE") cur.done += 1;
      if (isOverdue(a.deadline, a.workStatus)) cur.overdue += 1;
      map.set(a.project, cur);
    }
    return [...map.values()].sort((x,y) => y.total - x.total);
  }, [rows]);

  const applyQuick = (q: Filters["quick"]) => {
    const now = new Date();
    if (q === "CUSTOM") { set("quick", q); return; }
    let from = "";
    let to = toISODate(now);

    if (q === "DAILY") from = toISODate(now);
    if (q === "WEEKLY") from = toISODate(startOfWeek(now));
    if (q === "MONTHLY") from = toISODate(startOfMonth(now));
    if (q === "YEARLY") from = toISODate(startOfYear(now));

    setF(p => ({ ...p, quick: q, from, to }));
  };

  const exportCSV = () => {
    const csv = assignmentsToCSV(rows);
    downloadText("phase_engineering_tasks.csv", csv, "text/csv;charset=utf-8");
  };

  const exportJSON = () => {
    downloadJSON("phase_engineering_filtered_export.json", { schemaVersion: 1, updatedAt: new Date().toISOString(), assignments: rows });
  };

  const printReport = () => {
    const win = window.open("", "_blank");
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>Phase Engineering — Report</title>
          <style>
            body{font-family:Arial, sans-serif; padding:24px;}
            h1{font-size:18px;margin:0 0 8px;}
            .muted{color:#555;margin:0 0 16px;}
            table{border-collapse:collapse;width:100%;}
            th,td{border:1px solid #ccc;padding:6px;font-size:12px;vertical-align:top;}
            th{background:#f3f5f9;text-align:left;}
          </style>
        </head>
        <body>
          <h1>Phase Engineering — Task Report</h1>
          <p class="muted">Generated: ${new Date().toLocaleString()} • Rows: ${rows.length}</p>
          <p class="muted">Totals: Total ${totals.total}, Completed ${totals.completed}, Pending ${totals.pending}, Overdue ${totals.overdue}</p>
          <table>
            <thead>
              <tr>
                <th>S.N.</th><th>Date Assigned</th><th>Employee</th><th>Project</th><th>Task Type</th>
                <th>Task Details</th><th>Deadline</th><th>Priority</th><th>Status</th><th>Remarks</th><th>CEO Comment</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(a => `
                <tr>
                  <td>${a.sn}</td>
                  <td>${a.dateAssigned}</td>
                  <td>${a.employeeName} (${a.employeeHumanId})</td>
                  <td>${a.project}</td>
                  <td>${a.taskType}</td>
                  <td>${(a.taskDetails ?? "").replaceAll("<","&lt;")}</td>
                  <td>${a.deadline}</td>
                  <td>${a.priority}</td>
                  <td>${a.workStatus}</td>
                  <td>${(a.employeeRemarks ?? "").replaceAll("<","&lt;")}</td>
                  <td>${(a.ceoComment ?? "").replaceAll("<","&lt;")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <Stack spacing={2.2}>
      <Box>
        <Typography variant="h5">Reports, Filtering & Analytics</Typography>
        <Typography color="text.secondary">
          All calculations run client-side. Export as CSV/JSON, or print.
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            {isCEO && (
              <Grid item xs={12} md={3}>
                <TextField select label="Employee" value={f.employeeId} onChange={(e) => set("employeeId", e.target.value)} fullWidth>
                  <MenuItem value="">All</MenuItem>
                  {employees.map(e => <MenuItem key={e.id} value={e.id}>{e.name} ({e.employeeId})</MenuItem>)}
                </TextField>
              </Grid>
            )}

            <Grid item xs={12} md={3}>
              <TextField select label="Project" value={f.project} onChange={(e) => set("project", e.target.value)} fullWidth>
                <MenuItem value="">All</MenuItem>
                {projects.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </TextField>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField select label="Task Type" value={f.taskType} onChange={(e) => set("taskType", e.target.value)} fullWidth>
                <MenuItem value="">All</MenuItem>
                {taskTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>

            <Grid item xs={6} md={2}>
              <TextField label="From" type="date" value={f.from} onChange={(e) => set("from", e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField label="To" type="date" value={f.to} onChange={(e) => set("to", e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>

            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={1}>
                <TextField select label="Status" value={f.status} onChange={(e) => set("status", e.target.value)} sx={{ flex: 1 }}>
                  <MenuItem value="">All</MenuItem>
                  {statuses.map(s => <MenuItem key={s} value={s}>{s.replaceAll("_"," ")}</MenuItem>)}
                </TextField>
                <TextField select label="Priority" value={f.priority} onChange={(e) => set("priority", e.target.value)} sx={{ flex: 1 }}>
                  <MenuItem value="">All</MenuItem>
                  {priorities.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </TextField>
              </Stack>
            </Grid>

            <Grid item xs={12} md={8}>
              <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", md: "flex-end" }} flexWrap="wrap">
                <Button variant="outlined" onClick={() => applyQuick("DAILY")}>Daily</Button>
                <Button variant="outlined" onClick={() => applyQuick("WEEKLY")}>Weekly</Button>
                <Button variant="outlined" onClick={() => applyQuick("MONTHLY")}>Monthly</Button>
                <Button variant="outlined" onClick={() => applyQuick("YEARLY")}>Yearly</Button>
                <Button variant="text" onClick={() => applyQuick("CUSTOM")}>Custom</Button>
              </Stack>
            </Grid>

            <Grid item xs={12}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="flex-end">
                <Button variant="outlined" onClick={exportCSV}>Export CSV</Button>
                <Button variant="outlined" onClick={exportJSON}>Export JSON (filtered)</Button>
                <Button variant="contained" onClick={printReport}>Print</Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {[
          ["Total Tasks", totals.total],
          ["Completed", totals.completed],
          ["Pending", totals.pending],
          ["Overdue", totals.overdue],
        ].map(([label, val]) => (
          <Grid item xs={12} md={3} key={label}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">{label}</Typography>
                <Typography variant="h4">{val as any}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Employee workload</Typography>
              <Divider sx={{ my: 1.5 }} />
              <Stack spacing={1}>
                {byEmployee.map(e => (
                  <Box key={e.employeeId} sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography>{e.name}</Typography>
                    <Typography color="text.secondary">Total {e.total} • Done {e.done} • Overdue {e.overdue}</Typography>
                  </Box>
                ))}
                {byEmployee.length === 0 && <Typography color="text.secondary">No data for current filters.</Typography>}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Project workload</Typography>
              <Divider sx={{ my: 1.5 }} />
              <Stack spacing={1}>
                {byProject.map(p => (
                  <Box key={p.project} sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography>{p.project}</Typography>
                    <Typography color="text.secondary">Total {p.total} • Done {p.done} • Overdue {p.overdue}</Typography>
                  </Box>
                ))}
                {byProject.length === 0 && <Typography color="text.secondary">No data for current filters.</Typography>}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
