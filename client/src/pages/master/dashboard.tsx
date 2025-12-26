import { MobileLayout } from "@/components/layout";
import { useStore, Loan } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus } from "lucide-react";

export default function MasterDashboard() {
  const { loans, lenderProfile } = useStore();

  const activeLoans = loans.filter((l: Loan) => l.status === "active");
  const pendingLoans = loans.filter((l: Loan) => l.status === "pending");

  const totalActive = activeLoans.reduce((sum: number, l: Loan) => sum + l.amount, 0);

  if (!lenderProfile) {
     return (
        <MobileLayout title="Dashboard">
           <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
              <div className="p-4 bg-orange-100 rounded-full text-orange-600">
                 <Plus className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-semibold">Welcome to Meloan</h2>
              <p className="text-muted-foreground max-w-xs">To start lending, please complete your lender profile first.</p>
              <Link href="/master/profile">
                 <Button className="mt-4 rounded-xl">Complete Profile</Button>
              </Link>
           </div>
        </MobileLayout>
     )
  }

  return (
    <MobileLayout title="Overview">
      <div className="space-y-6">
        {/* Stats Card */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none shadow-xl rounded-3xl overflow-hidden relative">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none" />
          <CardContent className="p-6 relative z-10">
            <p className="text-gray-400 text-sm font-medium mb-1">Total Active Loans</p>
            <h2 className="text-4xl font-display font-bold mb-4">
               {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(totalActive)}
            </h2>
            <div className="flex gap-4">
              <div>
                <p className="text-gray-400 text-xs">Active Loans</p>
                <p className="font-semibold text-lg">{activeLoans.length}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Pending</p>
                <p className="font-semibold text-lg">{pendingLoans.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <Link href="/master/create">
            <Button className="w-full h-12 rounded-2xl shadow-lg shadow-primary/20 text-md font-medium" size="lg">
                <Plus className="mr-2 h-5 w-5" /> Create New Loan
            </Button>
        </Link>

        {/* Recent Loans */}
        <div>
          <h3 className="font-display font-semibold text-lg mb-4">Recent Loans</h3>
          <div className="space-y-3">
            {loans.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">No loans created yet.</div>
            ) : (
                loans.map((loan: Loan) => (
                    <LoanCard key={loan.id} loan={loan} />
                ))
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}

function LoanCard({ loan }: { loan: Loan }) {
    const statusColors: Record<string, string> = {
        active: "bg-green-100 text-green-700 border-green-200",
        pending: "bg-orange-100 text-orange-700 border-orange-200",
        closed: "bg-gray-100 text-gray-700 border-gray-200",
        draft: "bg-gray-100 text-gray-500 border-gray-200",
        cancelled: "bg-red-100 text-red-700 border-red-200"
    };

    return (
        <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform">
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h4 className="font-semibold text-foreground">{loan.borrowerName}</h4>
                        <p className="text-xs text-muted-foreground">{loan.borrowerContact}</p>
                    </div>
                    <Badge variant="outline" className={statusColors[loan.status] + " border shadow-none"}>
                        {loan.status}
                    </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-dashed border-border">
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Amount</p>
                        <p className="font-medium text-lg text-primary">
                            {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(loan.amount)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Next Payment</p>
                        <p className="font-medium text-sm mt-1">
                            {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(loan.monthlyPayment)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Due Oct 25</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
