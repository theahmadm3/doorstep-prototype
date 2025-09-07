
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
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { MenuItem, MenuItemPayload } from "@/lib/types";
import { createVendorMenuItem, getVendorMenuItems, updateMenuItemAvailability, updateVendorMenuItem, deleteVendorMenuItem } from "@/lib/api";
import { Skeleton } from "../ui/skeleton";
import { format } from "date-fns";

type ItemUpdateStatus = 'idle' | 'updating' | 'success' | 'error';

export default function VendorItemManagement() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const { toast } = useToast();
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, ItemUpdateStatus>>({});
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  
  const fetchItems = async () => {
    setIsLoading(true);
    try {
        const fetchedItems = await getVendorMenuItems();
        setItems(fetchedItems);
    } catch (error) {
        toast({
            title: "Error fetching menu",
            description: "Could not retrieve your menu items. Please try again later.",
            variant: "destructive"
        });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [toast]);

  const handleSaveItem = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const payload: MenuItemPayload = {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        price: String(parseFloat(formData.get("price") as string)),
        is_available: formData.get("is_available") === 'on',
    };
    
    try {
        if (editingItem) {
            const updatedItem = await updateVendorMenuItem(editingItem.id, payload);
            setItems(items.map(item => item.id === editingItem.id ? updatedItem : item));
            toast({ title: "Item Updated", description: `${payload.name} has been successfully updated.` });
        } else {
            const newItem = await createVendorMenuItem(payload);
            setItems([newItem, ...items]); // Add new item to the top of the list
            toast({ title: "Item Added", description: `${payload.name} has been successfully added.` });
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unexpected error occurred.";
        const action = editingItem ? 'Update' : 'Add';
        toast({ title: `Failed to ${action} Item`, description: message, variant: "destructive" });
    }
    
    setDialogOpen(false);
    setEditingItem(null);
  };
  
  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    
    try {
        await deleteVendorMenuItem(itemToDelete.id);
        setItems(items.filter(item => item.id !== itemToDelete.id));
        toast({ title: "Item Deleted", description: `${itemToDelete.name} has been removed from your menu.` });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete item.";
        toast({ title: "Deletion Failed", description: message, variant: "destructive" });
    } finally {
        setItemToDelete(null);
    }
  };

  const handleToggleAvailability = async (itemId: string, available: boolean) => {
    setUpdatingStatus(prev => ({ ...prev, [itemId]: 'updating' }));
    const originalItems = [...items];
    setItems(prevItems => prevItems.map(item => item.id === itemId ? { ...item, is_available: available } : item));

    try {
        await updateMenuItemAvailability(itemId, available);
        setUpdatingStatus(prev => ({ ...prev, [itemId]: 'success' }));
        toast({
            title: "Update applied",
            description: `Item is now ${available ? "available" : "unavailable"}.`,
        });
    } catch (error) {
        setItems(originalItems);
        setUpdatingStatus(prev => ({ ...prev, [itemId]: 'error' }));
        const message = error instanceof Error ? error.message : "An unexpected error occurred.";
        toast({
            title: "Update failed",
            description: message,
            variant: "destructive",
        });
    } finally {
        setTimeout(() => {
            setUpdatingStatus(prev => ({ ...prev, [itemId]: 'idle' }));
        }, 5000);
    }
  }

  return (
    <>
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item
              <span className="font-bold"> {itemToDelete?.name}</span> from your menu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your Menu Items</CardTitle>
            <CardDescription>Add, edit, or remove items from your menu.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                  <Button onClick={() => setEditingItem(null)}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                  </Button>
              </DialogTrigger>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>{editingItem ? 'Edit Item' : 'Add a New Item'}</DialogTitle>
                      <DialogDescription>
                          Fill in the details for your menu item below.
                      </DialogDescription>
                  </DialogHeader>
                  <form id="item-form" onSubmit={handleSaveItem}>
                      <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="name" className="text-right">Name</Label>
                              <Input id="name" name="name" defaultValue={editingItem?.name} className="col-span-3" required />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="description" className="text-right">Description</Label>
                              <Textarea id="description" name="description" defaultValue={editingItem?.description || ''} className="col-span-3" required />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="price" className="text-right">Price (₦)</Label>
                              <Input id="price" name="price" type="number" step="0.01" defaultValue={editingItem?.price} className="col-span-3" required />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="is_available" className="text-right">Available</Label>
                              <Switch id="is_available" name="is_available" defaultChecked={editingItem?.is_available ?? true} />
                          </div>
                      </div>
                  </form>
                  <DialogFooter>
                      <Button type="submit" form="item-form">Save changes</Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden w-[100px] sm:table-cell">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                          <TableCell className="hidden sm:table-cell"><Skeleton className="h-16 w-16 rounded-md" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No menu items available. Please add a new item.</p>
                <DialogTrigger asChild>
                    <Button onClick={() => setEditingItem(null)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Item
                    </Button>
                </DialogTrigger>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden w-[100px] sm:table-cell">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const status = updatingStatus[item.id] || 'idle';
                  const isUpdating = status !== 'idle';

                  return (
                  <TableRow key={item.id}>
                    <TableCell className="hidden sm:table-cell">
                        <Image src={item.image_url || "https://placehold.co/64x64.png"} alt={item.name} width={64} height={64} className="rounded-md" />
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>₦{parseFloat(item.price).toFixed(2)}</TableCell>
                    <TableCell>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id={`available-${item.id}`}
                                checked={item.is_available}
                                onCheckedChange={(checked) => handleToggleAvailability(item.id, checked)}
                                disabled={isUpdating}
                            />
                            {status === 'updating' && <span className="text-xs text-muted-foreground animate-pulse">Updating...</span>}
                            {status === 'success' && <span className="text-xs text-green-600">Update applied.</span>}
                            {status === 'error' && <span className="text-xs text-red-600">Update failed.</span>}
                            {status === 'idle' && (
                                <Badge variant={item.is_available ? "default" : "outline"} className={item.is_available ? "bg-green-600" : ""}>
                                    {item.is_available ? "On" : "Off"}
                                </Badge>
                            )}
                        </div>
                    </TableCell>
                    <TableCell>{format(new Date(item.created_at), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingItem(item); setDialogOpen(true); }}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setItemToDelete(item)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
