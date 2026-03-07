import { MobileLayout } from "@/components/layout";
import { useStore, translations } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, Calendar, CheckCircle2, Star, PartyPopper, Loader2, ChevronLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { getLoan, createPaymentRequest, rateLoan, findLoansByPhone } from "@/lib/api";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function LoanCard({ loan, onSelect }: { loan: any; onSelect: () => void }) {
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    active: "bg-blue-100 text-blue-700",
    closed: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-500",
  };

  const statusLabels: Record<string, string> = {
    pending: "Ожидает",
    active: "Активный",
    closed: "Закрыт",
    cancelled: "Отменен",
  };

  const paidCount = (loan.schedule || []).filter((s: any) => s.status === "paid").length;
  const totalCount = (loan.schedule || []).length;

  return (
    <Card
      className="rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden group"
      onClick={onSelect}
      data-testid={`card-borrower-loan-${loan.id}`}
    >
      <CardContent className="p-0">
        <div className="p-4 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-bold text-gray-900 truncate">{loan.amount.toLocaleString()} ₽</p>
              <Badge className={cn("text-[10px] border-none", statusColors[loan.status] || "bg-gray-100")}>
                {statusLabels[loan.status] || loan.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {Number(loan.ratePercent)}% · {loan.termMonths} мес. · {loan.frequency === "monthly" ? "ежемесячно" : loan.frequency === "weekly" ? "еженедельно" : loan.frequency === "daily" ? "ежедневно" : "в конце срока"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Остаток</p>
              <p className="font-bold text-sm">{(loan.remainingAmount || 0).toLocaleString()} ₽</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
          </div>
        </div>
        <div className="bg-gray-50/50 px-4 py-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Оплачено {paidCount} из {totalCount}</span>
            <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${(paidCount / Math.max(totalCount, 1)) * 100}%` }} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoanDetail({ loan, onBack }: { loan: any; onBack: () => void }) {
  const t = translations;
  const { toast } = useToast();
  const [paymentAmount, setPaymentAmount] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const { currentBorrowerLoanId } = useStore();

  const paymentMutation = useMutation({
    mutationFn: (amount: number) => createPaymentRequest({
      loanId: loan.id,
      amount,
      timestamp: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans", loan.id] });
      toast({ title: t.payment_requested, description: `${paymentAmount} ₽` });
      setPaymentAmount("");
    },
    onError: (error: any) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const rateMutation = useMutation({
    mutationFn: (stars: number) => rateLoan(loan.id, "lender", stars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans", loan.id] });
      toast({ title: t.rating_saved });
    },
    onError: (error: any) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const handlePayment = () => {
    if (!paymentAmount) return;
    paymentMutation.mutate(parseFloat(paymentAmount));
  };

  const nextScheduleAmount = (loan.schedule || []).find((s: any) => s.status === "upcoming")?.amount;

  return (
    <div className="space-y-6 pb-10">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 -ml-2 text-muted-foreground" data-testid="button-back-to-loans">
        <ChevronLeft className="w-4 h-4" />
        Все займы
      </Button>

      {loan.status === "closed" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-primary/5 border-2 border-primary/20 rounded-3xl p-6 text-center space-y-4 shadow-xl shadow-primary/5"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <PartyPopper className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-primary">{t.loan_closed}</h3>
          <p className="text-sm text-muted-foreground">{t.congrats_borrower}</p>

          <div className="pt-4 border-t border-primary/10 mt-4">
            <p className="text-sm font-semibold mb-3">{t.rate_lender}</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  data-testid={`button-rate-lender-${star}`}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => rateMutation.mutate(star)}
                  className="focus:outline-none transition-transform active:scale-90"
                >
                  <Star
                    className={cn(
                      "w-8 h-8",
                      (hoverRating || loan.lenderRating || 0) >= star
                        ? "fill-primary text-primary"
                        : "text-gray-300"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <Card className="bg-primary text-white border-none shadow-xl shadow-primary/30 rounded-3xl overflow-hidden relative">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-white/80 text-sm font-medium">{t.remaining_amount}</p>
              <h2 className="text-4xl font-display font-bold mt-1" data-testid="text-remaining-borrower">
                {(loan.remainingAmount || 0).toLocaleString()} ₽
              </h2>
            </div>
            <Badge className={cn("border-none backdrop-blur-md", loan.status === "closed" ? "bg-green-500/50" : "bg-white/20 hover:bg-white/30 text-white")}>
              {loan.status === "closed" ? "ЗАКРЫТ" : loan.status.toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs text-white/70 mb-4">
            <div>
              <p>Сумма</p>
              <p className="font-bold text-white">{loan.amount.toLocaleString()} ₽</p>
            </div>
            <div>
              <p>Ставка</p>
              <p className="font-bold text-white">{Number(loan.ratePercent)}%</p>
            </div>
            <div>
              <p>Платеж</p>
              <p className="font-bold text-white">{loan.monthlyPayment.toLocaleString()} ₽</p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm text-white/80">
              <span>Оплачено {(loan.schedule || []).filter((s: any) => s.status === 'paid').length} из {(loan.schedule || []).length}</span>
            </div>
            <div className="h-2 bg-black/20 rounded-full overflow-hidden">
              <div className="h-full bg-white/90 rounded-full" style={{ width: `${((loan.schedule || []).filter((s: any) => s.status === 'paid').length / Math.max((loan.schedule || []).length, 1)) * 100}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {loan.status !== "closed" && (
        <Card className="rounded-2xl border-none shadow-md bg-white p-4 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold">{t.payment_amount}</p>
            <Input
              data-testid="input-payment-amount"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder={nextScheduleAmount ? `Следующий платеж: ${nextScheduleAmount.toLocaleString()} ₽` : "0.00 ₽"}
              className="h-12 rounded-xl text-lg font-bold"
            />
            {nextScheduleAmount && paymentAmount && parseFloat(paymentAmount) > nextScheduleAmount && (
              <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">
                Сумма больше планового платежа — это будет частично-досрочное погашение. График будет пересчитан после подтверждения кредитором.
              </p>
            )}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                data-testid="button-send-payment"
                onClick={handlePayment}
                disabled={!paymentAmount || paymentMutation.isPending}
                className="w-full h-12 rounded-xl bg-primary text-white font-bold"
              >
                {paymentMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {t.confirm_payment}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Отправить запрос на подтверждение оплаты кредитору</TooltipContent>
          </Tooltip>
        </Card>
      )}

      <div>
        <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          {t.schedule}
        </h3>
        <div className="space-y-3">
          {(loan.schedule || []).map((item: any, i: number) => (
            <div key={item.id || i} className="p-4 bg-white rounded-2xl border border-border/50 shadow-sm" data-testid={`schedule-item-borrower-${i}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                    item.status === "paid" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  )}>
                    {item.status === "paid" ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
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
  );
}

export default function BorrowerDashboard() {
  const { borrowerPhone, currentBorrowerLoanId, setCurrentBorrowerLoanId } = useStore();
  const t = translations;
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(currentBorrowerLoanId);

  const { data: allLoans = [], isLoading } = useQuery({
    queryKey: ["/api/loans/by-phone", borrowerPhone],
    queryFn: () => borrowerPhone ? findLoansByPhone(borrowerPhone) : [],
    enabled: !!borrowerPhone,
    refetchInterval: 5000,
  });

  const { data: singleLoan } = useQuery({
    queryKey: ["/api/loans", currentBorrowerLoanId],
    queryFn: () => currentBorrowerLoanId ? getLoan(currentBorrowerLoanId) : null,
    enabled: !!currentBorrowerLoanId && !borrowerPhone,
    refetchInterval: 5000,
  });

  const loans = allLoans.length > 0 ? allLoans : (singleLoan ? [singleLoan] : []);
  const selectedLoan = loans.find((l: any) => l.id === selectedLoanId) || null;

  if (isLoading) {
    return (
      <MobileLayout title={t.loans}>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  if (loans.length === 0) {
    return (
      <MobileLayout title={t.loans}>
        <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6 space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Wallet className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">{t.no_loan_found}</h3>
        </div>
      </MobileLayout>
    );
  }

  if (selectedLoan) {
    return (
      <MobileLayout title={t.loans}>
        <LoanDetail
          loan={selectedLoan}
          onBack={() => {
            if (loans.length > 1) {
              setSelectedLoanId(null);
            }
          }}
        />
      </MobileLayout>
    );
  }

  if (loans.length === 1) {
    return (
      <MobileLayout title={t.loans}>
        <LoanDetail
          loan={loans[0]}
          onBack={() => {}}
        />
      </MobileLayout>
    );
  }

  const activeLoans = loans.filter((l: any) => l.status === "active" || l.status === "pending");
  const closedLoans = loans.filter((l: any) => l.status === "closed");
  const totalRemaining = loans.reduce((sum: number, l: any) => sum + (l.remainingAmount || 0), 0);

  return (
    <MobileLayout title={t.loans}>
      <div className="space-y-6 pb-10">
        <Card className="bg-primary text-white border-none shadow-xl shadow-primary/30 rounded-3xl overflow-hidden relative">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <CardContent className="p-6">
            <p className="text-white/80 text-sm font-medium">Общий остаток по всем займам</p>
            <h2 className="text-3xl font-display font-bold mt-1" data-testid="text-total-remaining">
              {totalRemaining.toLocaleString()} ₽
            </h2>
            <div className="flex gap-4 mt-4 text-sm">
              <div className="bg-white/10 rounded-xl px-3 py-1.5">
                <span className="text-white/70">Активных: </span>
                <span className="font-bold">{activeLoans.length}</span>
              </div>
              <div className="bg-white/10 rounded-xl px-3 py-1.5">
                <span className="text-white/70">Закрытых: </span>
                <span className="font-bold">{closedLoans.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {activeLoans.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-display font-semibold text-lg">Активные займы</h3>
            {activeLoans.map((loan: any) => (
              <LoanCard
                key={loan.id}
                loan={loan}
                onSelect={() => {
                  setSelectedLoanId(loan.id);
                  setCurrentBorrowerLoanId(loan.id);
                }}
              />
            ))}
          </div>
        )}

        {closedLoans.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-display font-semibold text-lg text-muted-foreground">Закрытые займы</h3>
            {closedLoans.map((loan: any) => (
              <LoanCard
                key={loan.id}
                loan={loan}
                onSelect={() => {
                  setSelectedLoanId(loan.id);
                  setCurrentBorrowerLoanId(loan.id);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
