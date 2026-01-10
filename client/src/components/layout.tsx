import { useStore, translations } from "@/lib/store";
import { Link, useLocation } from "wouter";
import { ChevronLeft, LayoutDashboard, PlusCircle, User, LogOut, MessageSquare, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
}

export function MobileLayout({ children, title, showBack }: MobileLayoutProps) {
  const { currentUserType, setCurrentUser } = useStore();
  const [location, setLocation] = useLocation();
  const t = translations;

  const handleLogout = () => {
    setCurrentUser(null);
    setLocation("/");
  };

  const handleContactDev = () => {
    window.open("https://t.me/replit", "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative shadow-2xl border-x border-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-border px-4 py-4 h-auto flex flex-col items-start gap-4">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(showBack || (location !== "/" && location !== "/welcome" && location !== "/")) && (
              <button 
                onClick={() => window.history.back()}
                className="p-1 -ml-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {location === "/" ? (
              <div className="flex items-center gap-3">
                  <img 
                      src="/logo.png" 
                      alt="Meloan" 
                      className="h-10 w-auto object-contain"
                  />
              </div>
            ) : (
              <h1 className="font-display font-bold text-lg text-gray-900">{title}</h1>
            )}
          </div>
          
          {currentUserType && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="rounded-full text-muted-foreground hover:text-primary"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          )}
        </div>

        {location === "/" && (
          <p className="text-sm font-medium text-gray-600 leading-relaxed max-w-[300px] px-1">
            Контролируйте частные займы, платежи и расписки в одном приложении
          </p>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-32">
        {children}
        
        {/* Contact Developer at bottom of every page content */}
        <div className="mt-8 mb-4 flex justify-center">
            <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-muted-foreground hover:text-primary gap-2"
                onClick={handleContactDev}
            >
                <MessageSquare className="w-4 h-4" />
                Связаться с разработчиком
            </Button>
        </div>
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
