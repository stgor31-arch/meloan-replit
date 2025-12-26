import { MobileLayout } from "@/components/layout";
import { useStore, translations, Loan } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation, useRoute } from "wouter";
import { Calendar, ChevronLeft, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function MasterLoanDetails() {
  const [, params] = useRoute("/master/loan/:id");
  const { loans, language } = useStore();
  const loanId = params?.id;
  const loan = loans.find(l => l.id === loanId);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const t = translations[language];

  if (!loan) return null;

  const inviteLink = `${window.location.origin}/invite/${loan.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast({ title: t.link_copied });
    setTimeout(() => setCopied(false), 2000);
  };

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-700 border-green-200",
    pending: "bg-orange-100 text-orange-700 border-orange-200",
    closed: "bg-gray-100 text-gray-700 border-gray-200",
    cancelled: "bg-red-100 text-red-700 border-red-200"
  };

  return (
    <MobileLayout title={t.loan_details}>
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/master/dashboard")} className="-ml-2 mb-2">
            <ChevronLeft className="h-4 w-4 mr-1" /> {t.loans}
        </Button>

        <Card className="rounded-3xl border-none shadow-lg overflow-hidden">
          <div className="bg-primary p-6 text-white text-center">
             <p className="text-white/80 text-sm">{t.amount}</p>
             <h2 className="text-3xl font-bold mt-1">
                {new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(loan.amount)}
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

            <Button 
                variant="secondary" 
                className="w-full rounded-2xl gap-2 mt-2" 
                onClick={handleCopyLink}
            >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {t.copy_link}
            </Button>
          </CardContent>
        </Card>

        <div>
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                {t.schedule}
            </h3>
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-border/50">
                        <div>
                            <p className="font-semibold">Payment #{i}</p>
                            <p className="text-xs text-muted-foreground">Oct 25, 2024</p>
                        </div>
                        <div className="text-right">
                             <p className="font-medium">{loan.monthlyPayment.toLocaleString()} ₽</p>
                             <span className="text-[10px] text-muted-foreground">Upcoming</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </MobileLayout>
  );
}
