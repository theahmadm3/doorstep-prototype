import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

export default function VendorProfilePage() {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-headline">Your Profile</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Restaurant Information</CardTitle>
                            <CardDescription>
                                Update your restaurant's public details.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="restaurant-name">Restaurant Name</Label>
                                    <Input id="restaurant-name" defaultValue="Pizza Palace" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="restaurant-address">Address</Label>
                                    <Input id="restaurant-address" defaultValue="123 Main St, Anytown, USA" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="restaurant-description">Description</Label>
                                    <Textarea id="restaurant-description" defaultValue="The best pizza in town! We've been serving up delicious pies for over 20 years." />
                                </div>
                                <Button type="submit">Save Restaurant Info</Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Payout Settings</CardTitle>
                            <CardDescription>
                                Update your bank details for payouts. Please ensure the information is correct.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="account-holder">Account Holder Name</Label>
                                    <Input id="account-holder" defaultValue="Pizza Palace LLC" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="account-number">Account Number</Label>
                                    <Input id="account-number" defaultValue="••••••••1234" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bank-name">Bank Name</Label>
                                    <Select defaultValue="chase">
                                    <SelectTrigger id="bank-name">
                                        <SelectValue placeholder="Select a bank" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="chase">Chase Bank</SelectItem>
                                        <SelectItem value="boa">Bank of America</SelectItem>
                                        <SelectItem value="wells-fargo">Wells Fargo</SelectItem>
                                        <SelectItem value="citi">Citibank</SelectItem>
                                    </SelectContent>
                                    </Select>
                                </div>
                                <Button type="submit">Save Payout Info</Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Account Security</CardTitle>
                            <CardDescription>
                                Update your login credentials.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" defaultValue="vendor@pizzapalace.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="current-password">Current Password</Label>
                                    <Input id="current-password" type="password" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">New Password</Label>
                                    <Input id="new-password" type="password" />
                                </div>
                                <Button type="submit" className="w-full">Update Password</Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
