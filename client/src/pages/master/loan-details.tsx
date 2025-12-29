import { MobileLayout } from "@/components/layout";
import { useStore, translations } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation, useRoute } from "wouter";
import { Calendar, ChevronLeft, Copy, Check, Bell, FileWarning, Gavel } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function MasterLoanDetails() {
  const [, params] = useRoute("/master/loan/:id");
  const { loans, paymentRequests, confirmPayment } = useStore();
  const loanId = params?.id;
  const loan = loans.find(l => l.id === loanId);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
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

  const handleGenerateClaim = () => {
    toast({
        title: "Доступно в тарифе Expert",
        description: "Улучшите тариф для формирования досудебной претензии.",
    });
  };

  return (
    <MobileLayout title={t.loan_details} showBack>
      <div className="space-y-6">
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
             <p className="text-white/80 text-sm">{t.amount}</p>
             <h2 className="text-3xl font-bold mt-1">
                {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(loan.amount)}
             </h2>
             <Badge className="mt-4 bg-white/20 border-none text-white backdrop-blur-sm">
                {loan.status.toUpperCase()}
             </Badge>
          </div>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-xs text-muted-foreground uppercase">{t.term}</p>
                    <p className="font-semibold">{loan.termMonths} {t.months}</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground uppercase">{t.rate}</p>
                    <p className="font-semibold">{loan.ratePercent}% {t.yearly}</p>
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

            <div className="grid grid-cols-2 gap-2 pt-2">
                <Button variant="secondary" className="rounded-2xl gap-2" onClick={handleCopyLink}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {t.copy_link}
                </Button>
                <Button variant="outline" className="rounded-2xl gap-2 border-orange-200 text-orange-600 hover:bg-orange-50" onClick={handleGenerateClaim}>
                    <Gavel className="h-4 w-4" />
                    Претензия
                </Button>
            </div>
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
                                <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="font-medium">{item.amount.toLocaleString()} ₽</p>
                             <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full font-bold",
                                item.status === "paid" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                             )}>
                                {item.status === "paid" ? t.paid : t.upcoming}
                             </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </MobileLayout>
  );
}
