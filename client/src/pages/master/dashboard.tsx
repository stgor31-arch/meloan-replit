import { MobileLayout } from "@/components/layout";
import { useStore, translations } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { CheckCircle2, FileText, ChevronRight, Share2, Plus, BarChart3, ChevronDown, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function MasterDashboard() {
  const { loans, lenderProfile } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const t = translations;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'pending');

  const handleCreate = () => {
    if (!lenderProfile) {
      toast({
        title: t.profile_missing,
        description: t.fill_profile_first,
        variant: "destructive"
      });
      setLocation("/master/profile");
      return;
    }
    setLocation("/master/create-loan");
  };

  return (
    <MobileLayout title={t.dashboard}>
      <div className="space-y-6 relative">
        {/* Monetization Top Drawer (Handle) */}
        <div 
            className="bg-gradient-to-r from-orange-400 to-amber-500 rounded-2xl p-3 flex items-center justify-between text-white shadow-lg cursor-pointer hover:scale-[1.01] transition-transform"
            onClick={() => setIsDrawerOpen(true)}
        >
            <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5" />
                <span className="font-bold text-sm">Подбери тариф</span>
            </div>
            <ChevronDown className="w-5 h-5 opacity-70" />
        </div>

        {/* Drawer Content Overlay */}
        <AnimatePresence>
            {isDrawerOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsDrawerOpen(false)}
                        className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
                    />
                    <motion.div 
                        initial={{ y: "-100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "-100%" }}
                        className="fixed top-0 left-0 right-0 max-w-md mx-auto bg-white z-[70] rounded-b-[2.5rem] shadow-2xl p-6 overflow-y-auto max-h-[90vh]"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-display font-bold">Выберите тариф</h3>
                            <Button variant="ghost" size="sm" onClick={() => setIsDrawerOpen(false)}>Закрыть</Button>
                        </div>

                        <div className="space-y-4">
                            {/* Free */}
                            <Card className="border-2 border-muted rounded-3xl overflow-hidden">
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-lg">Free</h4>
                                        <span className="text-xl font-bold">Бесплатно</span>
                                    </div>
                                    <ul className="text-sm text-muted-foreground space-y-2">
                                        <li>• До 2 займов у Кредитора</li>
                                        <li>• Для Заемщика всегда бесплатно</li>
                                    </ul>
                                    <Button className="w-full mt-4 rounded-xl" variant="outline">Выбрано</Button>
                                </CardContent>
                            </Card>

                            {/* Expert */}
                            <Card className="border-2 border-orange-200 bg-orange-50/30 rounded-3xl overflow-hidden">
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-lg text-orange-700">Expert</h4>
                                        <span className="text-xl font-bold text-orange-700">149 ₽ / мес.</span>
                                    </div>
                                    <ul className="text-sm text-orange-700/70 space-y-2">
                                        <li>• До 10 займов Кредитора</li>
                                        <li>• Досудебная претензия</li>
                                    </ul>
                                    <Button className="w-full mt-4 rounded-xl bg-orange-500 hover:bg-orange-600">Выбрать</Button>
                                </CardContent>
                            </Card>

                            {/* PRO */}
                            <Card className="border-2 border-primary bg-primary/5 rounded-3xl overflow-hidden">
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-lg text-primary">PRO</h4>
                                            <Sparkles className="w-4 h-4 text-primary fill-primary" />
                                        </div>
                                        <span className="text-xl font-bold text-primary">399 ₽ / мес.</span>
                                    </div>
                                    <ul className="text-sm text-primary/70 space-y-2">
                                        <li>• Займы без ограничений</li>
                                        <li>• Все документы и аналитика</li>
                                        <li>• Учет поступающих средств</li>
                                    </ul>
                                    <Button className="w-full mt-4 rounded-xl shadow-lg shadow-primary/20">Выбрать</Button>
                                </CardContent>
                            </Card>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>

        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Meloan</h2>
            <p className="text-sm text-muted-foreground">{t.simple_lending}</p>
          </div>
          <Button size="icon" className="rounded-2xl w-12 h-12 shadow-lg shadow-primary/20" onClick={handleCreate}>
            <Plus className="w-6 h-6" />
          </Button>
        </div>

        {/* Main Dashboard Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card 
            className="bg-primary text-white border-none rounded-3xl shadow-xl shadow-primary/20 cursor-pointer"
            onClick={() => {
                const recentSection = document.getElementById('recent-loans');
                recentSection?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <CardContent className="p-4 flex flex-col justify-between h-28">
              <p className="text-xs text-white/80 uppercase font-bold tracking-wider">{t.total_active}</p>
              <div className="flex items-end justify-between">
                <h3 className="text-3xl font-display font-bold">{activeLoans.length}</h3>
                <ChevronDown className="w-5 h-5 text-white/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-none rounded-3xl shadow-md" onClick={() => setLocation("/master/profile")}>
            <CardContent className="p-4 flex flex-col justify-between h-28">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{t.profile}</p>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Analytics (PRO) */}
        <div className="space-y-4">
            <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Аналитика портфеля
            </h3>
            <Card className="rounded-[2rem] border-none bg-gray-100/50 p-6 text-center group cursor-not-allowed">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <BarChart3 className="w-6 h-6 text-muted-foreground" />
                </div>
                <h4 className="font-bold text-gray-500">Доступно в тарифе PRO</h4>
                <p className="text-xs text-muted-foreground mt-1">Динамика движения денег и доходов</p>
                <Button variant="outline" size="sm" className="mt-4 rounded-xl" onClick={(e) => { e.stopPropagation(); setIsDrawerOpen(true); }}>
                    Улучшить тариф
                </Button>
            </Card>
        </div>

        {/* Recent Loans Section */}
        <div className="space-y-4" id="recent-loans">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-display font-bold text-lg">{t.recent_loans}</h3>
          </div>

          <div className="space-y-3">
            {activeLoans.map((loan) => (
              <Card 
                key={loan.id} 
                className="rounded-3xl border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden group"
                onClick={() => setLocation(`/master/loan/${loan.id}`)}
              >
                <CardContent className="p-0">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <CheckCircle2 className="w-6 h-6 text-gray-300 group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{loan.borrowerName}</p>
                        <p className="text-xs text-muted-foreground">{loan.borrowerContact}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{loan.amount.toLocaleString()} ₽</p>
                      <p className="text-[10px] text-primary font-bold uppercase tracking-tighter bg-primary/5 px-2 py-0.5 rounded-full inline-block">
                        {loan.status}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50/50 px-4 py-3 flex items-center justify-between border-t border-gray-100">
                    <div className="flex gap-4">
                      <div className="text-center">
                        <p className="text-[8px] text-muted-foreground uppercase font-bold">{t.rate}</p>
                        <p className="text-xs font-bold">{loan.ratePercent}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[8px] text-muted-foreground uppercase font-bold">{t.term}</p>
                        <p className="text-xs font-bold">{loan.termMonths}м</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(`${window.location.origin}/invite/${loan.id}`);
                      toast({ title: t.link_copied });
                    }}>
                      <Share2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {activeLoans.length === 0 && (
              <div className="text-center py-12 px-6 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-200" />
                </div>
                <h4 className="font-bold text-gray-400">Нет активных займов</h4>
                <p className="text-sm text-gray-400 mt-1">Создайте свой первый заём, чтобы начать.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
