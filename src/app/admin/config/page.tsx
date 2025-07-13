
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ConfigPage() {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-headline">Configuration</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Platform Settings</CardTitle>
                    <CardDescription>Manage global settings for the application.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="commission-rate">Default Commission Rate (%)</Label>
                        <Input id="commission-rate" type="number" defaultValue="15" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="delivery-fee">Base Delivery Fee ($)</Label>
                        <Input id="delivery-fee" type="number" defaultValue="2.99" />
                    </div>
                    <Button>Save Settings</Button>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Maintenance Mode</CardTitle>
                    <CardDescription>Temporarily disable the service for maintenance.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="destructive">Enable Maintenance Mode</Button>
                </CardContent>
            </Card>
        </div>
    );
}
