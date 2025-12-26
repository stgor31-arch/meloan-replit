import { MobileLayout } from "@/components/layout";
import { useStore, translations, Loan } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Copy, Check } from "lucide-react";

export default function MasterCreateLoan() {
  const { createLoan, lenderProfile, language, loans } = useStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const t = translations[language];

  const [amount, setAmount] = useState(100000);
  const [months, setMonths] = useState(12);
  const [rate, setRate] = useState(20);
  const [copied, setCopied] = useState(false);

  const form = useForm({
    defaultValues: {
        borrowerName: "",
        borrowerContact: "",
        startDate: new Date().toISOString().split('T')[0]
    }
  });

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
        description: "Invitation generated."
    });
    // In actual app, we'd wait for the ID, but for mockup we show dashboard
    setLocation("/master/dashboard");
  };

  if (!lenderProfile) {
    return (
        <MobileLayout title={t.new_loan} showBack>
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4 text-center p-6">
                <AlertCircle className="h-12 w-12 text-orange-500" />
                <h3 className="text-xl font-bold">Profile Missing</h3>
                <p className="text-muted-foreground">You must fill out your lender profile first.</p>
                <Link href="/master/profile">
                    <Button className="w-full mt-4">Go to Profile</Button>
                </Link>
            </div>
        </MobileLayout>
    )
  }

  return (
    <MobileLayout title={t.new_loan} showBack>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <div className="space-y-6 bg-white rounded-3xl p-2">
                <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                        <Label>{t.amount}</Label>
                        <span className="text-2xl font-bold text-primary">
                            {new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount)}
                        </span>
                    </div>
                    <Slider 
                        value={[amount]} 
                        onValueChange={(v) => setAmount(v[0])} 
                        min={5000} 
                        max={3000000} 
                        step={5000} 
                        className="py-2"
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                        <Label>{t.term}</Label>
                        <span className="text-xl font-bold">{months} {t.months}</span>
                    </div>
                    <Slider 
                        value={[months]} 
                        onValueChange={(v) => setMonths(v[0])} 
                        min={1} 
                        max={112} 
                        step={1} 
                        className="py-2"
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                        <Label>{t.rate}</Label>
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
                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">{t.monthly_payment}</p>
                            <p className="text-lg font-bold">
                                {Math.round(pmt).toLocaleString()} ₽
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">{t.total_repayment}</p>
                            <p className="text-lg font-bold">
                                {Math.round(total).toLocaleString()} ₽
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <h3 className="font-display font-semibold text-lg">{t.borrower_details}</h3>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>{t.contact_name}</Label>
                        <Input {...form.register("borrowerName", { required: true })} className="rounded-xl h-12" />
                    </div>
                    <div className="space-y-2">
                        <Label>{t.email_phone}</Label>
                        <Input {...form.register("borrowerContact", { required: true })} className="rounded-xl h-12" />
                    </div>
                    <div className="space-y-2">
                        <Label>{t.first_payment}</Label>
                        <Input type="date" {...form.register("startDate", { required: true })} className="rounded-xl h-12" />
                    </div>
                </div>
            </div>

            <Button type="submit" className="w-full h-14 text-lg rounded-2xl shadow-xl shadow-primary/20">
                {t.create_and_invite}
            </Button>
        </form>
    </MobileLayout>
  );
}
