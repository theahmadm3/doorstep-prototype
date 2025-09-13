
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
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingRider, setEditingRider] = useState<Rider | null>(null);
  const { toast } = useToast();
  const [riderToDelete, setRiderToDelete] = useState<Rider | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const fetchRiders = async () => {
    setIsLoading(true);
    try {
        const fetchedRiders = await getVendorRiders();
        setRiders(fetchedRiders);
    } catch (error) {
        toast({
            title: "Error fetching riders",
            description: "Could not retrieve your riders. Please try again later.",
            variant: "destructive"
        });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveRider = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    const formData = new FormData(event.currentTarget);
    
    const payload: RiderPayload = {
        full_name: formData.get("full_name") as string,
        phone_number: formData.get("phone_number") as string,
        status: formData.get("status") as 'Active' | 'Inactive',
    };
    
    try {
        if (editingRider) {
            const updatedRider = await updateVendorRider(editingRider.id, payload);
            setRiders(riders.map(rider => rider.id === editingRider.id ? updatedRider : rider));
            toast({ title: "Rider Updated", description: `${payload.full_name} has been successfully updated.` });
        } else {
            const newRider = await createVendorRider(payload);
            setRiders([newRider, ...riders]);
            toast({ title: "Rider Added", description: `${payload.full_name} has been successfully added.` });
        }
        setDialogOpen(false);
        setEditingRider(null);
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unexpected error occurred.";
        const action = editingRider ? 'Update' : 'Add';
        toast({ title: `Failed to ${action} Rider`, description: message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleDeleteRider = async () => {
    if (!riderToDelete) return;
    
    try {
        await deleteVendorRider(riderToDelete.id);
        setRiders(riders.filter(rider => rider.id !== riderToDelete.id));
        toast({ title: "Rider Deleted", description: `${riderToDelete.full_name} has been removed.` });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete rider.";
        toast({ title: "Deletion Failed", description: message, variant: "destructive" });
    } finally {
        setRiderToDelete(null);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
      <AlertDialog open={!!riderToDelete} onOpenChange={(open) => !open && setRiderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the rider
              <span className="font-bold"> {riderToDelete?.full_name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRider}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your Riders</CardTitle>
            <CardDescription>Add, edit, or remove riders from your team.</CardDescription>
          </div>
          <DialogTrigger asChild>
              <Button onClick={() => setEditingRider(null)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Rider
              </Button>
          </DialogTrigger>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
          ) : riders.length === 0 ? (
            <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">You haven't added any riders yet.</p>
                <DialogTrigger asChild>
                    <Button onClick={() => setEditingRider(null)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Rider
                    </Button>
                </DialogTrigger>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {riders.map((rider) => (
                  <TableRow key={rider.id}>
                    <TableCell className="font-medium">{rider.full_name}</TableCell>
                    <TableCell>{rider.phone_number}</TableCell>
                    <TableCell>
                        <Badge variant={rider.status === 'Active' ? "default" : "outline"} className={rider.status === 'Active' ? "bg-green-600" : ""}>
                            {rider.status}
                        </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(rider.created_at), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingRider(rider); setDialogOpen(true); }}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setRiderToDelete(rider)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DialogContent>
          <DialogHeader>
              <DialogTitle>{editingRider ? 'Edit Rider' : 'Add a New Rider'}</DialogTitle>
              <DialogDescription>
                  Fill in the details for the rider below.
              </DialogDescription>
          </DialogHeader>
          <form id="rider-form" onSubmit={handleSaveRider}>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="full_name" className="text-right">Full Name</Label>
                      <Input id="full_name" name="full_name" defaultValue={editingRider?.full_name} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="phone_number" className="text-right">Phone</Label>
                      <Input id="phone_number" name="phone_number" defaultValue={editingRider?.phone_number || ''} className="col-span-3" required />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">Status</Label>
                        <Select name="status" defaultValue={editingRider?.status || 'Active'}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                   </div>
              </div>
          </form>
          <DialogFooter>
              <Button type="submit" form="rider-form" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save changes"}
              </Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
