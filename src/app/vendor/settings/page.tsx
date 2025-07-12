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
} from "@/components/ui/select"

export default function VendorSettingsPage() {
    return (
        <div className="container py-12">
            <h1 className="text-3xl font-bold font-headline mb-8 text-center">Settings</h1>
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Bank Details</CardTitle>
                        <CardDescription>
                            Update your bank details for payouts. Please ensure the information is correct.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-6">
                             <div className="space-y-2">
                                <Label htmlFor="account-holder">Account Holder Name</Label>
                                <Input id="account-holder" placeholder="John Doe" defaultValue="Pizza Palace LLC" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="account-number">Account Number</Label>
                                <Input id="account-number" placeholder="1234567890" defaultValue="1098765432" />
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
                            <Button type="submit" className="w-full">Save Changes</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
