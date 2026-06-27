import { useRouteError, isRouteErrorResponse, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();

  const message = isRouteErrorResponse(error)
    ? `${error.status} — ${error.statusText}`
    : error instanceof Error
    ? error.message
    : "An unexpected error occurred.";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
      <AlertTriangle className="w-10 h-10 text-destructive" />
      <div>
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground mt-1">{message}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => navigate(-1)}>Go back</Button>
        <Button onClick={() => window.location.reload()}>Reload</Button>
      </div>
    </div>
  );
}
