import React from "react";
import { APP_CONFIG } from "../config/appConfig";
import { useAppStore } from "../state/store";
import {
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle,
  Stack, TextField, Typography, Alert
} from "@mui/material";

type Mode = "CEO" | "EMPLOYEE";

export default function Landing() {
  const setSession = useAppStore(s => s.setSession);
  const data = useAppStore(s => s.data);
  const employees = data?.employees ?? [];
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<Mode>("CEO");
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const openDialog = (m: Mode) => {
    setMode(m);
    setCode("");
    setError(null);
    setOpen(true);
  };

  const submit = () => {
    const n = Number(code);
    if (!Number.isFinite(n)) {
      setError("Please enter a numeric access code.");
      return;
    }

    if (mode === "CEO") {
      if (n === APP_CONFIG.access.ceoCode) {
        setSession({ role: "CEO", enteredAt: new Date().toISOString() });
        return;
      }
      setError("Invalid CEO code.");
      return;
    }

    const emp = employees.find(e => e.accessCode === n);
    if (!emp) {
      setError("Invalid employee code.");
      return;
    }
    setSession({ role: "EMPLOYEE", employeeId: emp.id, enteredAt: new Date().toISOString() });
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2, background: "#F7F9FC" }}>
      <Card sx={{ width: "min(760px, 100%)", boxShadow: "0 22px 48px rgba(2,6,23,0.12)" }}>
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h5">{APP_CONFIG.org.name}</Typography>
              <Typography color="text.secondary">{APP_CONFIG.org.tagline}</Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button variant="contained" size="large" onClick={() => openDialog("CEO")}>
                Enter as CEO
              </Button>
              <Button variant="outlined" size="large" onClick={() => openDialog("EMPLOYEE")}>
                Enter as Employee
              </Button>
            </Stack>

            <Typography variant="body2" color="text.secondary">
              This is a frontend-only internal tool. Data is stored in your browser (IndexedDB) and persists after refresh.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Enter access code</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <Typography color="text.secondary">
              {mode === "CEO" ? "CEO mode has full access." : "Employee mode shows only your tasks."}
            </Typography>
            <TextField
              label="Numeric code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submit}>Enter</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
