
"use client";

import { useState } from "react";
import { foodItems } from "@/lib/data";
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

type FoodItem = (typeof foodItems)[0];

export default function VendorItemManagement() {
  const [items, setItems] = useState<FoodItem[]>(foodItems.filter(item => item.restaurant === '1')); // Mock: for restaurant 1
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const { toast } = useToast();
  
  const handleSaveItem = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newItem: FoodItem = {
        id: editingItem ? editingItem.id : String(Math.max(...items.map(i => Number(i.id)), 0) + 1),
        restaurant: '1',
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        price: String(parseFloat(formData.get("price") as string)),
        image_url: "https://placehold.co/300x200.png", // Placeholder
        is_available: formData.get("is_available") === 'on',
        category: "uncategorized",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        quantity: parseInt(formData.get("quantity") as string, 10),
    };

    if (editingItem) {
        setItems(items.map(item => item.id === newItem.id ? newItem : item));
        toast({ title: "Item Updated", description: `${newItem.name} has been successfully updated.` });
    } else {
        setItems([...items, newItem]);
        toast({ title: "Item Added", description: `${newItem.name} has been successfully added.` });
    }
    
    setDialogOpen(false);
    setEditingItem(null);
  };
  
  const handleDeleteItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
    toast({ title: "Item Deleted", description: "The item has been removed from your menu.", variant: "destructive" });
  };

  const handleToggleAvailability = (itemId: string, available: boolean) => {
    setItems(items.map(item => item.id === itemId ? { ...item, is_available: available } : item));
     toast({
        title: "Availability Updated",
        description: `The item is now ${available ? 'available' : 'unavailable'}.`
    });
  }

  return (
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
                            <Label htmlFor="quantity" className="text-right">Quantity</Label>
                            <Input id="quantity" name="quantity" type="number" step="1" defaultValue={editingItem?.quantity} className="col-span-3" required />
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-[100px] sm:table-cell">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="hidden sm:table-cell">
                    <Image src={item.image_url || "https://placehold.co/64x64.png"} alt={item.name} width={64} height={64} className="rounded-md" />
                </TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>₦{parseFloat(item.price).toFixed(2)}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id={`available-${item.id}`}
                            checked={item.is_available}
                            onCheckedChange={(checked) => handleToggleAvailability(item.id, checked)}
                        />
                         <Badge variant={item.is_available ? "default" : "outline"} className={item.is_available ? "bg-green-600" : ""}>
                            {item.is_available ? "On" : "Off"}
                        </Badge>
                    </div>
                </TableCell>
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
                      <DropdownMenuItem onClick={() => handleDeleteItem(item.id)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
