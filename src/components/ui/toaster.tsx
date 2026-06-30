import { useToast } from "@/hooks/use-toast";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

export function Toaster() {
  const { toasts, dismiss } = useToast();
  return (
    <>
      {toasts.map(({ id, title, description, variant, open, action }) => (
        <Snackbar
          key={id}
          open={open}
          autoHideDuration={5000}
          onClose={(_, reason) => { if (reason !== "clickaway") dismiss(id); }}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            severity={variant === "destructive" ? "error" : "success"}
            variant="filled"
            onClose={() => dismiss(id)}
            action={action as any}
            sx={{ width: "100%" }}
          >
            {title ? <div style={{ fontWeight: 600 }}>{title}</div> : null}
            {description ? <div>{description}</div> : null}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
}
