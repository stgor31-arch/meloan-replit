import { MobileLayout } from "@/components/layout";
import { useStore, translations } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Search, Loader2 } from "lucide-react";
import { useState } from "react";
import { findLoansByPhone } from "@/lib/api";

export default function BorrowerLogin() {
  const { setBorrowerPhone, setCurrentBorrowerLoanId } = useStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const t = translations;
  const [isSearching, setIsSearching] = useState(false);

  const form = useForm({
    defaultValues: {
      phone: "+7"
    }
  });

  const onSubmit = async (data: { phone: string }) => {
    setIsSearching(true);
    try {
      const loans = await findLoansByPhone(data.phone);
      if (loans.length > 0) {
        setBorrowerPhone(data.phone);
        const pendingLoan = loans.find((l: any) => l.status === "pending");
        if (loans.length === 1 && pendingLoan) {
          setCurrentBorrowerLoanId(pendingLoan.id);
          setLocation(`/invite/${pendingLoan.id}`);
        } else {
          setCurrentBorrowerLoanId(loans[0].id);
          setLocation("/borrower/dashboard");
        }
      } else {
        toast({
          variant: "destructive",
          title: t.no_loan_found,
          description: "Заём не найден. Пожалуйста, убедитесь, что ввели тот же номер, который указал Кредитор."
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: t.no_loan_found,
        description: "Заём не найден. Пожалуйста, убедитесь, что ввели тот же номер, который указал Кредитор."
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <MobileLayout title={t.borrower}>
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-display font-bold">{t.enter_phone}</h2>
          <p className="text-muted-foreground text-sm">{t.borrower_login_subtitle}</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
          <div className="space-y-2">
            <Label htmlFor="phone">{t.email_phone}</Label>
            <Controller
              name="phone"
              control={form.control}
              rules={{ required: true }}
              render={({ field }) => (
                <PhoneInput 
                  id="phone" 
                  data-testid="input-borrower-phone"
                  value={field.value}
                  onChange={field.onChange}
                  className="rounded-xl h-14 text-2xl text-center" 
                  autoFocus
                />
              )}
            />
          </div>

          <Button data-testid="button-find-loan" type="submit" className="w-full h-14 rounded-2xl text-lg gap-2" disabled={isSearching}>
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            {t.find_loan}
          </Button>
        </form>
      </div>
    </MobileLayout>
  );
}
