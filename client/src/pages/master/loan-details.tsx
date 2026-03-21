import { MobileLayout } from "@/components/layout";
import { translations } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRoute } from "wouter";
import { Calendar, Copy, Check, Bell, Gavel, Star, PartyPopper, Loader2, Send, MessageCircleMore, TrendingDown, Timer, X } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { getLoan, getPaymentRequests, confirmPayment, rateLoan } from "@/lib/api";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type OverpaymentStrategy = "reduce_term" | "reduce_payment";

interface StrategySheetProps {
  reqId: string;
  reqAmount: number;
  scheduledAmount: number;
  onConfirm: (strategy: OverpaymentStrategy) => void;
  onClose: () => void;
  isPending: boolean;
}

function OverpaymentStrategySheet({ reqId, reqAmount, scheduledAmount, onConfirm, onClose, isPending }: StrategySheetProps) {
  const overpaid = reqAmount - scheduledAmount;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-md mx-auto bg-white rounded-t-[2rem] p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Переплата: +{overpaid.toLocaleString()} ₽</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100" data-testid="button-close-strategy-sheet">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          Заёмщик внёс <strong>{reqAmount.toLocaleString()} ₽</strong> вместо планового&nbsp;
          <strong>{scheduledAmount.toLocaleString()} ₽</strong>. Как пересчитать график?
        </p>

        <div className="space-y-3">
          <button
            data-testid="button-strategy-reduce-term"
            disabled={isPending}
            onClick={() => onConfirm("reduce_term")}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-colors text-left disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Timer className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-primary">Сократить срок</p>
              <p className="text-xs text-muted-foreground mt-0.5">Ежемесячный платёж остаётся прежним, займ закроется раньше</p>
            </div>
          </button>

          <button
            data-testid="button-strategy-reduce-payment"
            disabled={isPending}
            onClick={() => onConfirm("reduce_payment")}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-border hover:border-gray-300 hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="font-bold text-gray-800">Сократить платёж</p>
              <p className="text-xs text-muted-foreground mt-0.5">Срок займа не меняется, ежемесячная сумма уменьшится</p>
            </div>
          </button>
        </div>

        {isPending && (
          <div className="flex justify-center pt-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function MasterLoanDetails() {
  const [, params] = useRoute("/master/loan/:id");
  const loanId = params?.id;
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [strategySheet, setStrategySheet] = useState<{ reqId: string; reqAmount: number; scheduledAmount: number } | null>(null);
  const t = translations;

  const { data: loan, isLoading } = useQuery({
    queryKey: ["/api/loans", loanId],
    queryFn: () => getLoan(loanId!),
    enabled: !!loanId,
    refetchInterval: 5000,
  });

  const { data: allRequests = [] } = useQuery({
    queryKey: ["/api/payment-requests", loanId],
    queryFn: () => getPaymentRequests(loanId!),
    enabled: !!loanId,
    refetchInterval: 5000,
  });

  const confirmMutation = useMutation({
    mutationFn: ({ requestId, strategy }: { requestId: string; strategy?: OverpaymentStrategy }) =>
      confirmPayment(requestId, strategy),
    onSuccess: () => {
      setStrategySheet(null);
      queryClient.invalidateQueries({ queryKey: ["/api/loans", loanId] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-requests", loanId] });
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      toast({ title: "Платёж подтверждён", description: "График платежей пересчитан" });
    },
    onError: (error: any) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const rateMutation = useMutation({
    mutationFn: (stars: number) => rateLoan(loanId!, "borrower", stars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans", loanId] });
      toast({ title: t.rating_saved });
    },
    onError: (error: any) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading || !loan) {
    return (
      <MobileLayout title={t.loan_details} showBack>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  const relevantRequests = allRequests.filter((r: any) => r.status === "pending");
  const nextScheduledItem = loan.schedule?.find((s: any) => s.status === "upcoming");
  const inviteLink = `${window.location.origin}/invite/${loan.id}`;
  const shareText = `Приглашение в Meloan: заём на ${loan.amount.toLocaleString()} ₽. Перейдите по ссылке для подтверждения:`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast({ title: t.link_copied });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const shareViaWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + inviteLink)}`, '_blank');
  };

  const handleConfirmClick = (req: any) => {
    const scheduledAmount = nextScheduledItem?.amount ?? 0;
    const isOverpayment = req.amount > scheduledAmount && scheduledAmount > 0;

    if (isOverpayment && loan.frequency !== "once") {
      setStrategySheet({ reqId: req.id, reqAmount: req.amount, scheduledAmount });
    } else {
      confirmMutation.mutate({ requestId: req.id });
    }
  };

  return (
    <MobileLayout title={t.loan_details} showBack>
      <div className="space-y-6">
        {loan.status === "closed" && (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border-2 border-green-200 rounded-3xl p-6 text-center space-y-4"
            >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <PartyPopper className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-green-800">{t.loan_closed}</h3>
                <p className="text-sm text-green-700/80">{t.congrats_lender}</p>

                <div className="pt-4 border-t border-green-200 mt-4">
                    <p className="text-sm font-semibold mb-3">{t.rate_borrower}</p>
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                data-testid={`button-rate-${star}`}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => rateMutation.mutate(star)}
                                className="focus:outline-none transition-transform active:scale-90"
                            >
                                <Star
                                    className={cn(
                                        "w-8 h-8",
                                        (hoverRating || loan.borrowerRating || 0) >= star
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-gray-300"
                                    )}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>
        )}

        {relevantRequests.map((req: any) => {
          const scheduledAmount = nextScheduledItem?.amount ?? 0;
          const isOverpayment = req.amount > scheduledAmount && scheduledAmount > 0 && loan.frequency !== "once";

          return (
            <Card key={req.id} className={cn(
              "border-2 rounded-2xl",
              isOverpayment
                ? "border-orange-400 bg-orange-50 animate-pulse"
                : "border-primary bg-primary/5 animate-pulse"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Bell className={cn("w-5 h-5", isOverpayment ? "text-orange-500" : "text-primary")} />
                    <div>
                      <p className={cn("text-xs font-bold uppercase", isOverpayment ? "text-orange-600" : "text-primary")}>
                        {isOverpayment ? "Переплата!" : t.payment_confirmation}
                      </p>
                      <p className="text-lg font-bold">{req.amount.toLocaleString()} ₽</p>
                    </div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        data-testid={`button-confirm-${req.id}`}
                        size="sm"
                        onClick={() => handleConfirmClick(req)}
                        className={cn(
                          "rounded-xl shadow-lg",
                          isOverpayment && "bg-orange-500 hover:bg-orange-600"
                        )}
                        disabled={confirmMutation.isPending}
                      >
                        {confirmMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t.confirm}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isOverpayment
                        ? "Выберите способ пересчёта графика"
                        : "Подтвердить получение платежа от заемщика"}
                    </TooltipContent>
                  </Tooltip>
                </div>
                {isOverpayment && (
                  <p className="text-xs text-orange-600/80 bg-orange-100 rounded-xl px-3 py-1.5">
                    Плановый платёж: {scheduledAmount.toLocaleString()} ₽ · Переплата: +{(req.amount - scheduledAmount).toLocaleString()} ₽
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}

        <Card className="rounded-3xl border-none shadow-lg overflow-hidden">
          <div className="bg-primary p-6 text-white text-center">
             <p className="text-white/80 text-sm">{t.remaining_amount}</p>
             <h2 className="text-3xl font-bold mt-1" data-testid="text-remaining">
                {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(loan.remainingAmount || 0)}
             </h2>
             <Badge className={cn("mt-4 border-none text-white backdrop-blur-sm", loan.status === "closed" ? "bg-green-500/50" : "bg-white/20")}>
                {loan.status === "closed" ? "ЗАВЕРШЕН" : loan.status.toUpperCase()}
             </Badge>
          </div>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-xs text-muted-foreground uppercase">{t.amount}</p>
                    <p className="font-semibold">{loan.amount.toLocaleString()} ₽</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground uppercase">{t.rate}</p>
                    <p className="font-semibold">{Number(loan.ratePercent)}%</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground uppercase">{t.monthly_payment}</p>
                    <p className="font-semibold">{loan.monthlyPayment.toLocaleString()} ₽</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground uppercase">{t.total_repayment}</p>
                    <p className="font-semibold">{loan.totalRepayment.toLocaleString()} ₽</p>
                </div>
            </div>

            <div className="pt-4 border-t border-dashed">
                <p className="text-xs text-muted-foreground uppercase mb-2">{t.borrower_details}</p>
                <p className="font-bold">{loan.borrowerName}</p>
                <p className="text-sm text-muted-foreground">{loan.borrowerContact}</p>
            </div>

            {loan.status !== "closed" && (
                <div className="space-y-2 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="secondary" className="rounded-2xl gap-2" onClick={handleCopyLink} data-testid="button-copy-link">
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                {t.copy_link}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Скопировать ссылку-приглашение для отправки заемщику</TooltipContent>
                        </Tooltip>
                        <Button variant="outline" className="rounded-2xl gap-2 border-orange-200 text-orange-600" onClick={() => toast({ title: "Доступно в Expert" })}>
                            <Gavel className="h-4 w-4" />
                            Претензия
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" className="rounded-2xl gap-2 border-blue-200 text-blue-600" onClick={shareViaTelegram} data-testid="button-share-telegram">
                                <Send className="h-4 w-4" />
                                Telegram
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Отправить ссылку заемщику через Telegram</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" className="rounded-2xl gap-2 border-green-200 text-green-600" onClick={shareViaWhatsApp} data-testid="button-share-whatsapp">
                                <MessageCircleMore className="h-4 w-4" />
                                WhatsApp
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Отправить ссылку заемщику через WhatsApp</TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            )}
          </CardContent>
        </Card>

        <div>
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                {t.schedule}
            </h3>
            <div className="space-y-3">
                {(loan.schedule || []).map((item: any, i: number) => (
                    <div key={item.id || i} className="p-4 bg-white rounded-2xl border border-border/50 shadow-sm" data-testid={`schedule-item-${i}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                                    item.status === "paid" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                                )}>
                                    {item.status === "paid" ? "✓" : i + 1}
                                </div>
                                <div>
                                    <p className="font-semibold">{t.payment_number} #{i + 1}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {item.status === "paid" && item.paidDate
                                            ? `Оплачено: ${new Date(item.paidDate).toLocaleDateString('ru-RU')}`
                                            : new Date(item.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-lg">{item.amount.toLocaleString()} ₽</p>
                                {item.status === "paid" && item.paidAmount && item.paidAmount !== item.amount && (
                                  <p className="text-xs text-orange-500 font-medium">факт: {item.paidAmount.toLocaleString()} ₽</p>
                                )}
                            </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-dashed border-gray-100 flex justify-between text-xs text-muted-foreground">
                            <span>Основной долг: <span className="font-semibold text-gray-700">{(item.principalPart || 0).toLocaleString()} ₽</span></span>
                            <span>Проценты: <span className="font-semibold text-orange-600">{(item.interestPart || 0).toLocaleString()} ₽</span></span>
                        </div>
                        {item.remainingAfter !== undefined && item.remainingAfter !== null && (
                            <div className="mt-1 text-[10px] text-muted-foreground text-right">
                                Остаток: {item.remainingAfter.toLocaleString()} ₽
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
      </div>

      <AnimatePresence>
        {strategySheet && (
          <OverpaymentStrategySheet
            reqId={strategySheet.reqId}
            reqAmount={strategySheet.reqAmount}
            scheduledAmount={strategySheet.scheduledAmount}
            onConfirm={(strategy) => confirmMutation.mutate({ requestId: strategySheet.reqId, strategy })}
            onClose={() => setStrategySheet(null)}
            isPending={confirmMutation.isPending}
          />
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}
