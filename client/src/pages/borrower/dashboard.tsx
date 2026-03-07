import { MobileLayout } from "@/components/layout";
import { useStore, translations } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, Calendar, CheckCircle2, Star, PartyPopper, Loader2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { getLoan, createPaymentRequest, rateLoan } from "@/lib/api";

export default function BorrowerDashboard() {
  const { currentBorrowerLoanId } = useStore();
  const t = translations;
  const { toast } = useToast();
  const [paymentAmount, setPaymentAmount] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  const { data: myLoan, isLoading } = useQuery({
    queryKey: ["/api/loans", currentBorrowerLoanId],
    queryFn: () => currentBorrowerLoanId ? getLoan(currentBorrowerLoanId) : null,
    enabled: !!currentBorrowerLoanId,
    refetchInterval: 5000,
  });

  const paymentMutation = useMutation({
    mutationFn: (amount: number) => createPaymentRequest({
      loanId: currentBorrowerLoanId!,
      amount,
      timestamp: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans", currentBorrowerLoanId] });
      toast({ title: t.payment_requested, description: `${paymentAmount} ₽` });
      setPaymentAmount("");
    },
    onError: (error: any) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const rateMutation = useMutation({
    mutationFn: (stars: number) => rateLoan(currentBorrowerLoanId!, "lender", stars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans", currentBorrowerLoanId] });
      toast({ title: t.rating_saved });
    },
    onError: (error: any) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <MobileLayout title={t.loans}>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  if (!myLoan) {
      return (
          <MobileLayout title={t.loans}>
              <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6 space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Wallet className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">{t.no_loan_found}</h3>
              </div>
          </MobileLayout>
      )
  }

  const handlePayment = () => {
    if (!paymentAmount) return;
    paymentMutation.mutate(parseFloat(paymentAmount));
  };

  return (
    <MobileLayout title={t.loans}>
      <div className="space-y-6 pb-10">
        {myLoan.status === "closed" && (
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
                                        (hoverRating || myLoan.lenderRating || 0) >= star 
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
                            {(myLoan.remainingAmount || 0).toLocaleString()} ₽
                        </h2>
                    </div>
                    <Badge className={cn("border-none backdrop-blur-md", myLoan.status === "closed" ? "bg-green-500/50" : "bg-white/20 hover:bg-white/30 text-white")}>
                        {myLoan.status === "closed" ? "ЗАКРЫТ" : myLoan.status.toUpperCase()}
                    </Badge>
                </div>
                
                <div className="space-y-1">
                    <div className="flex justify-between text-sm text-white/80">
                        <span>Оплачено {(myLoan.schedule || []).filter((s: any) => s.status === 'paid').length} из {(myLoan.schedule || []).length}</span>
                    </div>
                    <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white/90 rounded-full" style={{ width: `${((myLoan.schedule || []).filter((s: any) => s.status === 'paid').length / Math.max((myLoan.schedule || []).length, 1)) * 100}%` }} />
                    </div>
                </div>
           </CardContent>
        </Card>

        {myLoan.status !== "closed" && (
            <Card className="rounded-2xl border-none shadow-md bg-white p-4 space-y-4">
                <div className="space-y-2">
                    <p className="text-sm font-semibold">{t.payment_amount}</p>
                    <Input 
                        data-testid="input-payment-amount"
                        type="number" 
                        value={paymentAmount} 
                        onChange={(e) => setPaymentAmount(e.target.value)} 
                        placeholder="0.00 ₽"
                        className="h-12 rounded-xl text-lg font-bold"
                    />
                </div>
                <Button 
                    data-testid="button-send-payment"
                    onClick={handlePayment} 
                    disabled={!paymentAmount || paymentMutation.isPending}
                    className="w-full h-12 rounded-xl bg-primary text-white font-bold"
                >
                    {paymentMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {t.confirm_payment}
                </Button>
            </Card>
        )}

        <div>
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                {t.schedule}
            </h3>
            <div className="space-y-3">
                {(myLoan.schedule || []).map((item: any, i: number) => (
                    <div key={item.id || i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-border/50 shadow-sm" data-testid={`schedule-item-borrower-${i}`}>
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
                             <p className="font-medium">{item.amount.toLocaleString()} ₽</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </MobileLayout>
  );
}
