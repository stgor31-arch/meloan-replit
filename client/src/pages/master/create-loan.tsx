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
import { AlertCircle, Loader2, Send, MessageCircleMore, Copy, Check, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { createLoan, getLenderProfile } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function MasterCreateLoan() {
  const { lenderProfileId } = useStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const t = translations;

  const { data: lenderProfile } = useQuery({
    queryKey: ["/api/lender-profile", lenderProfileId],
    queryFn: () => lenderProfileId ? getLenderProfile(lenderProfileId) : null,
    enabled: !!lenderProfileId,
  });

  const [amount, setAmount] = useState(100000);
  const [months, setMonths] = useState(12);
  const [rate, setRate] = useState(20);
  const [createdLoanId, setCreatedLoanId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm({
    defaultValues: {
        borrowerName: "",
        borrowerContact: "+7",
        startDate: new Date().toISOString().split('T')[0],
        frequency: "monthly"
    }
  });

  const mutation = useMutation({
    mutationFn: createLoan,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      setCreatedLoanId(data.id);
    },
    onError: (error: any) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate({
      lenderProfileId: lenderProfileId!,
      amount,
      termMonths: months,
      ratePercent: rate,
      ...data,
    });
  };

  const inviteLink = createdLoanId ? `${window.location.origin}/invite/${createdLoanId}` : "";
  const shareText = `Приглашение в Meloan: заём на ${amount.toLocaleString()} ₽. Перейдите по ссылке для подтверждения:`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast({ title: "Ссылка скопирована" });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const shareViaWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + inviteLink)}`, '_blank');
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
        <AnimatePresence>
          {createdLoanId && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-[80] backdrop-blur-sm"
                onClick={() => setLocation("/master/dashboard")}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white z-[90] rounded-t-[2rem] shadow-2xl p-6 space-y-5"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">Заём создан!</h3>
                  <Button variant="ghost" size="icon" onClick={() => setLocation("/master/dashboard")} data-testid="button-close-share">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Отправьте ссылку-приглашение заемщику:</p>

                <div className="bg-gray-50 rounded-xl p-3 text-xs text-muted-foreground break-all font-mono">
                  {inviteLink}
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <Button variant="outline" className="rounded-xl gap-2 h-12" onClick={handleCopyLink} data-testid="button-copy-created-link">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Скопировано" : "Скопировать ссылку"}
                  </Button>
                  <Button variant="outline" className="rounded-xl gap-2 h-12 border-blue-200 text-blue-600" onClick={shareViaTelegram} data-testid="button-share-telegram-create">
                    <Send className="h-4 w-4" />
                    Отправить через Telegram
                  </Button>
                  <Button variant="outline" className="rounded-xl gap-2 h-12 border-green-200 text-green-600" onClick={shareViaWhatsApp} data-testid="button-share-whatsapp-create">
                    <MessageCircleMore className="h-4 w-4" />
                    Отправить через WhatsApp
                  </Button>
                </div>

                <Button className="w-full h-12 rounded-xl" onClick={() => setLocation("/master/dashboard")} data-testid="button-go-dashboard">
                  Перейти к займам
                </Button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6 bg-white rounded-3xl p-2">
                <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                        <Label>{t.amount}</Label>
                        <span className="text-2xl font-bold text-primary">
                            {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount)}
                        </span>
                    </div>
                    <Slider data-testid="slider-amount" value={[amount]} onValueChange={(v) => setAmount(v[0])} min={5000} max={3000000} step={5000} className="py-2" />
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                        <Label>{t.term}</Label>
                        <span className="text-xl font-bold">{months} {t.months}</span>
                    </div>
                    <Slider data-testid="slider-term" value={[months]} onValueChange={(v) => setMonths(v[0])} min={1} max={120} step={1} className="py-2" />
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                        <Label>{t.rate}</Label>
                        <span className="text-xl font-bold">{rate}%</span>
                    </div>
                    <Slider data-testid="slider-rate" value={[rate]} onValueChange={(v) => setRate(v[0])} min={0} max={100} step={1} className="py-2" />
                </div>

                <div className="space-y-4">
                    <Label>{t.frequency}</Label>
                    <Controller
                      name="frequency"
                      control={form.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger data-testid="select-frequency" className="h-12 rounded-xl">
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
                        <Input data-testid="input-borrower-name" {...form.register("borrowerName", { required: true })} className="rounded-xl h-12" />
                    </div>
                    <div className="space-y-2">
                        <Label>{t.email_phone}</Label>
                        <Controller
                          name="borrowerContact"
                          control={form.control}
                          rules={{ required: true }}
                          render={({ field }) => (
                            <PhoneInput 
                              data-testid="input-borrower-phone"
                              value={field.value} 
                              onChange={field.onChange} 
                              className="rounded-xl h-12" 
                            />
                          )}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>{t.first_payment}</Label>
                        <Input data-testid="input-start-date" type="date" {...form.register("startDate", { required: true })} className="rounded-xl h-12" />
                    </div>
                </div>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button data-testid="button-create-loan-submit" type="submit" className="w-full h-14 text-lg rounded-2xl shadow-xl shadow-primary/20" disabled={mutation.isPending}>
                    {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {t.create_and_invite}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Создать заём и получить ссылку для заемщика</TooltipContent>
            </Tooltip>
        </form>
    </MobileLayout>
  );
}
