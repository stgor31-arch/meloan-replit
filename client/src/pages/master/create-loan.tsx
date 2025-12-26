import { MobileLayout } from "@/components/layout";
import { useStore, translations } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input, PhoneInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function MasterCreateLoan() {
  const { createLoan, lenderProfile } = useStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const t = translations;

  const [amount, setAmount] = useState(100000);
  const [months, setMonths] = useState(12);
  const [rate, setRate] = useState(20);

  const form = useForm({
    defaultValues: {
        borrowerName: "",
        borrowerContact: "+7",
        startDate: new Date().toISOString().split('T')[0],
        frequency: "monthly"
    }
  });

  const onSubmit = (data: any) => {
    // Ensure we store digits for easier searching later, but keep the display format if needed
    // However, the store expects borrowerContact. Let's make sure it's saved.
    createLoan({
        amount,
        termMonths: months,
        ratePercent: rate,
        ...data
    });
    
    toast({
        title: "Заём создан",
        description: "Ссылка-приглашение готова."
    });
    setLocation("/master/dashboard");
  };

  if (!lenderProfile) {
    return (
        <MobileLayout title={t.new_loan} showBack>
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4 text-center p-6">
                <AlertCircle className="h-12 w-12 text-orange-500" />
                <h3 className="text-xl font-bold">{t.profile_missing}</h3>
                <p className="text-muted-foreground">{t.fill_profile_first}</p>
                <Link href="/master/profile">
                    <Button className="w-full mt-4">{t.go_to_profile}</Button>
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
                            {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount)}
                        </span>
                    </div>
                    <Slider value={[amount]} onValueChange={(v) => setAmount(v[0])} min={5000} max={3000000} step={5000} className="py-2" />
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                        <Label>{t.term}</Label>
                        <span className="text-xl font-bold">{months} {t.months}</span>
                    </div>
                    <Slider value={[months]} onValueChange={(v) => setMonths(v[0])} min={1} max={120} step={1} className="py-2" />
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                        <Label>{t.rate}</Label>
                        <span className="text-xl font-bold">{rate}%</span>
                    </div>
                    <Slider value={[rate]} onValueChange={(v) => setRate(v[0])} min={0} max={100} step={1} className="py-2" />
                </div>

                <div className="space-y-4">
                    <Label>{t.frequency}</Label>
                    <Controller
                      name="frequency"
                      control={form.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger className="h-12 rounded-xl">
                                <SelectValue placeholder="Выберите периодичность" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="once">{t.freq_once}</SelectItem>
                                <SelectItem value="monthly">{t.freq_monthly}</SelectItem>
                                <SelectItem value="weekly">{t.freq_weekly}</SelectItem>
                                <SelectItem value="daily">{t.freq_daily}</SelectItem>
                            </SelectContent>
                        </Select>
                      )}
                    />
                </div>
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
                        <Controller
                          name="borrowerContact"
                          control={form.control}
                          rules={{ required: true }}
                          render={({ field }) => (
                            <PhoneInput 
                              value={field.value} 
                              onChange={field.onChange} 
                              className="rounded-xl h-12" 
                            />
                          )}
                        />
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
