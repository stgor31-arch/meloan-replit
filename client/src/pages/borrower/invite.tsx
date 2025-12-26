import { MobileLayout } from "@/components/layout";
import { useStore, translations } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BorrowerInvite() {
  const [, params] = useRoute("/invite/:id");
  const { loans, updateLoanStatus, lenderProfile, setCurrentBorrowerLoan } = useStore();
  const loanId = params?.id;
  
  // LOGGING TO DEBUG
  console.log("Invite page loanId from URL:", loanId);
  console.log("All loans in store:", loans);

  const loan = loans.find(l => l.id === loanId);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const t = translations;

  const [step, setStep] = useState<1 | 2>(1);
  const [confirmedTerms, setConfirmedTerms] = useState(false);
  const [signedReceipt, setSignedReceipt] = useState(false);

  const form = useForm({
    defaultValues: {
        borrowerName: loan?.borrowerName || "",
        passport: "",
        address: ""
    }
  });

  // Sync borrowerName if loan loads late
  useEffect(() => {
    if (loan) {
      form.setValue("borrowerName", loan.borrowerName);
    }
  }, [loan]);

  if (!loan) {
    return (
      <MobileLayout title="Заём не найден">
        <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6 space-y-4">
          <h3 className="text-lg font-semibold">Заём не найден</h3>
          <p className="text-muted-foreground text-sm">
            Заём с ID "{loanId}" не найден в локальном хранилище этого браузера.
          </p>
          <Button onClick={() => setLocation("/")}>На главную</Button>
        </div>
      </MobileLayout>
    );
  }

  const handleTermsConfirm = () => {
    if (!confirmedTerms) return;
    setStep(2);
    window.scrollTo(0,0);
  };

  const handleSign = (data: { borrowerName: string, passport: string, address: string }) => {
    if (!signedReceipt) return;
    
    updateLoanStatus(loan.id, "active", {
        borrowerPassport: data.passport,
        borrowerAddress: data.address,
        signedAt: new Date().toISOString()
    });

    const updatedLoan = {
        ...loan,
        status: "active" as const,
        borrowerPassport: data.passport,
        borrowerAddress: data.address,
        signedAt: new Date().toISOString()
    };

    setCurrentBorrowerLoan(updatedLoan);

    toast({
        title: "Заём принят!",
        description: "Средства скоро поступят."
    });
    
    setLocation("/borrower/dashboard");
  };

  return (
    <MobileLayout>
      <div className="max-w-md mx-auto py-2">
        <div className="flex items-center justify-center space-x-4 mb-8">
            <div className={cn("flex items-center gap-2", step >= 1 ? "text-primary" : "text-muted-foreground")}>
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold", step >= 1 ? "bg-primary text-white border-primary" : "border-muted-foreground")}>1</div>
                <span className="text-xs font-medium uppercase tracking-wider">{t.term}</span>
            </div>
            <div className="w-8 h-px bg-border" />
            <div className={cn("flex items-center gap-2", step >= 2 ? "text-primary" : "text-muted-foreground")}>
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold", step >= 2 ? "bg-primary text-white border-primary" : "border-muted-foreground")}>2</div>
                <span className="text-xs font-medium uppercase tracking-wider">Подпись</span>
            </div>
        </div>

        <AnimatePresence mode="wait">
            {step === 1 && (
                <motion.div 
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                >
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-display font-bold">Предложение займа</h2>
                        <p className="text-muted-foreground">От {lenderProfile?.name || "Кредитора"}</p>
                    </div>

                    <Card className="border-2 border-primary/10 shadow-lg shadow-primary/5 rounded-3xl overflow-hidden">
                        <div className="h-2 bg-primary w-full" />
                        <CardContent className="p-6 space-y-6">
                            <div className="text-center">
                                <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-widest">{t.amount}</p>
                                <p className="text-4xl font-display font-bold text-primary mt-1">
                                    {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(loan.amount)}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-2xl">
                                <div>
                                    <p className="text-[10px] text-muted-foreground uppercase">{t.rate}</p>
                                    <p className="font-semibold">{loan.ratePercent}%</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-muted-foreground uppercase">{t.term}</p>
                                    <p className="font-semibold">{loan.termMonths} {t.months}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground uppercase">{t.monthly_payment}</p>
                                    <p className="font-semibold">{loan.monthlyPayment.toLocaleString()} ₽</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-muted-foreground uppercase">{t.total_repayment}</p>
                                    <p className="font-semibold">{loan.totalRepayment.toLocaleString()} ₽</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-border">
                        <Checkbox 
                            id="terms" 
                            checked={confirmedTerms}
                            onCheckedChange={(c) => setConfirmedTerms(c as boolean)}
                            className="mt-1"
                        />
                        <Label htmlFor="terms" className="text-sm font-normal leading-relaxed">
                            {t.accept_terms}
                        </Label>
                    </div>

                    <Button 
                        onClick={handleTermsConfirm}
                        disabled={!confirmedTerms}
                        className="w-full h-14 text-lg rounded-2xl"
                    >
                        {t.continue}
                    </Button>
                </motion.div>
            )}

            {step === 2 && (
                <motion.div 
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-display font-bold">Электронная расписка</h2>
                        <p className="text-muted-foreground">Заполните данные для завершения соглашения.</p>
                    </div>

                    <Card className="bg-amber-50/50 border border-amber-200/50 rounded-3xl overflow-hidden">
                        <div className="p-4 bg-amber-100/50 border-b border-amber-200/50 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-amber-700" />
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">{t.lender_data}</span>
                        </div>
                        <CardContent className="p-4 text-xs space-y-2">
                            <p><strong>{t.profile}:</strong> {lenderProfile?.name}</p>
                            <p><strong>{t.passport}:</strong> {lenderProfile?.passport}</p>
                            <p><strong>{t.address}:</strong> {lenderProfile?.address}</p>
                        </CardContent>
                    </Card>

                    <form onSubmit={form.handleSubmit(handleSign)} className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t.contact_name}</Label>
                            <Input {...form.register("borrowerName", { required: true })} className="rounded-xl h-12" />
                        </div>
                        <div className="space-y-2">
                            <Label>{t.passport}</Label>
                            <Input {...form.register("passport", { required: true })} placeholder="1234 567890" className="rounded-xl h-12" />
                        </div>
                        <div className="space-y-2">
                            <Label>{t.address}</Label>
                            <Input {...form.register("address", { required: true })} className="rounded-xl h-12" />
                        </div>

                        <div className="flex items-start gap-3 p-4 mt-6 bg-white rounded-2xl border border-border">
                            <Checkbox 
                                id="receipt" 
                                checked={signedReceipt}
                                onCheckedChange={(c) => setSignedReceipt(c as boolean)}
                                className="mt-1 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                            />
                            <Label htmlFor="receipt" className="text-sm font-normal leading-relaxed">
                                <span className="font-semibold block text-foreground">Юридическое действие</span>
                                {t.receipt_text}
                            </Label>
                        </div>

                        <Button 
                            type="submit" 
                            disabled={!signedReceipt}
                            className="w-full h-14 text-lg rounded-2xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200"
                        >
                            {t.sign_receipt}
                        </Button>
                    </form>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
}
