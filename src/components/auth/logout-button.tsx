
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { logoutUser } from "@/lib/auth-api";
import { useToast } from "@/hooks/use-toast";

export default function LogoutButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      // Log the error but proceed with client-side logout
      console.error("An error occurred during API logout:", error);
       toast({
        title: "Logout Error",
        description: "Could not log you out from the server, but you have been logged out locally.",
        variant: "destructive",
      });
    } finally {
        // Always clear local storage and redirect
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        router.push("/login");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
            <LogOut className="w-5 h-5 text-muted-foreground hover:text-foreground" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to log out of your account?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
