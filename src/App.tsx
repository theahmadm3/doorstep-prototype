import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { RouterProvider } from "react-router-dom";
import { Providers } from "@/components/providers";
import { theme } from "@/theme";
import { router } from "@/routes";
import { Toaster } from "@/components/ui/toaster";

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme={false} />
      <Providers>
        <RouterProvider router={router} />
        <Toaster />
      </Providers>
    </ThemeProvider>
  );
}
