import { useStore, translations } from "@/lib/store";
import { Link, useLocation } from "wouter";
import { ChevronLeft, LayoutDashboard, PlusCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
}

export function MobileLayout({ children, title, showBack }: MobileLayoutProps) {
  const { currentUserType } = useStore();
  const [location] = useLocation();
  const t = translations;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative shadow-2xl border-x border-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showBack && (
            <button 
              onClick={() => window.history.back()}
              className="p-1 -ml-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <h1 className="font-display font-bold text-lg text-gray-900">{title}</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {children}
      </main>

      {/* Navigation - Only for Master */}
      {currentUserType === "master" && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border p-2 max-w-md mx-auto">
          <div className="grid grid-cols-3 gap-1">
            <NavItem 
              href="/master/dashboard" 
              icon={LayoutDashboard} 
              label={t.loans} 
              active={location === "/master/dashboard"} 
            />
            <NavItem 
              href="/master/create-loan" 
              icon={PlusCircle} 
              label={t.new_loan} 
              active={location === "/master/create-loan"} 
            />
            <NavItem 
              href="/master/profile" 
              icon={User} 
              label={t.profile} 
              active={location === "/master/profile"} 
            />
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active: boolean }) {
  return (
    <Link href={href}>
      <a className={cn(
        "flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200",
        active ? "text-primary bg-primary/5" : "text-muted-foreground hover:bg-gray-50"
      )}>
        <Icon className={cn("w-6 h-6 mb-1", active ? "stroke-[2.5px]" : "stroke-[2px]")} />
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </a>
    </Link>
  );
}
