import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">404 — Page not found</h1>
      <Link to="/" className="text-primary underline">Go home</Link>
    </div>
  );
}
