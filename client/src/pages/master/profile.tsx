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
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { createLenderProfile, updateLenderProfile, getLenderProfile } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function MasterProfile() {
  const { lenderProfileId, setLenderProfileId } = useStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const t = translations;

  const { data: lenderProfile, isLoading } = useQuery({
    queryKey: ["/api/lender-profile", lenderProfileId],
    queryFn: () => lenderProfileId ? getLenderProfile(lenderProfileId) : null,
    enabled: !!lenderProfileId,
  });

  const form = useForm({
    defaultValues: {
      name: "",
      passport: "",
      address: "",
      paymentInfo: "",
      phone: "+7"
    },
    values: lenderProfile ? {
      name: lenderProfile.name || "",
      passport: lenderProfile.passport || "",
      address: lenderProfile.address || "",
      paymentInfo: lenderProfile.paymentInfo || "",
      phone: lenderProfile.phone || "+7",
    } : undefined,
  });

  const createMutation = useMutation({
    mutationFn: createLenderProfile,
    onSuccess: (data) => {
      setLenderProfileId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/lender-profile"] });
      toast({ title: "Профиль сохранен", description: "Ваши данные обновлены." });
      setLocation("/master/dashboard");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateLenderProfile(lenderProfileId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lender-profile"] });
      toast({ title: "Профиль сохранен", description: "Ваши данные обновлены." });
      setLocation("/master/dashboard");
    },
  });

  const onSubmit = (data: any) => {
    if (lenderProfileId) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <MobileLayout title={t.profile} showBack>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

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
                    <Input data-testid="input-name" id="name" {...form.register("name", { required: true })} className="rounded-xl h-12" placeholder={t.fio_placeholder} />
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
                          data-testid="input-phone"
                          value={field.value} 
                          onChange={field.onChange} 
                          className="rounded-xl h-12" 
                        />
                      )}
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="passport">{t.passport}</Label>
                    <Textarea data-testid="input-passport" id="passport" {...form.register("passport", { required: true })} className="rounded-xl min-h-[80px]" placeholder={t.passport_placeholder} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="address">{t.address}</Label>
                    <Input data-testid="input-address" id="address" {...form.register("address", { required: true })} className="rounded-xl h-12" placeholder={t.address_placeholder} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="paymentInfo">Реквизиты для оплаты</Label>
                    <Textarea data-testid="input-payment-info" id="paymentInfo" {...form.register("paymentInfo", { required: true })} className="rounded-xl min-h-[100px]" placeholder={t.requisites_placeholder} />
                    <p className="text-xs text-muted-foreground">{t.requisites_tip}</p>
                </div>

                <div className="pt-4">
                    <Button data-testid="button-save-profile" type="submit" className="w-full h-12 rounded-2xl text-lg" disabled={createMutation.isPending || updateMutation.isPending}>
                      {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      {t.save_profile}
                    </Button>
                </div>
            </form>
        </div>
    </MobileLayout>
  );
}
