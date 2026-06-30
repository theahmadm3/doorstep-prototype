import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: { main: "#005380", contrastText: "#fafafa" },
    secondary: { main: "#f5f5f5", contrastText: "#171717" },
    error: { main: "#ef4444", contrastText: "#fafafa" },
    background: { default: "#f3f3f3", paper: "#ffffff" },
    text: { primary: "#36404a" },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
    h1: { fontFamily: "Poppins, sans-serif" },
    h2: { fontFamily: "Poppins, sans-serif" },
    h3: { fontFamily: "Poppins, sans-serif" },
    h4: { fontFamily: "Poppins, sans-serif" },
    button: { textTransform: "none", fontWeight: 500 },
  },
  components: {
    MuiButtonBase: { defaultProps: { disableRipple: false } },
  },
});
