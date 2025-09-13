
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Rider, RiderPayload } from "@/lib/types";
import { createVendorRider, getVendorRiders, updateVendorRider, deleteVendorRider } from "@/lib/api";
import { Skeleton } from "../ui/skeleton";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function VendorRiderManagement() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Changed to false
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingRider, setEditingRider] = useState<Rider | null>(null);
  const { toast } = useToast();
  const [riderToDelete, setRiderToDelete] = useState<Rider | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // const fetchRiders = async () => {
  //   setIsLoading(true);
  //   try {
  //       const fetchedRiders = await getVendorRiders();
  //       setRiders(fetchedRiders);
  //   } catch (error) {
  //       toast({
  //           title: "Error fetching riders",
  //           description: "Could not retrieve your riders. Please try again later.",
  //           variant: "destructive"
  //       });
  //   } finally {
  //       setIsLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   fetchRiders();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  const handleSaveRider = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast({ title: "Coming Soon!", description: "Rider management will be enabled once the API is ready." });
    return;
  };
  
  const handleDeleteRider = async () => {
    toast({ title: "Coming Soon!", description: "Rider management will be enabled once the API is ready." });
    return;
  };

  return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your Riders</CardTitle>
            <CardDescription>Add, edit, or remove riders from your team.</CardDescription>
          </div>
           <Button disabled>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Rider
            </Button>
        </CardHeader>
        <CardContent>
             <div className="text-center py-12">
                <p className="text-muted-foreground">Rider management will be available soon.</p>
            </div>
        </CardContent>
      </Card>
  );
}
