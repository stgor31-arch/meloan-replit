import { MobileLayout } from "@/components/layout";
import { useStore, translations, Loan } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input, PhoneInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

export default function MasterProfile() {
  const { lenderProfile, setLenderProfile, language } = useStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const t = translations[language];

  const form = useForm({
    defaultValues: lenderProfile || {
        name: "",
        passport: "",
        address: "",
        paymentInfo: "",
        phone: "+7"
    }
  });

  const onSubmit = (data: any) => {
    setLenderProfile(data);
    toast({
        title: "Profile Saved",
        description: "Your lender details have been updated."
    });
    setLocation("/master/dashboard");
  };

  return (
    <MobileLayout title={t.profile} showBack>
        <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20 shadow-none rounded-2xl">
                <CardContent className="p-4 text-sm text-primary/80">
                    These details will be used to automatically generate loan agreements (receipts) for your borrowers.
                </CardContent>
            </Card>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name (FIO)</Label>
                    <Input id="name" {...form.register("name", { required: true })} className="rounded-xl h-12" placeholder="Ivanov Ivan Ivanovich" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">{t.email_phone}</Label>
                    <PhoneInput id="phone" {...form.register("phone", { required: true })} className="rounded-xl h-12" />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="passport">Passport Details</Label>
                    <Textarea id="passport" {...form.register("passport", { required: true })} className="rounded-xl min-h-[80px]" placeholder="Series, Number, Issued by..." />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="address">Registration Address</Label>
                    <Input id="address" {...form.register("address", { required: true })} className="rounded-xl h-12" placeholder="City, Street, Apt..." />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="paymentInfo">Payment Requisites</Label>
                    <Textarea id="paymentInfo" {...form.register("paymentInfo", { required: true })} className="rounded-xl min-h-[100px]" placeholder="Bank Name, Account Number, Phone for SBP..." />
                    <p className="text-xs text-muted-foreground">Borrowers will see this when making payments.</p>
                </div>

                <div className="pt-4">
                    <Button type="submit" className="w-full h-12 rounded-2xl text-lg">Save Profile</Button>
                </div>
            </form>
        </div>
    </MobileLayout>
  );
}
