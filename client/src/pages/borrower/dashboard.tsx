import { MobileLayout } from "@/components/layout";
import { useStore, translations } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, Calendar, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function BorrowerDashboard() {
  const { currentBorrowerLoan, requestPayment } = useStore();
  const t = translations;
  const myLoan = currentBorrowerLoan;
  const { toast } = useToast();

  const [paymentAmount, setPaymentAmount] = useState("");
  const [isPending, setIsPending] = useState(false);

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
    requestPayment(myLoan.id, parseFloat(paymentAmount));
    setIsPending(true);
    toast({
        title: t.payment_requested,
        description: `${paymentAmount} ₽`
    });
    setPaymentAmount("");
    setTimeout(() => setIsPending(false), 2000);
  };

  return (
    <MobileLayout title={t.loans}>
      <div className="space-y-6">
        <Card className="bg-primary text-white border-none shadow-xl shadow-primary/30 rounded-3xl overflow-hidden relative">
           <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
           <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-white/80 text-sm font-medium">{t.monthly_payment}</p>
                        <h2 className="text-4xl font-display font-bold mt-1">
                            {myLoan.monthlyPayment.toLocaleString()} ₽
                        </h2>
                    </div>
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md">
                        {myLoan.status.toUpperCase()}
                    </Badge>
                </div>
                
                <div className="space-y-1">
                    <div className="flex justify-between text-sm text-white/80">
                        <span>Оплачено {myLoan.schedule.filter(s => s.status === 'paid').length} из {myLoan.schedule.length}</span>
                    </div>
                    <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white/90 rounded-full" style={{ width: `${(myLoan.schedule.filter(s => s.status === 'paid').length / myLoan.schedule.length) * 100}%` }} />
                    </div>
                </div>
           </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-md bg-white p-4 space-y-4">
            <div className="space-y-2">
                <p className="text-sm font-semibold">{t.payment_amount}</p>
                <Input 
                    type="number" 
                    value={paymentAmount} 
                    onChange={(e) => setPaymentAmount(e.target.value)} 
                    placeholder="0.00 ₽"
                    className="h-12 rounded-xl text-lg font-bold"
                />
            </div>
            <Button 
                onClick={handlePayment} 
                disabled={!paymentAmount || isPending}
                className="w-full h-12 rounded-xl bg-primary text-white font-bold"
            >
                {t.confirm_payment}
            </Button>
        </Card>

        <div>
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                {t.schedule}
            </h3>
            <div className="space-y-3">
                {myLoan.schedule.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-border/50 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                                item.status === "paid" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                            )}>
                                {item.status === "paid" ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                            </div>
                            <div>
                                <p className="font-semibold">{t.payment_number} #{i + 1}</p>
                                <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="font-medium">{item.amount.toLocaleString()} ₽</p>
                             <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
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
