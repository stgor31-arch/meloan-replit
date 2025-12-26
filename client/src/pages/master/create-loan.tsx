import { MobileLayout } from "@/components/layout";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function MasterCreateLoan() {
  const { createLoan, lenderProfile } = useStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [amount, setAmount] = useState(50000);
  const [months, setMonths] = useState(6);
  const [rate, setRate] = useState(20);

  const form = useForm({
    defaultValues: {
        borrowerName: "",
        borrowerContact: "",
        startDate: new Date().toISOString().split('T')[0]
    }
  });

  // Simple Annuity Calc
  const monthlyRate = rate / 12 / 100;
  const pmt = (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  const total = pmt * months;

  const onSubmit = (data: any) => {
    createLoan({
        amount,
        termMonths: months,
        ratePercent: rate,
        ...data
    });
    
    toast({
        title: "Loan Created",
        description: "Invitation link generated."
    });
    setLocation("/master/dashboard");
  };

  if (!lenderProfile) {
    return (
        <MobileLayout title="New Loan" showBack>
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4 text-center p-6">
                <AlertCircle className="h-12 w-12 text-orange-500" />
                <h3 className="text-xl font-bold">Profile Missing</h3>
                <p className="text-muted-foreground">You must fill out your lender profile (passport, requisites) before creating a loan.</p>
                <Link href="/master/profile">
                    <Button className="w-full mt-4">Go to Profile</Button>
                </Link>
            </div>
        </MobileLayout>
    )
  }

  return (
    <MobileLayout title="Create New Loan" showBack>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Calculator Section */}
            <div className="space-y-6 bg-white rounded-3xl p-2">
                <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                        <Label>Amount</Label>
                        <span className="text-2xl font-bold text-primary">
                            {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount)}
                        </span>
                    </div>
                    <Slider 
                        value={[amount]} 
                        onValueChange={(v) => setAmount(v[0])} 
                        min={5000} 
                        max={1000000} 
                        step={1000} 
                        className="py-2"
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                        <Label>Term</Label>
                        <span className="text-xl font-bold">{months} Months</span>
                    </div>
                    <Slider 
                        value={[months]} 
                        onValueChange={(v) => setMonths(v[0])} 
                        min={1} 
                        max={36} 
                        step={1} 
                        className="py-2"
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                        <Label>Rate (Yearly)</Label>
                        <span className="text-xl font-bold">{rate}%</span>
                    </div>
                    <Slider 
                        value={[rate]} 
                        onValueChange={(v) => setRate(v[0])} 
                        min={0} 
                        max={100} 
                        step={1} 
                        className="py-2"
                    />
                </div>

                <Card className="bg-muted/50 border-none shadow-none rounded-2xl">
                    <CardContent className="p-4 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Monthly Payment</p>
                            <p className="text-lg font-bold text-foreground">
                                {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(pmt)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Total Repayment</p>
                            <p className="text-lg font-bold text-foreground">
                                {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(total)}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <h3 className="font-display font-semibold text-lg">Borrower Details</h3>
                
                <div className="space-y-2">
                    <Label htmlFor="borrowerName">Contact Name</Label>
                    <Input id="borrowerName" {...form.register("borrowerName", { required: true })} className="rounded-xl h-12" placeholder="Who is borrowing?" />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="borrowerContact">Email or Phone</Label>
                    <Input id="borrowerContact" {...form.register("borrowerContact", { required: true })} className="rounded-xl h-12" placeholder="+7..." />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="startDate">First Payment Date</Label>
                    <Input type="date" id="startDate" {...form.register("startDate", { required: true })} className="rounded-xl h-12" />
                </div>
            </div>

            <Button type="submit" className="w-full h-14 text-lg rounded-2xl shadow-xl shadow-primary/20">
                Create & Send Invite
            </Button>
        </form>
    </MobileLayout>
  );
}
