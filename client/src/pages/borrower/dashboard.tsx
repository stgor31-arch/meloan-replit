import { MobileLayout } from "@/components/layout";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, Calendar, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

export default function BorrowerDashboard() {
  const { loans } = useStore();
  // Mock: Assume current user is the borrower of the first active loan found
  const myLoan = loans.find(l => l.status === "active");

  if (!myLoan) {
      return (
          <MobileLayout title="My Loans">
              <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6 space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Wallet className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">No active loans</h3>
                  <p className="text-muted-foreground">You don't have any active loans at the moment.</p>
              </div>
          </MobileLayout>
      )
  }

  return (
    <MobileLayout title="My Loan">
      <div className="space-y-6">
        {/* Main Status Card */}
        <Card className="bg-primary text-white border-none shadow-xl shadow-primary/30 rounded-3xl overflow-hidden relative">
           <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
           <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-white/80 text-sm font-medium">Next Payment</p>
                        <h2 className="text-4xl font-display font-bold mt-1">
                            {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(myLoan.monthlyPayment)}
                        </h2>
                    </div>
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md">
                        Due in 5 days
                    </Badge>
                </div>
                
                <div className="space-y-1">
                    <div className="flex justify-between text-sm text-white/80">
                        <span>Paid 2 of {myLoan.termMonths}</span>
                        <span>{Math.round((2/myLoan.termMonths)*100)}%</span>
                    </div>
                    <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white/90 rounded-full" style={{ width: '33%' }} />
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-white/60 uppercase tracking-wider">Remaining</p>
                        <p className="font-semibold text-lg">
                            {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(myLoan.totalRepayment * 0.66)}
                        </p>
                    </div>
                    <Button variant="secondary" className="rounded-xl shadow-lg">
                        Pay Now
                    </Button>
                </div>
           </CardContent>
        </Card>

        {/* Schedule */}
        <div>
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                Payment Schedule
            </h3>
            
            <div className="space-y-3">
                {[1,2,3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-border/50 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                                i < 3 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                            )}>
                                {i < 3 ? "✓" : i}
                            </div>
                            <div>
                                <p className="font-semibold">Payment #{i}</p>
                                <p className="text-xs text-muted-foreground">Oct 25, 2024</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="font-medium">{myLoan.monthlyPayment.toLocaleString()} ₽</p>
                             <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full",
                                i < 3 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                             )}>
                                {i < 3 ? "Paid" : "Upcoming"}
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

function cn(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}
