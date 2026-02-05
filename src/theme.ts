import { createTheme } from "@mui/material/styles";
import type {} from "@mui/x-data-grid/themeAugmentation";


export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1E3A8A" },
    secondary: { main: "#0F766E" },
    background: { default: "#F7F9FC", paper: "#FFFFFF" },
    divider: "rgba(15, 23, 42, 0.12)",
  },
  typography: {
    fontFamily: ["Inter", "system-ui", "Segoe UI", "Roboto", "Arial", "sans-serif"].join(","),
    h5: { fontWeight: 800 },
    h6: { fontWeight: 900 },
    button: { textTransform: "none", fontWeight: 700 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiDataGrid: {
      styleOverrides: {
        root: { border: "1px solid rgba(15,23,42,0.12)", backgroundColor: "#fff" },
        columnHeaders: { fontWeight: 900 },
      },
    },
  },
});
