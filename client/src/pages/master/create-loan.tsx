import { MobileLayout } from "@/components/layout";
import { translations } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input, PhoneInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { Slider } from "@/components/ui/slider";
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2, Send, MessageCircleMore, Copy, Check, X, Calculator } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { createLoan, getMyProfile } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { calcPayment, calcTerm, calcTotalRepayment } from "@/lib/loanCalculator";

type CalcMode = "byTerm" | "byPayment";

export default function MasterCreateLoan() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const t = translations;
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/api/login";
    }
  }, [authLoading, isAuthenticated]);

  const { data: lenderProfile } = useQuery({
    queryKey: ["/api/my-profile"],
    queryFn: getMyProfile,
    enabled: isAuthenticated,
  });

  const [amount, setAmount] = useState(100000);
  const [amountInput, setAmountInput] = useState("100 000");
  const [rate, setRate] = useState(20);
  const [rateInput, setRateInput] = useState("20");
  const [frequency, setFrequency] = useState("monthly");
  const [calcMode, setCalcMode] = useState<CalcMode>("byTerm");
  const [months, setMonths] = useState(12);
  const [monthsInput, setMonthsInput] = useState("12");
  const [payment, setPayment] = useState(0);
  const [paymentInput, setPaymentInput] = useState("");
  const [createdLoanId, setCreatedLoanId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm({
    defaultValues: {
        borrowerName: "",
        borrowerContact: "+7",
        startDate: new Date().toISOString().split('T')[0],
    }
  });

  useEffect(() => {
    if (calcMode === "byTerm") {
      const pmt = calcPayment(amount, rate, months, frequency);
      setPayment(pmt);
      setPaymentInput(pmt > 0 ? pmt.toLocaleString("ru-RU") : "");
    }
  }, [amount, rate, months, frequency, calcMode]);

  useEffect(() => {
    if (calcMode === "byPayment" && payment > 0) {
      const term = calcTerm(amount, rate, payment, frequency);
      setMonths(term);
      setMonthsInput(term > 0 ? String(term) : "0");
    }
  }, [amount, rate, payment, frequency, calcMode]);

  const summary = useMemo(() => {
    const pmt = calcMode === "byTerm"
      ? calcPayment(amount, rate, months, frequency)
      : payment;
    const totalRepayment = calcMode === "byTerm"
      ? calcTotalRepayment(amount, rate, months, frequency)
      : (() => {
          if (frequency === "once") return pmt;
          if (months <= 0) return 0;
          const periods = frequency === "weekly" ? months * 4 : frequency === "daily" ? months * 30 : months;
          return pmt * periods;
        })();
    const overpayment = totalRepayment - amount;
    return { pmt, totalRepayment, overpayment };
  }, [amount, rate, months, frequency, payment, calcMode]);

  const formatAmount = (val: number) => val.toLocaleString("ru-RU");

  const handleAmountInput = (raw: string) => {
    setAmountInput(raw);
    const num = parseInt(raw.replace(/\D/g, ""), 10);
    if (!isNaN(num) && num >= 0) {
      const clamped = Math.min(num, 100000000);
      setAmount(clamped);
    }
  };

  const handleAmountBlur = () => {
    setAmountInput(formatAmount(amount));
  };

  const handleAmountSlider = (val: number) => {
    setAmount(val);
    setAmountInput(formatAmount(val));
  };

  const handleRateInput = (raw: string) => {
    setRateInput(raw);
    const num = parseFloat(raw.replace(",", "."));
    if (!isNaN(num) && num >= 0) {
      setRate(Math.min(num, 999));
    }
  };

  const handleRateBlur = () => {
    setRateInput(String(rate));
  };

  const handleRateSlider = (val: number) => {
    setRate(val);
    setRateInput(String(val));
  };

  const handleMonthsInput = (raw: string) => {
    setMonthsInput(raw);
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num > 0) {
      setMonths(Math.min(num, 600));
    }
  };

  const handleMonthsBlur = () => {
    setMonthsInput(String(months));
  };

  const handleMonthsSlider = (val: number) => {
    setMonths(val);
    setMonthsInput(String(val));
  };

  const handlePaymentInput = (raw: string) => {
    setPaymentInput(raw);
    const num = parseInt(raw.replace(/\D/g, ""), 10);
    if (!isNaN(num) && num > 0) {
      setPayment(num);
    }
  };

  const handlePaymentBlur = () => {
    if (payment > 0) {
      setPaymentInput(payment.toLocaleString("ru-RU"));
    }
  };

  const handleCalcModeChange = (mode: CalcMode) => {
    setCalcMode(mode);
    if (mode === "byPayment") {
      const pmt = calcPayment(amount, rate, months, frequency);
      setPayment(pmt);
      setPaymentInput(pmt > 0 ? pmt.toLocaleString("ru-RU") : "");
    }
  };

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
      lenderProfileId: lenderProfile!.id,
      amount,
      termMonths: months,
      ratePercent: rate,
      frequency,
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

  const termWarning = calcMode === "byPayment" && (months <= 0 || months > 600);
  const isValid = amount > 0 && months > 0 && months <= 600 && summary.pmt > 0 && !termWarning;

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

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-5 bg-white rounded-3xl p-4">
                <div className="space-y-3">
                    <Label className="text-sm font-semibold">{t.amount}</Label>
                    <div className="relative">
                        <Input
                            data-testid="input-amount"
                            value={amountInput}
                            onChange={(e) => handleAmountInput(e.target.value)}
                            onBlur={handleAmountBlur}
                            onFocus={() => setAmountInput(String(amount))}
                            className="rounded-xl h-14 text-2xl font-bold text-primary pr-8 text-right"
                            inputMode="numeric"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground font-medium">₽</span>
                    </div>
                    <Slider
                        data-testid="slider-amount"
                        value={[amount]}
                        onValueChange={(v) => handleAmountSlider(v[0])}
                        min={5000}
                        max={3000000}
                        step={5000}
                        className="py-1"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>5 000 ₽</span>
                        <span>3 000 000 ₽</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-sm font-semibold">{t.rate}</Label>
                    <div className="relative">
                        <Input
                            data-testid="input-rate"
                            value={rateInput}
                            onChange={(e) => handleRateInput(e.target.value)}
                            onBlur={handleRateBlur}
                            onFocus={() => setRateInput(String(rate))}
                            className="rounded-xl h-12 text-xl font-bold pr-8 text-right"
                            inputMode="decimal"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground font-medium">%</span>
                    </div>
                    <Slider
                        data-testid="slider-rate"
                        value={[rate]}
                        onValueChange={(v) => handleRateSlider(v[0])}
                        min={0}
                        max={100}
                        step={1}
                        className="py-1"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>0%</span>
                        <span>100%</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-sm font-semibold">{t.frequency}</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
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
                </div>
            </div>

            {frequency !== "once" && (
              <div className="space-y-4 bg-white rounded-3xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                      <Calculator className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold">Рассчитать</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                      <button
                          type="button"
                          onClick={() => handleCalcModeChange("byTerm")}
                          className={cn(
                              "py-3 px-4 rounded-xl text-sm font-semibold transition-all",
                              calcMode === "byTerm"
                                  ? "bg-primary text-white shadow-md"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          )}
                          data-testid="button-calc-by-term"
                      >
                          По сроку
                      </button>
                      <button
                          type="button"
                          onClick={() => handleCalcModeChange("byPayment")}
                          className={cn(
                              "py-3 px-4 rounded-xl text-sm font-semibold transition-all",
                              calcMode === "byPayment"
                                  ? "bg-primary text-white shadow-md"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          )}
                          data-testid="button-calc-by-payment"
                      >
                          По платежу
                      </button>
                  </div>

                  <AnimatePresence mode="wait">
                      {calcMode === "byTerm" ? (
                          <motion.div
                              key="byTerm"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="space-y-3"
                          >
                              <Label className="text-sm font-semibold">{t.term}</Label>
                              <div className="relative">
                                  <Input
                                      data-testid="input-term"
                                      value={monthsInput}
                                      onChange={(e) => handleMonthsInput(e.target.value)}
                                      onBlur={handleMonthsBlur}
                                      onFocus={() => setMonthsInput(String(months))}
                                      className="rounded-xl h-12 text-xl font-bold pr-16 text-right"
                                      inputMode="numeric"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{t.months}</span>
                              </div>
                              <Slider
                                  data-testid="slider-term"
                                  value={[months]}
                                  onValueChange={(v) => handleMonthsSlider(v[0])}
                                  min={1}
                                  max={120}
                                  step={1}
                                  className="py-1"
                              />
                              <div className="flex justify-between text-[10px] text-muted-foreground">
                                  <span>1 мес.</span>
                                  <span>120 мес.</span>
                              </div>

                              <div className="bg-primary/5 rounded-xl p-3 flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">Размер платежа</span>
                                  <span className="text-lg font-bold text-primary" data-testid="text-calculated-payment">
                                      {summary.pmt > 0 ? `${summary.pmt.toLocaleString("ru-RU")} ₽` : "—"}
                                  </span>
                              </div>
                          </motion.div>
                      ) : (
                          <motion.div
                              key="byPayment"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="space-y-3"
                          >
                              <Label className="text-sm font-semibold">Размер платежа</Label>
                              <div className="relative">
                                  <Input
                                      data-testid="input-payment"
                                      value={paymentInput}
                                      onChange={(e) => handlePaymentInput(e.target.value)}
                                      onBlur={handlePaymentBlur}
                                      onFocus={() => setPaymentInput(String(payment))}
                                      className="rounded-xl h-12 text-xl font-bold pr-8 text-right"
                                      inputMode="numeric"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground font-medium">₽</span>
                              </div>

                              <div className={cn(
                                  "rounded-xl p-3 flex justify-between items-center",
                                  termWarning ? "bg-red-50" : "bg-primary/5"
                              )}>
                                  <span className="text-sm text-muted-foreground">Срок займа</span>
                                  <span className={cn("text-lg font-bold", termWarning ? "text-red-500" : "text-primary")} data-testid="text-calculated-term">
                                      {termWarning
                                          ? "Платёж слишком мал"
                                          : months > 0
                                              ? `${months} мес.`
                                              : "—"
                                      }
                                  </span>
                              </div>
                          </motion.div>
                      )}
                  </AnimatePresence>
              </div>
            )}

            {frequency === "once" && (
              <div className="space-y-3 bg-white rounded-3xl p-4">
                  <Label className="text-sm font-semibold">{t.term}</Label>
                  <div className="relative">
                      <Input
                          data-testid="input-term"
                          value={monthsInput}
                          onChange={(e) => handleMonthsInput(e.target.value)}
                          onBlur={handleMonthsBlur}
                          onFocus={() => setMonthsInput(String(months))}
                          className="rounded-xl h-12 text-xl font-bold pr-16 text-right"
                          inputMode="numeric"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{t.months}</span>
                  </div>
                  <Slider
                      data-testid="slider-term-once"
                      value={[months]}
                      onValueChange={(v) => handleMonthsSlider(v[0])}
                      min={1}
                      max={120}
                      step={1}
                      className="py-1"
                  />
              </div>
            )}

            <Card className="rounded-3xl border-2 border-primary/10 shadow-lg shadow-primary/5 overflow-hidden">
                <div className="h-1.5 bg-primary w-full" />
                <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{frequency === "once" ? "Сумма возврата" : t.monthly_payment}</span>
                        <span className="text-xl font-bold text-primary" data-testid="text-summary-payment">
                            {summary.pmt > 0 ? `${summary.pmt.toLocaleString("ru-RU")} ₽` : "—"}
                        </span>
                    </div>
                    {frequency !== "once" && (
                        <>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">{t.total_repayment}</span>
                                <span className="font-semibold" data-testid="text-summary-total">
                                    {summary.totalRepayment > 0 ? `${summary.totalRepayment.toLocaleString("ru-RU")} ₽` : "—"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Переплата</span>
                                <span className={cn("font-semibold", summary.overpayment > 0 ? "text-orange-500" : "text-green-600")} data-testid="text-summary-overpayment">
                                    {summary.overpayment > 0 ? `+${summary.overpayment.toLocaleString("ru-RU")} ₽` : "0 ₽"}
                                </span>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

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
                <Button
                    data-testid="button-create-loan-submit"
                    type="submit"
                    className="w-full h-14 text-lg rounded-2xl shadow-xl shadow-primary/20"
                    disabled={mutation.isPending || !isValid}
                >
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
