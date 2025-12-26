import { MobileLayout } from "@/components/layout";
import { useStore, translations, Loan } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Plus, Wallet } from "lucide-react";

export default function MasterDashboard() {
  const { loans, lenderProfile, language } = useStore();
  const [, setLocation] = useLocation();
  const t = translations[language];

  const activeLoans = loans.filter((l: Loan) => l.status === "active");
  const pendingLoans = loans.filter((l: Loan) => l.status === "pending");

  const totalActive = activeLoans.reduce((sum: number, l: Loan) => sum + l.amount, 0);

  if (!lenderProfile) {
     return (
        <MobileLayout title={t.dashboard}>
           <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
              <div className="p-4 bg-orange-100 rounded-full text-orange-600">
                 <Plus className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-semibold">Welcome to Meloan</h2>
              <p className="text-muted-foreground max-w-xs">Complete your lender profile to start.</p>
              <Link href="/master/profile">
                 <Button className="mt-4 rounded-xl">{t.profile}</Button>
              </Link>
           </div>
        </MobileLayout>
     )
  }

  return (
    <MobileLayout title={t.dashboard}>
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none shadow-xl rounded-3xl overflow-hidden relative">
          <CardContent className="p-6 relative z-10">
            <p className="text-gray-400 text-sm font-medium mb-1">{t.total_active}</p>
            <h2 className="text-4xl font-display font-bold mb-4">
               {new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(totalActive)}
            </h2>
            <div className="flex gap-4">
              <div>
                <p className="text-gray-400 text-xs">Active</p>
                <p className="font-semibold text-lg">{activeLoans.length}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Pending</p>
                <p className="font-semibold text-lg">{pendingLoans.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Link href="/master/create">
            <Button className="w-full h-12 rounded-2xl shadow-lg shadow-primary/20 text-md font-medium" size="lg">
                <Plus className="mr-2 h-5 w-5" /> {t.new_loan}
            </Button>
        </Link>

        <div>
          <h3 className="font-display font-semibold text-lg mb-4">{t.recent_loans}</h3>
          <div className="space-y-3">
            {loans.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">No loans yet.</div>
            ) : (
                loans.map((loan: Loan) => (
                    <div key={loan.id} onClick={() => setLocation(`/master/loan/${loan.id}`)}>
                        <LoanCard loan={loan} language={language} />
                    </div>
                ))
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}

function LoanCard({ loan, language }: { loan: Loan, language: string }) {
    const statusColors: Record<string, string> = {
        active: "bg-green-100 text-green-700 border-green-200",
        pending: "bg-orange-100 text-orange-700 border-orange-200",
        closed: "bg-gray-100 text-gray-700 border-gray-200",
        cancelled: "bg-red-100 text-red-700 border-red-200"
    };

    return (
        <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98]">
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h4 className="font-semibold text-foreground">{loan.borrowerName}</h4>
                        <p className="text-xs text-muted-foreground">{loan.borrowerContact}</p>
                    </div>
                    <Badge variant="outline" className={statusColors[loan.status] + " border-none"}>
                        {loan.status}
                    </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-dashed border-border">
                    <div>
                        <p className="text-[10px] uppercase text-muted-foreground font-semibold">Amount</p>
                        <p className="font-medium text-lg text-primary">
                            {loan.amount.toLocaleString()} ₽
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] uppercase text-muted-foreground font-semibold">Payment</p>
                        <p className="font-medium text-sm mt-1">{loan.monthlyPayment.toLocaleString()} ₽</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
