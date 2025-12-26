import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, PlusCircle, User, LogOut, Globe } from "lucide-react";
import { useStore, translations } from "@/lib/store";
import { Button } from "./ui/button";

export function MobileLayout({ children, title, showBack = false }: { children: React.ReactNode, title?: string, showBack?: boolean }) {
  const [location, setLocation] = useLocation();
  const isMaster = location.startsWith("/master");
  const { setCurrentUser, language, setLanguage } = useStore();
  const t = translations[language];

  const toggleLanguage = () => {
    setLanguage(language === "ru" ? "en" : "ru");
  };

  return (
    <div className="min-h-screen bg-muted/30 flex justify-center">
      <div className="w-full max-w-md bg-background min-h-screen shadow-2xl relative flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Link href={isMaster ? "/master/dashboard" : "/"}>
                <img src="/attached_assets/LOGO_MELOAN_1766736656113.png" alt="Meloan" className="h-8 w-auto cursor-pointer" />
             </Link>
             {title && <h1 className="font-display font-semibold text-lg text-foreground truncate max-w-[150px]">{title}</h1>}
          </div>
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" onClick={toggleLanguage} className="h-8 w-8 rounded-full">
                <Globe className="h-4 w-4" />
                <span className="text-[10px] ml-0.5 uppercase">{language}</span>
             </Button>
             {isMaster && (
                <Link href="/" onClick={() => setCurrentUser(null)}>
                  <LogOut className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
                </Link>
             )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </main>

        {/* Bottom Nav - Only for Master Dashboard Area */}
        {isMaster && (
          <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border p-2 max-w-md mx-auto">
            <div className="grid grid-cols-3 gap-1">
              <NavItem href="/master/dashboard" icon={LayoutDashboard} label={t.loans} active={location === "/master/dashboard"} />
              <NavItem href="/master/create" icon={PlusCircle} label={t.new_loan} active={location === "/master/create"} />
              <NavItem href="/master/profile" icon={User} label={t.profile} active={location === "/master/profile"} />
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}

function NavItem({ href, icon: Icon, label, active }: { href: string, icon: any, label: string, active: boolean }) {
  return (
    <Link href={href}>
      <div className={cn(
        "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 cursor-pointer",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
      )}>
        <Icon className={cn("h-6 w-6 mb-1", active && "fill-current")} strokeWidth={active ? 2.5 : 2} />
        <span className="text-[10px] font-medium">{label}</span>
      </div>
    </Link>
  );
}
