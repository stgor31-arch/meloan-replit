import { MobileLayout } from "@/components/layout";
import { useStore, translations } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation, useRoute } from "wouter";
import { Calendar, ChevronLeft, Copy, Check, Bell, Gavel, Star, PartyPopper } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function MasterLoanDetails() {
  const [, params] = useRoute("/master/loan/:id");
  const { loans, paymentRequests, confirmPayment, rateUser } = useStore();
  const loanId = params?.id;
  const loan = loans.find(l => l.id === loanId);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const t = translations;

  if (!loan) return null;

  const relevantRequests = paymentRequests.filter(r => r.loanId === loan.id && r.status === "pending");
  const inviteLink = `${window.location.origin}/invite/${loan.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast({ title: t.link_copied });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRate = (stars: number) => {
    rateUser(loan.id, "borrower", stars);
    toast({ title: t.rating_saved });
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
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => handleRate(star)}
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

        {relevantRequests.map(req => (
            <Card key={req.id} className="border-2 border-primary bg-primary/5 animate-pulse rounded-2xl">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-primary" />
                        <div>
                            <p className="text-xs font-bold text-primary uppercase">{t.payment_confirmation}</p>
                            <p className="text-lg font-bold">{req.amount.toLocaleString()} ₽</p>
                        </div>
                    </div>
                    <Button size="sm" onClick={() => confirmPayment(req.id)} className="rounded-xl shadow-lg">
                        {t.confirm}
                    </Button>
                </CardContent>
            </Card>
        ))}

        <Card className="rounded-3xl border-none shadow-lg overflow-hidden">
          <div className="bg-primary p-6 text-white text-center">
             <p className="text-white/80 text-sm">{t.remaining_amount}</p>
             <h2 className="text-3xl font-bold mt-1">
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
                    <p className="font-semibold">{loan.ratePercent}%</p>
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
                <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button variant="secondary" className="rounded-2xl gap-2" onClick={handleCopyLink}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {t.copy_link}
                    </Button>
                    <Button variant="outline" className="rounded-2xl gap-2 border-orange-200 text-orange-600" onClick={() => toast({ title: "Доступно в Expert" })}>
                        <Gavel className="h-4 w-4" />
                        Претензия
                    </Button>
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
                {loan.schedule.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-border/50 shadow-sm">
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
