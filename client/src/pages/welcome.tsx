import { MobileLayout } from "@/components/layout";
import { useStore, translations } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ShieldCheck, UserCircle2 } from "lucide-react";

export default function Welcome() {
  const [, setLocation] = useLocation();
  const { setCurrentUser } = useStore();
  const t = translations;

  const handleLender = () => {
    setCurrentUser("master");
    setLocation("/master/dashboard");
  };

  const handleBorrower = () => {
    setCurrentUser("borrower");
    setLocation("/borrower/login");
  };

  return (
    <MobileLayout title="">
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-12 px-4">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-primary/10 rounded-[2rem] mb-4">
            <ShieldCheck className="w-12 h-12 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-display font-bold text-gray-900 tracking-tight">{t.meloan}</h1>
            <p className="text-muted-foreground mt-2 text-lg">{t.simple_lending}</p>
          </div>
        </div>

        <div className="w-full space-y-4">
          <Button 
            onClick={handleLender}
            className="w-full h-20 rounded-3xl text-xl font-semibold flex items-center justify-between px-6 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
            data-testid="button-select-lender"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-left leading-tight">{t.lender}</span>
            </div>
          </Button>

          <Button 
            variant="outline"
            onClick={handleBorrower}
            className="w-full h-20 rounded-3xl text-xl font-semibold flex items-center justify-between px-6 border-2 hover:bg-gray-50 hover:scale-[1.02] transition-transform"
            data-testid="button-select-borrower"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                <UserCircle2 className="w-6 h-6 text-primary" />
              </div>
              <span className="text-left leading-tight text-gray-900">{t.borrower}</span>
            </div>
          </Button>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          Безопасные займы между людьми
        </p>
      </div>
    </MobileLayout>
  );
}
