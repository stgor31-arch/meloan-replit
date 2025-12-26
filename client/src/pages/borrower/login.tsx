import { MobileLayout } from "@/components/layout";
import { useStore, translations, Loan } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Search } from "lucide-react";

export default function BorrowerLogin() {
  const { loans, setCurrentBorrowerLoan, language } = useStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const t = translations[language];

  const form = useForm({
    defaultValues: {
      phone: ""
    }
  });

  const onSubmit = (data: { phone: string }) => {
    // Find loan where borrowerContact matches the input phone
    const loan = loans.find(l => 
        l.borrowerContact.replace(/\D/g, '').includes(data.phone.replace(/\D/g, '')) &&
        (l.status === "pending" || l.status === "active")
    );

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
        description: "Please check the number or contact your lender."
      });
    }
  };

  return (
    <MobileLayout title={t.borrower}>
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-display font-bold">{t.enter_phone}</h2>
          <p className="text-muted-foreground text-sm">We'll find your loan proposal by your phone number.</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
          <div className="space-y-2">
            <Label htmlFor="phone">{t.email_phone}</Label>
            <Input 
              id="phone" 
              {...form.register("phone", { required: true })} 
              className="rounded-xl h-14 text-lg text-center" 
              placeholder="+7 (999) 000-00-00"
              autoFocus
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
