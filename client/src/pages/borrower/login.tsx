import { MobileLayout } from "@/components/layout";
import { useStore, translations } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Search } from "lucide-react";

export default function BorrowerLogin() {
  const { loans, setCurrentBorrowerLoan } = useStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const t = translations;

  const form = useForm({
    defaultValues: {
      phone: "+7"
    }
  });

  const onSubmit = (data: { phone: string }) => {
    const searchDigits = data.phone.replace(/\D/g, '');
    const normalizedSearch = searchDigits.length >= 10 ? searchDigits.slice(-10) : searchDigits;

    // FIND LOAN: Try matching normalized digits
    const loan = loans.find(l => {
        const contactDigits = l.borrowerContact.replace(/\D/g, '');
        const normalizedContact = contactDigits.length >= 10 ? contactDigits.slice(-10) : contactDigits;
        return normalizedContact === normalizedSearch;
    });

    if (loan) {
      setCurrentBorrowerLoan(loan);
      if (loan.status === "pending") {
        setLocation(`/invite/${loan.id}`);
      } else {
        setLocation("/borrower/dashboard");
      }
    } else {
      toast({
        variant: "destructive",
        title: t.no_loan_found,
        description: "Заём не найден. Пожалуйста, убедитесь, что ввели тот же номер, который указал Кредитор."
      });
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
                  value={field.value}
                  onChange={field.onChange}
                  className="rounded-xl h-14 text-2xl text-center" 
                  autoFocus
                />
              )}
            />
          </div>

          <Button type="submit" className="w-full h-14 rounded-2xl text-lg gap-2">
            <Search className="w-5 h-5" />
            {t.find_loan}
          </Button>
        </form>
      </div>
    </MobileLayout>
  );
}
