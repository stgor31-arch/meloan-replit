import { MobileLayout } from "@/components/layout";
import { useStore, Loan } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, ShieldCheck, UserCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BorrowerInvite() {
  const [, params] = useRoute("/invite/:id");
  const { loans, updateLoanStatus, lenderProfile } = useStore();
  const loanId = params?.id;
  const loan = loans.find(l => l.id === loanId);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

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

  if (!loan) {
      return (
          <MobileLayout>
              <div className="flex items-center justify-center h-screen">
                  <p>Loan not found or expired.</p>
              </div>
          </MobileLayout>
      )
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

    toast({
        title: "Loan Accepted!",
        description: "The funds are on their way."
    });
    
    setLocation("/borrower/dashboard");
  };

  return (
    <MobileLayout>
      <div className="max-w-md mx-auto py-6">
        {/* Progress Stepper */}
        <div className="flex items-center justify-center space-x-4 mb-8">
            <div className={cn("flex items-center gap-2", step >= 1 ? "text-primary" : "text-muted-foreground")}>
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold", step >= 1 ? "bg-primary text-white border-primary" : "border-muted-foreground")}>1</div>
                <span className="text-sm font-medium">Terms</span>
            </div>
            <div className="w-8 h-px bg-border" />
            <div className={cn("flex items-center gap-2", step >= 2 ? "text-primary" : "text-muted-foreground")}>
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold", step >= 2 ? "bg-primary text-white border-primary" : "border-muted-foreground")}>2</div>
                <span className="text-sm font-medium">Sign</span>
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
                        <h2 className="text-2xl font-display font-bold">Loan Offer</h2>
                        <p className="text-muted-foreground">Review the terms proposed by {lenderProfile?.name || "The Lender"}</p>
                    </div>

                    <Card className="border-2 border-primary/10 shadow-lg shadow-primary/5 rounded-3xl overflow-hidden">
                        <div className="h-2 bg-primary w-full" />
                        <CardContent className="p-6 space-y-6">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground uppercase font-semibold tracking-wider">Amount</p>
                                <p className="text-4xl font-display font-bold text-primary mt-1">
                                    {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(loan.amount)}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-2xl">
                                <div>
                                    <p className="text-xs text-muted-foreground">Rate</p>
                                    <p className="font-semibold">{loan.ratePercent}% APR</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Term</p>
                                    <p className="font-semibold">{loan.termMonths} Months</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Payment</p>
                                    <p className="font-semibold">{loan.monthlyPayment.toLocaleString()} RUB/mo</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Total Repay</p>
                                    <p className="font-semibold">{loan.totalRepayment.toLocaleString()} RUB</p>
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
                            I confirm that I have reviewed the loan terms above and agree to proceed with the signing process.
                        </Label>
                    </div>

                    <Button 
                        onClick={handleTermsConfirm}
                        disabled={!confirmedTerms}
                        className="w-full h-14 text-lg rounded-2xl"
                    >
                        Continue
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
                        <h2 className="text-2xl font-display font-bold">Digital Receipt</h2>
                        <p className="text-muted-foreground">Fill in your details to finalize the agreement.</p>
                    </div>

                    <Card className="bg-amber-50/50 border border-amber-200/50 rounded-2xl">
                        <CardContent className="p-4 text-xs text-amber-900/80 leading-relaxed">
                            <p className="font-semibold mb-2 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" /> 
                                Legal Binding
                            </p>
                            By signing this digital receipt, you acknowledge receiving the funds and commit to repaying them according to the schedule. This serves as a formal IOU between individuals.
                        </CardContent>
                    </Card>

                    <form onSubmit={form.handleSubmit(handleSign)} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input {...form.register("borrowerName", { required: true })} className="rounded-xl h-12" />
                        </div>
                        <div className="space-y-2">
                            <Label>Passport Series & Number</Label>
                            <Input {...form.register("passport", { required: true })} placeholder="1234 567890" className="rounded-xl h-12" />
                        </div>
                        <div className="space-y-2">
                            <Label>Residential Address</Label>
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
                                <span className="font-semibold block text-foreground">Conclusive Action</span>
                                I confirm receiving the funds and promise to repay the loan plus interest as per the schedule.
                            </Label>
                        </div>

                        <Button 
                            type="submit" 
                            disabled={!signedReceipt}
                            className="w-full h-14 text-lg rounded-2xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200"
                        >
                            Sign & Accept Loan
                        </Button>
                    </form>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
}
