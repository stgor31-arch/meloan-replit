import { MobileLayout } from "@/components/layout";
import { useStore, translations } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ShieldCheck, UserCircle2, LogOut, ChevronRight, Info } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Mock stories for the carousel
const STORIES = [
    { id: 1, title: "Как это работает?", icon: <Info className="w-6 h-6" />, color: "bg-blue-500" },
    { id: 2, title: "Преимущества", icon: <ShieldCheck className="w-6 h-6" />, color: "bg-green-500" },
    { id: 3, title: "Безопасность", icon: <UserCircle2 className="w-6 h-6" />, color: "bg-purple-500" },
    { id: 4, title: "Прозрачность", icon: <Info className="w-6 h-6" />, color: "bg-orange-500" }
];

export default function Welcome() {
  const [, setLocation] = useLocation();
  const { setCurrentUser, currentUserType } = useStore();
  const t = translations;
  const scrollRef = useRef<HTMLDivElement>(null);

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
      <div className="flex flex-col space-y-8 pb-10">
        {/* Top Bar with Logo, Title and Logout */}
        <div className="flex items-center justify-between px-2 pt-2">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-display font-bold text-gray-900 leading-none">Meloan</h1>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Simple Lending</p>
                </div>
            </div>
            {currentUserType && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setCurrentUser(null)}
                    className="rounded-full text-muted-foreground"
                >
                    <LogOut className="w-5 h-5" />
                </Button>
            )}
        </div>

        {/* Stories Carousel */}
        <div className="relative">
            <div 
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar snap-x"
            >
                {STORIES.map((story) => (
                    <div 
                        key={story.id}
                        className="flex-shrink-0 w-28 h-40 rounded-2xl p-3 flex flex-col justify-between snap-start shadow-sm border border-border bg-white"
                    >
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", story.color)}>
                            {story.icon}
                        </div>
                        <p className="text-xs font-bold leading-tight">{story.title}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 space-y-4">
            <div className="text-center space-y-1 mb-6">
                <h2 className="text-2xl font-display font-bold text-gray-900">Добро пожаловать</h2>
                <p className="text-muted-foreground text-sm">Выберите вашу роль в системе</p>
            </div>

            <Button 
                onClick={handleLender}
                className="w-full h-20 rounded-3xl text-xl font-semibold flex items-center justify-between px-6 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <span className="text-left leading-tight">{t.lender}</span>
                </div>
                <ChevronRight className="w-6 h-6 opacity-50" />
            </Button>

            <Button 
                variant="outline"
                onClick={handleBorrower}
                className="w-full h-20 rounded-3xl text-xl font-semibold flex items-center justify-between px-6 border-2 hover:bg-gray-50 hover:scale-[1.02] transition-transform"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <UserCircle2 className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-left leading-tight text-gray-900">{t.borrower}</span>
                </div>
                <ChevronRight className="w-6 h-6 opacity-20" />
            </Button>
        </div>

        <div className="px-6 text-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
                Meloan — это безопасная платформа для частных займов. Мы помогаем структурировать отношения между кредитором и заемщиком.
            </p>
        </div>
      </div>
    </MobileLayout>
  );
}
