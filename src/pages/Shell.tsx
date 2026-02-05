import React from "react";
import { Link as RouterLink, Navigate, Route, Routes } from "react-router-dom";
import { AppBar, Box, Button, Container, Stack, Toolbar, Typography } from "@mui/material";
import { useAppStore } from "../state/store";
import { APP_CONFIG } from "../config/appConfig";
import AssignmentsCEO from "./modules/AssignmentsCEO";
import EmployeeTasks from "./modules/EmployeeTasks";
import Reports from "./modules/Reports";
import DataTools from "./modules/DataTools";

export default function Shell() {
  const session = useAppStore(s => s.session);
  const setSession = useAppStore(s => s.setSession);

  if (!session) return <Navigate to="/" />;

  const isCEO = session.role === "CEO";
  const emp = session.role === "EMPLOYEE" ? APP_CONFIG.employees.find(e => e.id === session.employeeId) : null;

  return (
    <Box sx={{ minHeight: "100vh", background: (t) => t.palette.background.default }}>
      <AppBar position="sticky" elevation={0} sx={{ borderBottom: "1px solid rgba(15,23,42,0.12)" }}>
        <Toolbar>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ width: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 950 }}>
              {APP_CONFIG.org.name}
            </Typography>

            <Stack direction="row" spacing={1}>
              {isCEO && <Button component={RouterLink} to="/app/assignments" color="inherit">Assignments</Button>}
              <Button component={RouterLink} to="/app/my-tasks" color="inherit">{isCEO ? "Employee View" : "My Tasks"}</Button>
              <Button component={RouterLink} to="/app/reports" color="inherit">Reports</Button>
              {isCEO && <Button component={RouterLink} to="/app/data" color="inherit">Data</Button>}
            </Stack>

            <Box sx={{ flex: 1 }} />

            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {isCEO ? "CEO Mode" : `${emp?.name ?? "Employee"} • ${emp?.employeeId ?? ""}`}
            </Typography>

            <Button variant="outlined" color="inherit" onClick={() => setSession(null)}>Exit</Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/app/my-tasks" />} />
          <Route path="/assignments" element={isCEO ? <AssignmentsCEO /> : <Navigate to="/app/my-tasks" />} />
          <Route path="/my-tasks" element={<EmployeeTasks />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/data" element={isCEO ? <DataTools /> : <Navigate to="/app/my-tasks" />} />
          <Route path="*" element={<Navigate to="/app/my-tasks" />} />
        </Routes>
      </Container>
    </Box>
  );
}
