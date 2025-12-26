import { MobileLayout } from "@/components/layout";
import { useStore, translations } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input, PhoneInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm, Controller } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

export default function MasterProfile() {
  const { lenderProfile, setLenderProfile } = useStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const t = translations;

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
        title: "Профиль сохранен",
        description: "Ваши данные обновлены."
    });
    setLocation("/master/dashboard");
  };

  return (
    <MobileLayout title={t.profile} showBack>
        <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20 shadow-none rounded-2xl">
                <CardContent className="p-4 text-sm text-primary/80">
                    {t.lender_details_tip}
                </CardContent>
            </Card>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">ФИО полностью</Label>
                    <Input id="name" {...form.register("name", { required: true })} className="rounded-xl h-12" placeholder={t.fio_placeholder} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">{t.email_phone}</Label>
                    <Controller
                      name="phone"
                      control={form.control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <PhoneInput 
                          id="phone"
                          value={field.value} 
                          onChange={field.onChange} 
                          className="rounded-xl h-12" 
                        />
                      )}
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="passport">{t.passport}</Label>
                    <Textarea id="passport" {...form.register("passport", { required: true })} className="rounded-xl min-h-[80px]" placeholder={t.passport_placeholder} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="address">{t.address}</Label>
                    <Input id="address" {...form.register("address", { required: true })} className="rounded-xl h-12" placeholder={t.address_placeholder} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="paymentInfo">Реквизиты для оплаты</Label>
                    <Textarea id="paymentInfo" {...form.register("paymentInfo", { required: true })} className="rounded-xl min-h-[100px]" placeholder={t.requisites_placeholder} />
                    <p className="text-xs text-muted-foreground">{t.requisites_tip}</p>
                </div>

                <div className="pt-4">
                    <Button type="submit" className="w-full h-12 rounded-2xl text-lg">{t.save_profile}</Button>
                </div>
            </form>
        </div>
    </MobileLayout>
  );
}
