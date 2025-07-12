"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, Edit, Trash2, ShieldCheck, ShieldOff } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { restaurants, users } from "@/lib/data"; // Using users as mock riders
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function ConfigPage() {
    const { toast } = useToast();
    const [vendors, setVendors] = useState(restaurants);
    const [riders, setRiders] = useState(users.map(u => ({...u, vehicle: "Bike", status: "Active" })));

    const toggleVendorStatus = (id: number) => {
        // Mock action
        toast({ title: "Vendor status changed", description: "This is a mock action." });
    };

    const toggleRiderStatus = (id: number) => {
        // Mock action
        toast({ title: "Rider status changed", description: "This is a mock action." });
    };


    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-headline">Configuration</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Manage Vendors</CardTitle>
                    <CardDescription>Approve, disable, or manage restaurant partners.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vendors.map(vendor => (
                                <TableRow key={vendor.id}>
                                    <TableCell>#{vendor.id}</TableCell>
                                    <TableCell className="font-medium">{vendor.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="default" className="bg-green-600">Active</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => toggleVendorStatus(vendor.id)}>
                                                    <ShieldOff className="mr-2 h-4 w-4" /> Disable
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600">
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

            <Card>
                <CardHeader>
                    <CardTitle>Manage Riders</CardTitle>
                    <CardDescription>Onboard, verify, or manage delivery riders.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Vehicle</TableHead>
                                 <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {riders.map(rider => (
                                <TableRow key={rider.id}>
                                    <TableCell className="font-medium">{rider.name}</TableCell>
                                    <TableCell>{rider.email}</TableCell>
                                    <TableCell>{rider.vehicle}</TableCell>
                                    <TableCell>
                                        <Badge variant="default" className="bg-green-600">{rider.status}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => toggleRiderStatus(rider.id)}>
                                                    <ShieldCheck className="mr-2 h-4 w-4" /> Verify
                                                </DropdownMenuItem>
                                                 <DropdownMenuItem onClick={() => toggleRiderStatus(rider.id)}>
                                                    <ShieldOff className="mr-2 h-4 w-4" /> Suspend
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
        </div>
    );
}
