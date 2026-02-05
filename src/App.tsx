import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useAppStore } from "./state/store";
import Landing from "./pages/Landing";
import Shell from "./pages/Shell";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { error };
  }
  componentDidCatch(error: any) {
    console.error("App crashed:", error);
  }
  render() {
    if (this.state.error) {
      return (
        <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2 }}>
          <Stack spacing={2} sx={{ width: "min(720px, 100%)" }}>
            <Typography variant="h5">Something went wrong</Typography>
            <Alert severity="error">
              The app encountered a runtime error. Open the browser console for details.
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Common fix: run <b>npm install</b> again. This project requires MUI peer deps:
              <b> @emotion/react</b> and <b>@emotion/styled</b>.
            </Typography>
          </Stack>
        </Box>
      );
    }
    return this.props.children as any;
  }
}

export default function App() {
  const init = useAppStore((s) => s.init);
  const hydrated = useAppStore((s) => s.hydrated);
  const session = useAppStore((s) => s.session);

  React.useEffect(() => {
    init();
  }, [init]);

  if (!hydrated) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <Stack spacing={1} alignItems="center">
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">Loading…</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={session ? <Navigate to="/app" /> : <Landing />} />
        <Route path="/app/*" element={session ? <Shell /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </ErrorBoundary>
  );
}
