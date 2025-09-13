
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
import { PlusCircle, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Rider, RiderPayload, riderSchema } from "@/lib/types";
import { createVendorRider, getVendorRiders, updateVendorRider, deleteVendorRider } from "@/lib/api";
import { Skeleton } from "../ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function VendorRiderManagement() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingRider, setEditingRider] = useState<Rider | null>(null);
  const { toast } = useToast();
  const [riderToDelete, setRiderToDelete] = useState<Rider | null>(null);
  
  const form = useForm<RiderPayload>({
    resolver: zodResolver(riderSchema),
    mode: "onChange",
  });
  
  const { formState: { isSubmitting } } = form;

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
  
  const handleOpenDialog = (rider: Rider | null) => {
    setEditingRider(rider);
    form.reset(rider ? { name: rider.name, phone: rider.phone } : { name: "", phone: "" });
    setDialogOpen(true);
  }

  const handleSaveRider = async (data: RiderPayload) => {
    try {
      if (editingRider) {
        await updateVendorRider(data);
        toast({ title: "Rider Updated", description: `The phone number for ${data.name} has been updated.` });
      } else {
        await createVendorRider(data);
        toast({ title: "Rider Added", description: `${data.name} has been successfully added.` });
      }
      setDialogOpen(false);
      setEditingRider(null);
      await fetchRiders(); // Refetch to get the latest list
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({ title: "Save Failed", description: message, variant: "destructive" });
    }
  };
  
  const handleDeleteRider = async () => {
    if (!riderToDelete) return;
    try {
      await deleteVendorRider(riderToDelete.name);
      toast({ title: "Rider Deleted", description: `${riderToDelete.name} has been removed.` });
      await fetchRiders();
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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the rider <strong>{riderToDelete?.name}</strong>. This cannot be undone.
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
              <Button onClick={() => handleOpenDialog(null)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Rider
              </Button>
          </DialogTrigger>
        </CardHeader>
        <CardContent>
             {isLoading ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Phone Number</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...Array(3)].map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
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
                        <Button onClick={() => handleOpenDialog(null)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Rider
                        </Button>
                    </DialogTrigger>
                </div>
             ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Phone Number</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {riders.map((rider) => (
                            <TableRow key={rider.name}>
                                <TableCell className="font-medium">{rider.name}</TableCell>
                                <TableCell>{rider.phone}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleOpenDialog(rider)}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit Phone
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
            {editingRider ? 'Update the phone number for this rider.' : 'Fill in the details for your new rider.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="rider-form" onSubmit={form.handleSubmit(handleSaveRider)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} disabled={!!editingRider} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="08012345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button type="submit" form="rider-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
